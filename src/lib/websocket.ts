const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function createWsConnection(onMessage: (data: unknown) => void): WebSocket {
  const token = typeof window !== "undefined" ? localStorage.getItem("drx_token") : null;
  const ws = new WebSocket(`${WS_URL}/ws/conversations${token ? `?token=${token}` : ""}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      // ignore malformed frames
    }
  };

  ws.onerror = () => {
    // Reconnect after 3s on error
    setTimeout(() => createWsConnection(onMessage), 3000);
  };

  return ws;
}
