import "server-only";

// Provider-agnostic: anything that speaks the OpenAI-style /chat/completions
// API works — Groq (the default), Mistral, Cerebras, OpenRouter, GitHub
// Models, OpenAI itself. Switching provider is an environment-variable change:
//   AI_API_KEY   (required) the provider's key
//   AI_BASE_URL  (optional) default https://api.groq.com/openai/v1
//   AI_MODEL     (optional) default llama-3.3-70b-versatile
// Free plans deprecate models from time to time; if the AI starts failing
// with "the model may no longer exist", set AI_MODEL to a current one from
// the provider's model list.
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function getAiConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.AI_MODEL || DEFAULT_MODEL,
  };
}

// Provider error bodies can echo credentials (Google's did), so they never go
// to a UI or a log unredacted.
export function redactSecrets(text: string): string {
  return text.replace(/gsk_[\w-]+|sk-[\w-]+|AIza[\w-]+|AQ\.[\w-]+|Bearer\s+\S+/g, "[redacted]");
}

export function friendlyAiError(status: number): string {
  if (status === 401 || status === 403) {
    return "The AI service rejected the API key — it may be wrong, revoked, or from a suspended account. Set a valid AI_API_KEY in the environment settings, then redeploy.";
  }
  if (status === 400 || status === 404) {
    return "The AI service rejected the request — the model set in AI_MODEL may no longer exist. Check the provider's current model list and update AI_MODEL.";
  }
  if (status === 413) {
    return "That question pulled more data than the AI plan allows in one go — try asking something narrower.";
  }
  if (status === 429) return "The AI service is rate-limited right now (free plans have per-minute and daily limits) — try again in a minute.";
  if (status >= 500) return "The AI service is having trouble — try again shortly.";
  return `The AI service returned an error (${status}).`;
}

// One-shot text generation for background jobs (the owner emails). Unlike the
// chat assistant this NEVER throws and never blocks for long: any problem —
// not configured, rate limit, timeout, bad response — returns null and the
// caller simply sends the email without the AI section. A summary email must
// go out whether or not the AI is having a good day.
export async function generateAiText(params: {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const { apiKey, baseUrl, model } = getAiConfig();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs ?? 20_000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: params.maxTokens ?? 500,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`AI summary skipped (${res.status}):`, redactSecrets(await res.text()));
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error("AI summary skipped:", err instanceof Error ? redactSecrets(err.message) : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
