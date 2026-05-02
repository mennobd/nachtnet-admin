"use client";

import { useEffect, useRef } from "react";

const IDLE_MS = 8 * 60 * 60 * 1000;

export default function SessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/logout";
      document.body.appendChild(form);
      form.submit();
    }, IDLE_MS);
  }

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
