"use client";

import { useEffect } from "react";

/** Root error boundary (covers the login page and anything outside the app shell). */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    const isStaleChunk =
      /chunk|load failed|failed to fetch|dynamically imported|importing a module/i.test(
        msg,
      );
    if (isStaleChunk && !sessionStorage.getItem("apex-auto-reloaded")) {
      sessionStorage.setItem("apex-auto-reloaded", "1");
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#a3a3a3", marginBottom: 16 }}>
            This usually clears with a refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#fff",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
