"use client";

import { useState } from "react";

export default function SystemMessageForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("INFO");
  const [targetDepot, setTargetDepot] = useState("ALL");

  async function handleSubmit(e: any) {
    e.preventDefault();

    await fetch("/admin/system-messages", {
      method: "POST",
      body: JSON.stringify({
        title,
        message,
        severity,
        targetDepot,
        active: true,
      }),
    });

    location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow">
      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <textarea
        placeholder="Bericht"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="CRITICAL">CRITICAL</option>
      </select>

      <select value={targetDepot} onChange={(e) => setTargetDepot(e.target.value)}>
        <option value="ALL">ALL</option>
        <option value="ZUID">ZUID</option>
        <option value="KLEIWEG">KLEIWEG</option>
        <option value="NACHTNET">NACHTNET</option>
      </select>

      <button className="bg-black text-white px-4 py-2 rounded">
        Opslaan
      </button>
    </form>
  );
}
