"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await api.login(username, password);
      localStorage.setItem("drx_token", access_token);
      router.push("/dashboard");
    } catch {
      setError("Usuário ou senha inválida.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full text-sm outline-none transition";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="flex items-center justify-center"
            style={{
              width: 100, height: 100, borderRadius: "50%", background: "var(--ink)",
              boxShadow: "0 8px 24px rgba(15,27,43,0.18)",
            }}
          >
            <div style={{ height: 34, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src="/logo-oficial.png"
                alt="DR&X"
                style={{ height: 85, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
              />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="dc-card" style={{ boxShadow: "0 1px 3px rgba(15,27,43,0.06)" }}>
          <form onSubmit={handleSubmit} className="dc-card-pad space-y-5">
            <div className="text-center mb-2">
              <h1 className="font-display font-semibold" style={{ fontSize: 20, color: "var(--ink)" }}>
                Dias, Rocha &amp; Xavier
              </h1>
              <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Acesso ao sistema comercial</p>
            </div>

            <div>
              <label htmlFor="username" className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>
                Usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu usuário"
                className={`${inputClass} filter-input`}
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} filter-input`}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--ink-4)", background: "none", border: "none", cursor: "pointer", display: "flex",
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", borderRadius: "var(--r-md)", padding: "11px 0",
                fontSize: 14, fontWeight: 600, color: "#FFFFFF",
                background: loading ? "var(--ink-4)" : "var(--ink)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(15,27,43,0.18)",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent)"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--ink)"; }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: 12, color: "var(--ink-4)" }}>
          DR&amp;X Advogados &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  );
}
