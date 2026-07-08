"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Lead } from "@/types";
import { useCountUp } from "@/hooks/useCountUp";
import { ChartTooltipBox } from "./ChartTooltipBox";

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const NAVY = "#273F5C";

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface Point {
  label: string;
  full: string;
  leads: number;
}

/** Ponto customizado: rótulo no pico e pulso "ao vivo" no dia atual. */
function ChartDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  peakIndex: number;
  peakValue: number;
}) {
  const { cx, cy, index, dataLength, peakIndex, peakValue } = props;
  if (cx == null || cy == null || index == null) return <g />;

  const isLast = index === dataLength - 1;
  const isPeak = index === peakIndex && peakValue >= 2 && !isLast;

  if (isLast) {
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={7} fill={NAVY} opacity={0.3} className="drx-ping" />
        <circle cx={cx} cy={cy} r={3.5} fill={NAVY} stroke="var(--surface)" strokeWidth={1.5} />
      </g>
    );
  }
  if (isPeak) {
    const labelY = cy - 12 < 14 ? cy + 20 : cy - 10;
    return (
      <g key={`dot-${index}`}>
        <circle cx={cx} cy={cy} r={3.5} fill="var(--surface)" stroke={NAVY} strokeWidth={2} />
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          fontFamily="JetBrains Mono"
          fill={NAVY}
        >
          {peakValue}
        </text>
      </g>
    );
  }
  return <g key={`dot-${index}`} />;
}

/** Série diária de novos leads com alternador de período (7/14/30 dias). */
export function LeadsOverTime({ leads }: { leads: Lead[] }) {
  const [range, setRange] = useState<Range>(14);

  const { data, total, avg, peak, peakIndex } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const key = localDayKey(new Date(l.created_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const series: Point[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      series.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        full: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }),
        leads: counts.get(localDayKey(d)) ?? 0,
      });
    }

    const sum = series.reduce((a, p) => a + p.leads, 0);
    let pk = 0;
    let pkIdx = -1;
    series.forEach((p, i) => {
      if (p.leads > pk) { pk = p.leads; pkIdx = i; }
    });
    return { data: series, total: sum, avg: sum / range, peak: pk, peakIndex: pkIdx };
  }, [leads, range]);

  const totalAnim = useCountUp(total);
  const avgAnim = useCountUp(avg);
  const peakAnim = useCountUp(peak, 700);

  return (
    <div>
      {/* Resumo do período + alternador */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 pt-5">
        <div className="flex items-baseline gap-6 sm:gap-8">
          <div>
            <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.03em" }}>
              {Math.round(totalAnim)}
            </p>
            <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", marginTop: 5, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              no período
            </p>
          </div>
          <div>
            <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: "var(--ink-3)", letterSpacing: "-0.03em" }}>
              {avgAnim.toFixed(1)}
            </p>
            <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", marginTop: 5, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              média / dia
            </p>
          </div>
          <div className="hidden sm:block">
            <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: "var(--ink-4)", letterSpacing: "-0.03em" }}>
              {Math.round(peakAnim)}
            </p>
            <p className="font-mono" style={{ fontSize: 9, color: "var(--ink-4)", marginTop: 5, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              pico
            </p>
          </div>
        </div>

        <div className="flex" style={{ border: "1px solid var(--line)" }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="font-mono"
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                padding: "6px 14px", cursor: "pointer", border: "none",
                background: range === r ? "var(--ink)" : "transparent",
                color: range === r ? "#FFFFFF" : "var(--ink-3)",
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="px-2 sm:px-4 pb-4 pt-3" style={{ height: 264 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 14, right: 16, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="drxLeadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NAVY} stopOpacity={0.24} />
                <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              interval={Math.ceil(data.length / 10) - 1}
              tick={{ fontSize: 10, fill: "var(--ink-4)", fontFamily: "JetBrains Mono" }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, Math.max(peak, 4)]}
              tick={{ fontSize: 10, fill: "var(--ink-4)", fontFamily: "JetBrains Mono" }}
            />
            <Tooltip
              cursor={{ stroke: "var(--ink-4)", strokeDasharray: "3 3" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltipBox
                    title={(payload[0].payload as Point).full}
                    rows={[{
                      color: NAVY,
                      label: "Novos leads",
                      value: String(payload[0].value),
                    }]}
                  />
                ) : null
              }
            />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="var(--ink-4)"
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{
                  value: `média ${avg.toFixed(1)}`,
                  position: "insideTopRight",
                  fontSize: 9,
                  fontFamily: "JetBrains Mono",
                  fill: "var(--ink-4)",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="leads"
              stroke={NAVY}
              strokeWidth={2}
              fill="url(#drxLeadsFill)"
              animationDuration={1000}
              animationEasing="ease-out"
              dot={(p) => (
                <ChartDot
                  {...p}
                  key={`dot-${p.index}`}
                  dataLength={data.length}
                  peakIndex={peakIndex}
                  peakValue={peak}
                />
              )}
              activeDot={{ r: 4.5, fill: NAVY, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
