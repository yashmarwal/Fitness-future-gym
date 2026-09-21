import "server-only";

// Provider-agnostic: anything that speaks the OpenAI-style /chat/completions
// API works — Groq (the default), Mistral, Cerebras, OpenRouter, GitHub
// Models, OpenAI itself. Switching provider is an environment-variable change:
//   AI_API_KEY   (required) the provider's key
//   AI_BASE_URL  (optional) default https://api.groq.com/openai/v1
//   AI_MODEL     (optional) default openai/gpt-oss-120b
// Free plans deprecate models from time to time; if the AI starts failing
// with "the model may no longer exist", set AI_MODEL to a current one from
// the provider's model list.
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
// Groq retired llama-3.3-70b-versatile on 2026-08-16; gpt-oss-120b is their
// production replacement and supports tool calling.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export function getAiConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.AI_MODEL || DEFAULT_MODEL,
  };
}

// gpt-oss models "think" before answering and those tokens count against
// max_tokens, so a short answer budget can be eaten entirely by reasoning.
// Low effort keeps replies fast and leaves room for the text. Only sent to
// gpt-oss models — other providers/models may reject the field.
export function modelExtras(model: string): { reasoning_effort?: "low" } {
  return /gpt-oss/i.test(model) ? { reasoning_effort: "low" } : {};
}

// Provider error bodies can echo credentials (Google's did), so they never go
// to a UI or a log unredacted.
export function redactSecrets(text: string): string {
  return text.replace(/gsk_[\w-]+|sk-[\w-]+|AIza[\w-]+|AQ\.[\w-]+|Bearer\s+\S+/g, "[redacted]");
}

// Pulls the provider's own one-line reason out of an error body (OpenAI-style
// {"error":{"message","code"}}), redacted and capped. Only used for 400/404,
// where "what exactly was rejected" is the whole diagnosis.
function providerReason(body: string): { code: string; message: string } {
  try {
    const err = JSON.parse(body)?.error;
    return {
      code: typeof err?.code === "string" ? err.code : "",
      message: typeof err?.message === "string" ? redactSecrets(err.message).slice(0, 200) : "",
    };
  } catch {
    return { code: "", message: "" };
  }
}

export function friendlyAiError(status: number, body = ""): string {
  if (status === 401 || status === 403) {
    return "The AI service rejected the API key — it may be wrong, revoked, or from a suspended account. Set a valid AI_API_KEY in the environment settings, then redeploy.";
  }
  if (status === 400 || status === 404) {
    const { code, message } = providerReason(body);
    const modelGone = status === 404 || /model_not_found|model_decommissioned|model_not_active/.test(code) || /model.*(not exist|decommission|deprecat|not found)/i.test(message);
    if (modelGone) {
      return "The AI service says the model no longer exists. Set AI_MODEL in the environment settings to a current model from the provider's list (or remove AI_MODEL to use the default), then redeploy.";
    }
    return `The AI service rejected the request${message ? `: ${message}` : ""}. This isn't necessarily the model — try rephrasing or asking again.`;
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
        max_tokens: (params.maxTokens ?? 500) + 800, // headroom for reasoning tokens
        ...modelExtras(model),
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
