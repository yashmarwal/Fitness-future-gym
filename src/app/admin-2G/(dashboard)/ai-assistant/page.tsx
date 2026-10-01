import AiAssistantChat from "@/frontend/components/admin/AiAssistantChat";

// No separate page header — AiAssistantChat's own empty-state hero already
// says "Ask AI" with a near-identical read-only description, so the two
// were just repeating each other above the fold. flex-1/min-h-0 moved
// directly here (AiAssistantChat is now a direct child of admin layout's
// own flex column `main`, which is what it needs to size against) instead
// of a hardcoded h-[calc(100vh-...)]: that magic number never quite
// matched the real header height, and — the actual bug — vh doesn't
// shrink when a mobile keyboard opens. This way the chat fills whatever
// space the layout (dvh-based, see layout.tsx) actually gives it, which
// correctly shrinks with the keyboard.
export default function AdminAiAssistantPage() {
  return <AiAssistantChat />;
}
