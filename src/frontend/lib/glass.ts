// Shared "restrained glass" shadow recipe — a neutral translucent fill
// (set by the caller, not here) paired with an inset hairline top
// highlight (light catching the glass) plus a soft neutral outer shadow
// (real depth, not a colored glow). Originally lived only in
// dashboard/page.tsx's Quick Actions cards; pulled out once a second
// surface (DashboardTabBar) needed the exact same premium-glass look.
export const GLASS_SHADOW = "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-4px_rgba(0,0,0,0.35)]";
