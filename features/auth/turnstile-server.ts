import "server-only";

export async function verifyTurnstile(token: string, action: "login" | "signup"): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const hostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);

  if (!secret || !hostnames.length) {
    throw new Error("Turnstile is not configured");
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Turnstile verification is unavailable");

  const result: unknown = await response.json();
  return (
    typeof result === "object" && result !== null &&
    "success" in result && result.success === true &&
    "action" in result && result.action === action &&
    "hostname" in result && typeof result.hostname === "string" &&
    hostnames.includes(result.hostname)
  );
}
