"use client";

import { useRef, useState, useEffect } from "react";

type ChatMessage = { role: "user" | "model"; content: string };

const STARTER_PROMPTS = [
  "Who's overdue on fees right now?",
  "How much revenue this month so far?",
  "Who hasn't checked in recently?",
  "Any birthdays coming up?",
];

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
    <div className="flex flex-col flex-1 min-h-0 bg-surface-container-low border border-surface-variant/40 shadow-hard">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-4 items-start">
            <p className="font-body text-sm text-tertiary max-w-md">
              Ask anything about your members, fees, attendance, or trials — it reads the same data your admin
              pages already show, it just answers in plain English.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="font-label text-xs uppercase tracking-wide px-3 py-2 bg-surface-container text-on-surface-variant border border-surface-variant/50 hover:border-primary-container hover:text-primary-container transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 font-body text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface border border-surface-variant/40"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container text-tertiary border border-surface-variant/40 px-4 py-3 font-body text-sm">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-error-container/20 text-error border border-error-container/40 px-4 py-3 font-body text-sm max-w-[85%] sm:max-w-[70%]">
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
          className="flex-1 bg-surface-container-lowest border border-surface-variant text-on-surface font-body text-sm px-4 py-3 outline-none focus:border-primary-container disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-xs uppercase font-bold px-5 py-3 shadow-hard disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
