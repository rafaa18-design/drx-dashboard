/** Decodifica o payload de um JWT real (header.payload.assinatura) sem validar a assinatura. */
export function getUsername(): string {
  try {
    const token = localStorage.getItem("drx_token") ?? "";
    const [, encoded] = token.split(".");
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    const payload = JSON.parse(json);
    return payload.sub ?? "usuário";
  } catch {
    return "usuário";
  }
}
