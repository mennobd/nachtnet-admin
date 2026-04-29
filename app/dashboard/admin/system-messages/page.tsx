import { prisma } from "@/lib/db";
import SystemMessageForm from "@/components/SystemMessageForm";

export default async function Page() {
  const messages = await prisma.systemMessage.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System Messages</h1>

      <SystemMessageForm />

      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="border rounded-xl p-4 bg-white shadow-sm"
          >
            <p className="font-semibold">{msg.title}</p>
            <p className="text-sm text-slate-600">{msg.message}</p>
            <p className="text-xs mt-2">
              {msg.severity} • {msg.targetDepot}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
