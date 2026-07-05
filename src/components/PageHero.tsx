"use client";

import { Fragment } from "react";

export interface HeroStat {
  value: string | number;
  label: string;
}

/**
 * Painel-herói navy padrão das páginas do CRM — gradiente, grade de pontos,
 * watermark "&" e estatísticas rápidas à direita (ocultas no mobile).
 */
export function PageHero({
  label,
  title,
  subtitle,
  stats,
}: {
  label: string;
  title: string;
  subtitle?: string;
  stats?: HeroStat[];
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(150deg, #0F1B2B 0%, #16283D 60%, #273F5C 100%)" }}
    >
      {/* Grade de pontos */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />
      {/* Watermark & */}
      <div
        aria-hidden
        className="font-display font-bold"
        style={{
          position: "absolute", right: -18, bottom: -78,
          fontSize: 210, lineHeight: 1, color: "rgba(255,255,255,0.05)",
          pointerEvents: "none", userSelect: "none",
        }}
      >
        &amp;
      </div>
      {/* Linha de luz no topo */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 sm:px-8 py-7">
        <div>
          <p
            className="font-mono mb-2"
            style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            {label}
          </p>
          <h1
            className="font-display font-bold text-2xl sm:text-3xl"
            style={{ color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="font-mono"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {stats?.length ? (
          <div className="hidden md:flex items-center">
            {stats.map((s, i) => (
              <Fragment key={s.label}>
                {i > 0 && <span style={{ width: 1, height: 34, background: "rgba(255,255,255,0.12)" }} />}
                <div className="px-7 first:pl-0 last:pr-0 text-right">
                  <p
                    className="font-mono font-bold leading-none"
                    style={{ fontSize: 26, color: "#FFFFFF", letterSpacing: "-0.02em" }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    {s.label}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
