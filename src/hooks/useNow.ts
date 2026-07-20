"use client";

import { useEffect, useState } from "react";

/**
 * Forca um re-render periodico, sem refazer nenhuma chamada de API — usado
 * pra manter textos de "ha quanto tempo" (ex: "2h atras") corretos mesmo com
 * a pagina aberta por um tempo, sem precisar refetch dos dados em si.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
