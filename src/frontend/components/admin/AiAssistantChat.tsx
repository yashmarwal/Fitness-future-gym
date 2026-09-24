"use client";

import { useRef, useState, useEffect } from "react";

type ChatMessage = { role: "user" | "model"; content: string };

const STARTER_PROMPTS: { text: string; icon: string }[] = [
  { text: "Who's overdue on fees right now?", icon: "payments" },
  { text: "How much revenue this month so far?", icon: "storefront" },
  { text: "Who hasn't checked in recently?", icon: "event_busy" },
  { text: "Any birthdays coming up?", icon: "cake" },
];

// A small robot-in-a-circle badge, shared by the empty-state hero and every
// model bubble's avatar — kept as one function so both stay pixel-identical
// as the AI's "face" throughout the chat rather than drifting apart.
function AiAvatar({ size = "sm", glow = false }: { size?: "sm" | "lg"; glow?: boolean }) {
  const dims = size === "lg" ? "w-14 h-14" : "w-8 h-8";
  const iconSize = size === "lg" ? "text-2xl" : "text-base";
  return (
    <span
      className={`${dims} shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container ${
        glow ? "animate-ai-avatar-glow" : ""
      }`}
    >
      <span className={`material-symbols-outlined ${iconSize} leading-none`}>smart_toy</span>
    </span>
  );
}

// Three dots bouncing in sequence (same shared keyframe, staggered via
// inline animation-delay) — replaces the old plain "Thinking…" text with
// something that actually reads as live activity rather than a stuck label.
function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-tertiary animate-chat-typing-dot"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export default function AiAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setMessages((current) => [...current, { role: "model", content: data.reply }]);
      } else {
        setError(data.message ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-container-low border border-surface-variant/40 rounded-2xl shadow-soft overflow-hidden">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-6">
            <AiAvatar size="lg" glow />
            <div className="flex flex-col gap-1.5 items-center">
              <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-container font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm leading-none">auto_awesome</span>
                Ask AI
              </p>
              <p className="font-body text-sm text-tertiary max-w-sm">
                Ask anything about your members, fees, attendance, or trials — it reads the same data your admin
                pages already show, it just answers in plain English.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => send(prompt.text)}
                  style={{ animationDelay: `${i * 70}ms` }}
                  className="animate-snap-tick flex items-center gap-1.5 font-label text-xs uppercase tracking-wide px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant border border-surface-variant/50 hover:border-primary-container hover:text-primary-container hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base leading-none text-primary-container">
                    {prompt.icon}
                  </span>
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${
              m.role === "user" ? "justify-end animate-chat-in-right" : "justify-start animate-chat-in-left"
            }`}
          >
            {m.role === "model" && <AiAvatar />}
            <div
              className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 font-body text-sm whitespace-pre-wrap leading-relaxed shadow-soft ${
                m.role === "user"
                  ? "bg-primary-container text-on-primary-container rounded-2xl rounded-br-md"
                  : "bg-surface-container text-on-surface border border-surface-variant/40 rounded-2xl rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 justify-start animate-chat-in-left">
            <AiAvatar />
            <div className="bg-surface-container border border-surface-variant/40 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-soft">
              <TypingDots />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-end gap-2 justify-start animate-chat-in-left">
            <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-error-container/30 text-error">
              <span className="material-symbols-outlined text-base leading-none">warning</span>
            </span>
            <div className="bg-error-container/20 text-error border border-error-container/40 px-4 py-3 rounded-2xl rounded-bl-md font-body text-sm max-w-[85%] sm:max-w-[70%]">
              {error}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-surface-variant/40 p-3 sm:p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about members, fees, attendance, trials..."
          disabled={loading}
          className="flex-1 rounded-full bg-surface-container-lowest border border-surface-variant text-on-surface font-body text-sm px-4 py-3 outline-none focus:border-primary-container transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary-container hover:bg-secondary-container text-on-primary-container shadow-soft disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-xl leading-none">arrow_forward</span>
        </button>
      </form>
    </div>
  );
}
