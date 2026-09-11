const REVIEW_FLAG_DESCRIPTIONS: Record<string, string> = {
  R01: "Conteúdo adulto, eleitoral ou político, envolvendo menor ou outro contexto sensível",
  R02: "Processo judicial em curso, prazo iminente ou medida paralela já adotada",
  R03: "Exigência de garantia de resultado ou condição incompatível",
  R04: "Comportamento hostil, ameaçador ou com alto risco de desgaste",
};

export function describeReviewFlags(flags: string[] | null | undefined): string[] {
  if (!flags?.length) {
    return ["Motivo específico não informado; requer análise humana"];
  }

  return flags.map((flag) => {
    const code = flag.trim().toUpperCase();
    const description = REVIEW_FLAG_DESCRIPTIONS[code];
    return description ? `${code}: ${description}` : `${flag}: requer análise humana`;
  });
}

export const READINESS_CHECKLIST_LABELS = {
  case_impact_understood: "Caso e impacto compreendidos",
  priority_confirmed: "Prioridade confirmada",
  decision_maker_identified: "Decisor identificado",
  expectation_aligned: "Expectativa alinhada: sem garantia de resultado ou prazo",
  minimum_evidence_available: "Aviso/print, cronologia e evidências mínimas disponíveis",
} as const;

export const ACTION_LABELS: Record<string, string> = {
  meeting: "Agendar reunião",
  prepare_meeting: "Preparar para reunião",
  qualify: "Continuar qualificação",
  nurture: "Manter em nutrição",
  close: "Encerrar",
  blocked_review: "Aguardar revisão humana",
};
