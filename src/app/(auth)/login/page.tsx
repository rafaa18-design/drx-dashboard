"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPass] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token } = await api.login(username, password);
      localStorage.setItem("drx_token", access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Painel esquerdo — identidade ─────────────────── */}
      <div
        className="hidden lg:flex flex-col w-1/2 p-16 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1B2B 0%, #16283D 55%, #273F5C 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {/* Textura — grade de pontos sutil */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
            backgroundSize: "26px 26px",
            pointerEvents: "none",
          }}
        />

        {/* Watermark tipográfico — eco do "&" da marca */}
        <div
          aria-hidden
          className="font-display font-bold"
          style={{
            position: "absolute",
            right: -60,
            bottom: -120,
            fontSize: 480,
            lineHeight: 1,
            color: "rgba(255,255,255,0.035)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          &amp;
        </div>

        {/* Linha de luz sutil no topo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          }}
        />

        {/* Cantos — moldura sutil tipo selo/plaqueta */}
        {[
          { top: 40, left: 40, borderTop: "1px solid rgba(255,255,255,0.22)", borderLeft: "1px solid rgba(255,255,255,0.22)" },
          { top: 40, right: 40, borderTop: "1px solid rgba(255,255,255,0.22)", borderRight: "1px solid rgba(255,255,255,0.22)" },
          { bottom: 40, left: 40, borderBottom: "1px solid rgba(255,255,255,0.22)", borderLeft: "1px solid rgba(255,255,255,0.22)" },
          { bottom: 40, right: 40, borderBottom: "1px solid rgba(255,255,255,0.22)", borderRight: "1px solid rgba(255,255,255,0.22)" },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: 18, height: 18, pointerEvents: "none", ...pos }} />
        ))}

        {/* Identidade — lockup horizontal: logo + nome colado ao lado */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{ position: "relative", zIndex: 1, transform: "translateX(-48px)" }}
        >
          <img
            src="/logo-oficial.png"
            alt="DR&X"
            style={{
              height: 260,
              width: "auto",
              display: "block",
              filter: "brightness(0) invert(1) drop-shadow(0 6px 20px rgba(0,0,0,0.4))",
            }}
          />
          <div style={{ marginLeft: 20, textAlign: "left" }}>
            <p
              className="font-display font-bold"
              style={{ fontSize: 26, color: "#FFFFFF", letterSpacing: "-0.01em", lineHeight: 1.2, whiteSpace: "nowrap" }}
            >
              Dias, Rocha &amp; Xavier
            </p>
            <p
              className="font-mono"
              style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.26em", textTransform: "uppercase" }}
            >
              Advogados
            </p>
          </div>
        </div>

        {/* Versão */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
          <p
            className="font-mono text-center"
            style={{
              display: "inline-block",
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.22)",
              fontSize: 9,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Asani × DRX · v1.1 · 2026
          </p>
        </div>
      </div>

      {/* ── Painel direito — login ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm animate-fadeIn">

          {/* Header mobile */}
          <div className="lg:hidden mb-10 flex items-center gap-3">
            <img src="/logo-oficial.png" alt="DR&X" style={{ height: 34, width: "auto", display: "block" }} />
            <span
              className="font-mono"
              style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              Dias, Rocha &amp; Xavier
            </span>
          </div>

          {/* Título do form */}
          <div className="mb-8">
            <p
              className="font-mono mb-2"
              style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
            >
              Acesso restrito
            </p>
            <h2
              className="font-display font-bold"
              style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              Entrar no sistema
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="font-mono block mb-2"
                style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}
              >
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="seu usuário"
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                  fontFamily: "DM Sans, sans-serif",
                  borderRadius: 0,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--line)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                className="font-mono block mb-2"
                style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-sm outline-none pr-11"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    fontFamily: "DM Sans, sans-serif",
                    borderRadius: 0,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--line)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-4)", padding: 4, lineHeight: 0 }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    // Olho fechado
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    // Olho aberto
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                className="font-mono flex items-center gap-2"
                style={{ fontSize: 11, color: "var(--danger)", letterSpacing: "0.02em" }}
              >
                <span style={{ display: "inline-block", width: 4, height: 4, background: "var(--danger)", flexShrink: 0 }} />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-medium text-sm"
              style={{
                background: loading ? "var(--ink-3)" : "var(--ink)",
                color: "white",
                borderRadius: 0,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s, box-shadow 0.15s",
                boxShadow: "0 1px 2px rgba(15,27,43,0.1)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(15,27,43,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = loading ? "var(--ink-3)" : "var(--ink)";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,27,43,0.1)";
              }}
            >
              {loading ? "Entrando..." : "Entrar no sistema"}
            </button>
          </form>

          <p
            className="font-mono mt-8 flex items-center gap-2"
            style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            <span style={{ display: "inline-block", width: 12, height: 1, background: "var(--line)" }} />
            Acesso autorizado apenas para equipe DRX
          </p>
        </div>
      </div>
    </div>
  );
}
