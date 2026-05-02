"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#f1f5f9", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: "1rem", padding: "2.5rem", maxWidth: "28rem", width: "100%", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
          <p style={{ fontSize: "3rem", fontWeight: 700, color: "#e2e8f0", margin: "0 0 0.75rem" }}>500</p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" }}>
            Kritieke fout
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.5rem" }}>
            De applicatie kon niet worden geladen. Probeer de pagina te verversen.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#94a3b8", background: "#f8fafc", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "1.5rem" }}>
              {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
          >
            Pagina verversen
          </button>
        </div>
      </body>
    </html>
  );
}
