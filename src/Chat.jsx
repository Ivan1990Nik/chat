import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        profiles (
          username
        )
      `)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async () => {
          // при новом сообщении — просто перезагружаем
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await supabase.from("messages").insert({
      content: text,
      user_id: user.id
    });

    setText("");
  };

  return (
    <div>
      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: 10
        }}
      >
        {messages.map(m => (
          <div key={m.id}>
            <b>{m.profiles?.username || "Unknown"}:</b>{" "}
            {m.content}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Сообщение..."
      />
      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
}
