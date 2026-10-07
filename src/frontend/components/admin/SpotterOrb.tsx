// Spotter AI's "thinking" state — a direct port of a Uiverse.io loader by
// dexter-st (the same designer, same "rotate + three inset box-shadows"
// trick, as the plan-generation loader elsewhere in this app), recolored
// into the brand's warm-orange palette. The original has no text-letter
// children in our use (that part of the source loader animates separate
// floating letters, which doesn't apply to a plain icon), so this is just
// the one rotating element. Shared between AiAssistantChat.tsx's
// typing-indicator row and AdminTabBar.tsx's detached Spotter AI circle —
// the idle avatar everywhere else is untouched.
export default function SpotterOrb({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full animate-spotter-loader-rotate"
      style={{ width: size, height: size, backgroundColor: "transparent", "--orb-scale": size / 180 } as React.CSSProperties}
      role="img"
      aria-label="Spotter AI is thinking"
    />
  );
}
