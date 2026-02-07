import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import Chat from "./Chat";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  if (!user) return <Auth onAuth={setUser} />;

  return (
    <>
      <button onClick={() => supabase.auth.signOut()}>Выйти</button>
      <Chat user={user} />
    </>
  );
}

export default App;
