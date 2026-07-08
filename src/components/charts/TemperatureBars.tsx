"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/types";
import { useCountUp } from "@/hooks/useCountUp";

/** Níveis de qualificação — mesmas cores de status usadas no Funil e em Leads. */
const LEVELS: { key: string; label: string; color: string; desc: string }[] = [
  { key: "auto_meeting", label: "Auto-agendado", color: "#0F7A5C", desc: "score 95–100" },
  { key: "hot",          label: "Quente",        color: "#B3261E", desc: "score 60–90" },
  { key: "warm",         label: "Morno",         color: "#B45309", desc: "score 35–55" },
  { key: "cold",         label: "Frio",          color: "#5C7290", desc: "score 5–25" },
  { key: "disqualified", label: "Desqualificado", color: "#9CACC0", desc: "fora do perfil" },
];

/** Distribuição da base por temperatura de qualificação (barras horizontais). */
export function TemperatureBars({ leads }: { leads: Lead[] }) {
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { rows, max, avgScore } = useMemo(() => {
    const counts = new Map<string, number>();
    let scoreSum = 0;
    for (const l of leads) {
      const key = l.qualification_level ?? "sem_score";
      counts.set(key, (counts.get(key) ?? 0) + 1);
      scoreSum += l.qualification_score;
    }
    const rs = LEVELS.map((lv) => ({ ...lv, value: counts.get(lv.key) ?? 0 }));
    return {
      rows: rs,
      max: rs.reduce((a, r) => Math.max(a, r.value), 1),
      avgScore: leads.length ? scoreSum / leads.length : 0,
    };
  }, [leads]);

  const total = leads.length || 1;
  const scoreAnim = useCountUp(avgScore, 1100);

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Composição geral — barra 100% com respiro de 2px entre segmentos */}
      <div style={{ display: "flex", gap: 2, height: 8, marginBottom: 22 }}>
        {rows.filter((r) => r.value > 0).map((r, i) => (
          <div
            key={r.key}
            className="drx-fadeup"
            title={`${r.label}: ${r.value}`}
            style={{
              width: `${(r.value / total) * 100}%`,
              background: r.color,
              opacity: hover === null || hover === r.key ? 1 : 0.3,
              transition: "opacity 0.2s",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      <div className="space-y-5">
        {rows.map((r, i) => {
          const pct = Math.round((r.value / total) * 100);
          const barPct = Math.round((r.value / max) * 100);
          const dimmed = hover !== null && hover !== r.key;
          return (
            <div
              key={r.key}
              className="drx-fadeup"
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              style={{
                opacity: dimmed ? 0.45 : 1,
                transition: "opacity 0.2s",
                animationDelay: `${120 + i * 90}ms`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2.5">
                  <span style={{ width: 9, height: 9, background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>{r.label}</span>
                  <span className="font-mono hidden sm:inline" style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.06em" }}>
                    · {r.desc}
                  </span>
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  <b style={{ color: "var(--ink)" }}>{r.value}</b>
                  <span style={{ color: "var(--ink-4)" }}> · {pct}%</span>
                </span>
              </div>
              <div style={{ height: 7, background: "var(--line-soft)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: mounted ? `${Math.max(barPct, r.value > 0 ? 3 : 0)}%` : 0,
                    background: r.color,
                    transition: `width 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${150 + i * 110}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between mt-6 pt-4"
        style={{ borderTop: "1px solid var(--line-soft)" }}
      >
        <span className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          Score médio da base
        </span>
        <span className="font-mono font-bold" style={{ fontSize: 16, color: "var(--ink)" }}>
          {scoreAnim.toFixed(0)}
          <span style={{ fontSize: 10, color: "var(--ink-4)", fontWeight: 400 }}> / 100</span>
        </span>
      </div>
    </div>
  );
}
