"use client";

import { useMemo, useState } from "react";
import type { Lead } from "@/types";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Seg → Dom
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8h–22h

/** Rampa sequencial de um só matiz (navy), do claro ao escuro. */
function cellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "var(--line-soft)";
  const t = count / max;
  if (t <= 0.25) return "rgba(39,63,92,0.18)";
  if (t <= 0.5)  return "rgba(39,63,92,0.40)";
  if (t <= 0.75) return "rgba(39,63,92,0.65)";
  return "#16283D";
}

const LEGEND_STEPS = ["var(--line-soft)", "rgba(39,63,92,0.18)", "rgba(39,63,92,0.40)", "rgba(39,63,92,0.65)", "#16283D"];

/**
 * Heatmap dia da semana × hora com a chegada de leads (últimos 30 dias) —
 * mostra ao escritório quando o WhatsApp mais recebe contato.
 */
export function ArrivalHeatmap({ leads }: { leads: Lead[] }) {
  const [tip, setTip] = useState<{ day: string; hour: number; count: number; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ day: number; hour: number } | null>(null);

  const { lookup, max, busiest, dayTotals } = useMemo(() => {
    const map = new Map<string, number>();
    const totals = new Map<number, number>();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const l of leads) {
      const d = new Date(l.created_at);
      if (d.getTime() < cutoff) continue;
      const key = `${d.getDay()}-${d.getHours()}`;
      map.set(key, (map.get(key) ?? 0) + 1);
      totals.set(d.getDay(), (totals.get(d.getDay()) ?? 0) + 1);
    }
    let m = 0;
    let top: { day: number; hour: number; count: number } | null = null;
    for (const [key, count] of map) {
      if (count > m) m = count;
      const [day, hour] = key.split("-").map(Number);
      if (!top || count > top.count) top = { day, hour, count };
    }
    return { lookup: map, max: m, busiest: top, dayTotals: totals };
  }, [leads]);

  return (
    <div className="px-4 sm:px-6 py-5" style={{ position: "relative" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 600 }}>
          {/* Rótulos das horas */}
          <div style={{ display: "flex", marginLeft: 42, marginRight: 40, marginBottom: 6 }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="font-mono"
                style={{
                  flex: 1, minWidth: 30, textAlign: "center", fontSize: 9,
                  color: hover?.hour === h ? "var(--accent)" : "var(--ink-4)",
                  fontWeight: hover?.hour === h ? 700 : 400,
                  transition: "color 0.15s",
                }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Grade */}
          {DAY_ORDER.map((day, rowIdx) => (
            <div key={day} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <span
                className="font-mono"
                style={{
                  width: 42, flexShrink: 0, fontSize: 10, fontWeight: 600,
                  color: hover?.day === day ? "var(--accent)" : "var(--ink-3)",
                  transition: "color 0.15s",
                }}
              >
                {DAY_LABELS[day]}
              </span>
              <div style={{ display: "flex", flex: 1, gap: 4 }}>
                {HOURS.map((hour, colIdx) => {
                  const count = lookup.get(`${day}-${hour}`) ?? 0;
                  const isPeak = busiest !== null && busiest.day === day && busiest.hour === hour && busiest.count > 1;
                  const isHovered = hover?.day === day && hover?.hour === hour;
                  return (
                    <div
                      key={hour}
                      className="drx-cell-in"
                      style={{
                        flex: 1, minWidth: 26, height: 26,
                        background: cellColor(count, max),
                        cursor: count > 0 ? "pointer" : "default",
                        position: "relative",
                        transform: isHovered ? "scale(1.18)" : undefined,
                        zIndex: isHovered ? 2 : undefined,
                        boxShadow: isHovered ? "0 3px 10px rgba(15,27,43,0.25)" : undefined,
                        outline: isHovered ? "1.5px solid var(--ink)" : "none",
                        transition: "background 0.4s, transform 0.15s, box-shadow 0.15s",
                        animationDelay: `${(rowIdx * HOURS.length + colIdx) * 4}ms`,
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHover({ day, hour });
                        setTip({ day: DAY_LABELS[day], hour, count, x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => { setHover(null); setTip(null); }}
                    >
                      {isPeak && (
                        <span
                          className="drx-ping-box"
                          style={{ position: "absolute", inset: 0, border: "1.5px solid #16283D", pointerEvents: "none" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Total do dia */}
              <span
                className="font-mono"
                style={{
                  width: 40, flexShrink: 0, textAlign: "right", fontSize: 9,
                  color: hover?.day === day ? "var(--accent)" : "var(--ink-4)",
                  fontWeight: hover?.day === day ? 700 : 400,
                  transition: "color 0.15s",
                }}
              >
                {dayTotals.get(day) ?? 0}
              </span>
            </div>
          ))}

          {/* Rodapé: pico + legenda */}
          <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: 12, marginLeft: 42, marginRight: 40 }}>
            {busiest ? (
              <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Pico: {DAY_LABELS[busiest.day]} às {busiest.hour}h · {busiest.count} lead{busiest.count !== 1 ? "s" : ""}
              </p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>menos</span>
              {LEGEND_STEPS.map((c, i) => (
                <span key={i} style={{ width: 14, height: 14, background: c }} />
              ))}
              <span className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>mais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tip && (
        <div
          style={{
            position: "fixed", left: tip.x, top: tip.y - 46, zIndex: 60,
            transform: "translateX(-50%)", pointerEvents: "none",
            background: "var(--ink)", color: "#FFFFFF",
            padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap",
            boxShadow: "0 8px 22px rgba(15,27,43,0.25)",
          }}
        >
          <span className="font-mono" style={{ fontWeight: 700 }}>{tip.day} · {tip.hour}h</span>
          <span style={{ opacity: 0.75 }}> — {tip.count} lead{tip.count !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
