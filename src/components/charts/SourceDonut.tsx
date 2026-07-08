"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import type { Lead } from "@/types";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * Cores por plataforma — paleta categórica validada (CVD ΔE ≥ 19, contraste ≥ 3:1).
 * Ordem fixa; nunca reatribuída conforme os dados mudam.
 */
const PLATFORM_ORDER: { key: string; label: string; color: string }[] = [
  { key: "instagram", label: "Instagram", color: "#C13584" },
  { key: "tiktok",    label: "TikTok",    color: "#0891B2" },
  { key: "youtube",   label: "YouTube",   color: "#B3261E" },
  { key: "facebook",  label: "Facebook",  color: "#1877F2" },
];

interface Slice {
  key: string;
  label: string;
  color: string;
  value: number;
}

/** Fatia ativa: expande 5px para fora com um leve respiro. */
function ActiveSlice(props: {
  cx?: number; cy?: number;
  innerRadius?: number; outerRadius?: number;
  startAngle?: number; endAngle?: number;
  fill?: string;
}) {
  const { outerRadius = 0 } = props;
  return (
    <Sector
      {...props}
      outerRadius={outerRadius + 5}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
}

/** Donut de origem dos leads — centro interativo e legenda sincronizada. */
export function SourceDonut({ leads }: { leads: Lead[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { slices, total } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const key = (l.platform ?? "outros").toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const known: Slice[] = PLATFORM_ORDER
      .map((p) => ({ ...p, value: counts.get(p.key) ?? 0 }))
      .filter((p) => p.value > 0);
    const other = [...counts.entries()]
      .filter(([k]) => !PLATFORM_ORDER.some((p) => p.key === k))
      .reduce((a, [, v]) => a + v, 0);
    if (other > 0) known.push({ key: "outros", label: "Outros", color: "#5C7290", value: other });

    return { slices: known, total: leads.length };
  }, [leads]);

  const totalAnim = useCountUp(total);
  const hovered = active !== null ? slices[active] : null;

  if (!total) {
    return (
      <p className="px-6 py-10 text-center" style={{ fontSize: 13, color: "var(--ink-4)" }}>
        Sem leads para exibir.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 px-4 sm:px-6 py-5">
      {/* Donut com centro interativo */}
      <div style={{ position: "relative", width: 196, height: 196, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="66%"
              outerRadius="93%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface)"
              strokeWidth={2}
              animationBegin={120}
              animationDuration={900}
              animationEasing="ease-out"
              activeIndex={active ?? undefined}
              activeShape={<ActiveSlice />}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {slices.map((s, i) => (
                <Cell
                  key={s.key}
                  fill={s.color}
                  opacity={active === null || active === i ? 1 : 0.3}
                  style={{ transition: "opacity 0.2s ease", cursor: "pointer" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
          }}
        >
          {hovered ? (
            <>
              <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: hovered.color, letterSpacing: "-0.03em" }}>
                {hovered.value}
              </p>
              <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {hovered.label}
              </p>
              <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", marginTop: 2 }}>
                {Math.round((hovered.value / total) * 100)}%
              </p>
            </>
          ) : (
            <>
              <p className="font-mono font-bold leading-none" style={{ fontSize: 30, color: "var(--ink)", letterSpacing: "-0.03em" }}>
                {Math.round(totalAnim)}
              </p>
              <p className="font-mono" style={{ fontSize: 8.5, color: "var(--ink-4)", marginTop: 5, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                leads
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legenda sincronizada — nome, contagem, % e mini-barra de participação */}
      <div className="flex-1 w-full min-w-0" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {slices.map((s, i) => {
          const pct = Math.round((s.value / total) * 100);
          const dimmed = active !== null && active !== i;
          return (
            <div
              key={s.key}
              className="drx-fadeup"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              style={{
                padding: "7px 10px 9px", cursor: "default",
                background: active === i ? "var(--accent-soft)" : "transparent",
                opacity: dimmed ? 0.45 : 1,
                transition: "background 0.15s, opacity 0.2s",
                animationDelay: `${150 + i * 90}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ width: 10, height: 10, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>{s.label}</span>
                <span className="font-mono" style={{ fontSize: 12, color: "var(--ink)", fontWeight: 700, marginLeft: "auto" }}>
                  {s.value}
                </span>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--ink-4)", width: 38, textAlign: "right" }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 3, background: "var(--line-soft)", marginTop: 7, marginLeft: 23, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", width: mounted ? `${pct}%` : 0, background: s.color,
                    transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${200 + i * 90}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
