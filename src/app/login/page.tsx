"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      alert("Username tidak ditemukan");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) {
      alert("Password salah");
      return;
    }

    alert("Login berhasil");
  };

  return (
    <div>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
