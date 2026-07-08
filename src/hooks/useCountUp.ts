"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima um número do valor anterior até `target` (ease-out cúbico).
 * Retorna o valor corrente — o chamador formata (toFixed, sufixo, etc).
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
