"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EDITOR");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      alert("Fout bij aanmaken gebruiker");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("EDITOR");

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        placeholder="Naam"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        placeholder="Wachtwoord"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border p-2"
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded border p-2"
      >
        <option value="EDITOR">Editor</option>
        <option value="ADMIN">Admin</option>
      </select>

      <button className="rounded bg-blue-600 px-4 py-2 text-white">
        Gebruiker aanmaken
      </button>
    </form>
  );
}
