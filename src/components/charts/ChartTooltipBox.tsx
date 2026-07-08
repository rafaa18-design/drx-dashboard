"use client";

export interface TooltipRow {
  color?: string;
  label: string;
  value: string;
}

/**
 * Caixa de tooltip padrão dos gráficos — mesma linguagem visual navy
 * dos cards do CRM (surface, borda fina, mono para números).
 */
export function ChartTooltipBox({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "0 10px 28px rgba(15,27,43,0.14)",
        padding: "9px 12px",
        minWidth: 140,
      }}
    >
      {title && (
        <p
          className="font-mono"
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 6,
          }}
        >
          {title}
        </p>
      )}
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: i > 0 ? 4 : 0 }}>
          {r.color && <span style={{ width: 8, height: 8, background: r.color, flexShrink: 0 }} />}
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{r.label}</span>
          <span
            className="font-mono"
            style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginLeft: "auto", paddingLeft: 14 }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
