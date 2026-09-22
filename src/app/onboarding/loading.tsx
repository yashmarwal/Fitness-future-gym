export default function OnboardingLoading() {
  return (
    <div className="min-h-dvh bg-background flex flex-col px-gutter-mobile pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center gap-1 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 animate-pulse ${i === 0 ? "bg-primary-container" : "bg-surface-container-high"}`} />
        ))}
      </div>
      <div className="max-w-md mx-auto w-full flex flex-col gap-4">
        <div className="w-14 h-14 bg-surface-container-high animate-pulse" />
        <div className="h-8 w-2/3 bg-surface-container-high animate-pulse" />
        <div className="h-4 w-full bg-surface-container-high animate-pulse" />
        <div className="h-4 w-5/6 bg-surface-container-high animate-pulse" />
      </div>
    </div>
  );
}
