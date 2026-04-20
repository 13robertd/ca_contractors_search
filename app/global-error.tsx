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
    console.error("[Fixd] global error", {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F7F8",
          color: "#0B0F14",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #E4E4E7",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Fixd ran into a problem
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#4B5563" }}>
            Please refresh the page. If this keeps happening, try again in a
            moment.
          </p>
          {error?.digest ? (
            <p
              style={{
                marginTop: 16,
                fontSize: 11,
                color: "#6B7280",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={reset}
              style={{
                background: "#0B0F14",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
