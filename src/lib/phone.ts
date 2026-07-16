/** Remove o prefixo do conector (ex: "uazapi-") de um identificador de conversa/telefone. */
export function stripConnectorPrefix(v: string): string {
  return v.replace(/^[a-zA-Z]+-/, "");
}

/** Formata um telefone bruto (com ou sem prefixo do conector) no padrão brasileiro. */
export function formatPhone(raw: string): string {
  const digits = stripConnectorPrefix(raw).replace(/\D/g, "");
  let country = "";
  let rest = digits;
  if (rest.length >= 12 && rest.startsWith("55")) {
    country = "+55 ";
    rest = rest.slice(2);
  }
  if (rest.length === 11) {
    return `${country}(${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
  }
  if (rest.length === 10) {
    return `${country}(${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`;
  }
  return digits || raw;
}
