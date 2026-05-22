import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function signToken(payload: string): string {
  const secret = process.env.CRM_SECRET ?? "drx-crm-fallback-secret";
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const sig = hmac.digest("hex");
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: "Usuário e senha obrigatórios." }, { status: 400 });
  }

  // Carregar usuários do env
  let users: Record<string, string> = {};
  try {
    users = JSON.parse(process.env.CRM_USERS ?? "{}");
  } catch {
    return NextResponse.json({ error: "Configuração de usuários inválida." }, { status: 500 });
  }

  const storedPassword = users[username];
  if (!storedPassword || storedPassword !== password) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  // Gerar token CRM
  const payload = JSON.stringify({
    sub: username,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const access_token = signToken(payload);

  return NextResponse.json({ access_token, token_type: "bearer" });
}
