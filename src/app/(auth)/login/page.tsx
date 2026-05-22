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
        className="hidden lg:flex flex-col justify-between w-1/2 p-16"
        style={{ background: "var(--ink)" }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--accent)" }}
            />
            <span
              className="font-display font-bold"
              style={{ fontSize: 20, color: "var(--bg)", letterSpacing: "-0.02em" }}
            >
              DRX Advogados
            </span>
          </div>
          <p
            className="font-mono"
            style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            Sistema Comercial · Asani
          </p>
        </div>

        {/* Tagline */}
        <div>
          <h1
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: 48, color: "var(--bg)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            O projeto DRX,<br />
            <em
              className="not-italic"
              style={{ color: "var(--accent)", fontFamily: "DM Sans, sans-serif", fontWeight: 400 }}
            >
              operando.
            </em>
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 360 }}>
            Sistema de atendimento e qualificação de leads com IA Tiago integrada ao pipeline comercial.
          </p>
        </div>

        {/* Versão */}
        <p
          className="font-mono"
          style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          Asani × DRX · v1.1 · 2026
        </p>
      </div>

      {/* ── Painel direito — login ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm animate-fadeIn">

          {/* Header mobile */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="font-display font-bold"
                style={{ fontSize: 18, color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                DRX Advogados
              </span>
            </div>
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
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
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
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
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
                className="font-mono"
                style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.06em" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-medium text-sm"
              style={{
                background: loading ? "var(--ink-3)" : "var(--accent)",
                color: "white",
                borderRadius: 0,
                letterSpacing: "0.04em",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p
            className="font-mono mt-8"
            style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Acesso autorizado apenas para equipe DRX
          </p>
        </div>
      </div>
    </div>
  );
}
