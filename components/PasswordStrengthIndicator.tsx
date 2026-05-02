"use client";

type Strength = { score: number; label: string; color: string };

export function getPasswordStrength(password: string): Strength {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Zwak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Matig", color: "bg-orange-400" };
  return { score, label: "Sterk", color: "bg-green-500" };
}

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const filled = Math.round((score / 5) * 4);

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filled ? color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? "text-red-600" : score <= 3 ? "text-orange-500" : "text-green-600"}`}>
        {label}
        {score <= 1 && password.length > 0 && " — voeg hoofdletters, cijfers of tekens toe"}
      </p>
    </div>
  );
}
