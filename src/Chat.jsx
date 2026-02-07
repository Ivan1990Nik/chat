import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null); // для автопрокрутки вниз

  // Загрузка сообщений с джоином на profiles
  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (
          username
        )
      `)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data);
  };

  // Автопрокрутка вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadMessages();

    // Подписка на новые сообщения
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await supabase.from("messages").insert({
      content: text,
      user_id: user.id
    });

    setText("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", fontFamily: "sans-serif" }}>
      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: 400,
          overflowY: "auto",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          background: "#f9f9f9",
        }}
      >
        {messages.map((m) => {
          const isMine = m.user_id === user.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                background: isMine ? "#70b33e" : "#bb3f3f",
                padding: "8px 12px",
                borderRadius: 16,
                maxWidth: "70%",
                wordBreak: "break-word",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {/* Имя автора показываем только если сообщение чужое */}
              {!isMine && (
                <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>
                  {m.profiles?.username || "Unknown"}
                </div>
              )}
              <div>{m.content}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            background: "#4caf50",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
