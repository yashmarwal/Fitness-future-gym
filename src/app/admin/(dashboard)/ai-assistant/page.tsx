import AiAssistantChat from "@/frontend/components/admin/AiAssistantChat";

export default function AdminAiAssistantPage() {
  return (
    // flex-1/min-h-0 instead of a hardcoded h-[calc(100vh-...)]: that magic
    // number never quite matched the real header height, and — the actual
    // bug — vh doesn't shrink when a mobile keyboard opens. This way the
    // chat fills whatever space the layout (dvh-based, see layout.tsx)
    // actually gives it, which correctly shrinks with the keyboard.
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide">Ask AI</h1>
        <p className="font-body text-sm text-tertiary mt-1">
          Read-only — ask about members, fees, attendance, or trials. It can look things up, not change anything.
        </p>
      </div>
      <AiAssistantChat />
    </div>
  );
}
