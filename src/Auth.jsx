import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const signUp = async () => {
    if (!username.trim()) {
      alert("Введите имя");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      // 👉 создаем профиль
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: username
        });

      if (profileError) {
        console.error("Ошибка создания профиля:", profileError);
      }
    }

    alert("Регистрация успешна! Теперь войдите.");
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) alert(error.message);
    else onAuth(data.user);
  };

  return (
    <div>
      <h2>Login / Register</h2>

      <input
        placeholder="Имя (только при регистрации)"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={signIn}>Войти</button>
      <button onClick={signUp}>Регистрация</button>
    </div>
  );
}
