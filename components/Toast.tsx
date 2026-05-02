"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 3600);
    const remove = setTimeout(onDismiss, 4000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDismiss]);

  const base =
    "flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border transition-all duration-300";
  const typeClasses: Record<ToastType, string> = {
    success: "bg-white border-green-200 text-green-800",
    error: "bg-white border-red-200 text-red-800",
    info: "bg-white border-slate-200 text-slate-800",
  };
  const dot: Record<ToastType, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-slate-400",
  };

  return (
    <div
      className={`${base} ${typeClasses[item.type]} ${
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dot[item.type]}`} />
      <span>{item.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        className="ml-2 shrink-0 text-current opacity-40 hover:opacity-70"
        aria-label="Sluiten"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
