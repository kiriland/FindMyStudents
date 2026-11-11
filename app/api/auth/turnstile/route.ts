import { verifyTurnstile } from "@/features/auth/turnstile-server";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    if (!request.body) throw new Error("Missing body");
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) {
          await reader.cancel();
          return Response.json({ error: "Request too large." }, { status: 413, headers });
        }
        text += decoder.decode(value, { stream: true });
      }
      body = JSON.parse(text + decoder.decode());
    } finally {
      reader.releaseLock();
    }
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  if (
    typeof body !== "object" || body === null ||
    !("token" in body) || typeof body.token !== "string" ||
    !body.token.trim() || body.token.length > 2048 ||
    !("action" in body) || (body.action !== "login" && body.action !== "signup")
  ) {
    return Response.json({ error: "Invalid verification request." }, { status: 400, headers });
  }

  try {
    if (!await verifyTurnstile(body.token, body.action)) {
      return Response.json({ error: "Verification failed." }, { status: 403, headers });
    }
    return Response.json({ success: true }, { headers });
  } catch {
    return Response.json({ error: "Verification unavailable." }, { status: 503, headers });
  }
}
