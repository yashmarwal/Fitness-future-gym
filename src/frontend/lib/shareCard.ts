// Shared by ShareAchievementsCard.tsx, PrCelebration.tsx and
// StreakMilestoneCelebration.tsx — one implementation of "fetch a generated
// card image and hand it to the OS share sheet, or fall back to a plain
// download" instead of three copies that could drift out of sync.

export async function fetchCardFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not generate the card.");
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// File-sharing support (the part that lets a member pick Instagram/WhatsApp
// Status directly from the native share sheet) is mobile-browser-only —
// canShare({files}) is how you detect it, not just whether navigator.share
// exists at all, since some desktop browsers have share() but not file
// support and would throw on files. Falls back to a plain download
// anywhere that isn't available, or if the member's browser throws for any
// reason other than them just closing the share sheet (AbortError).
export async function shareOrDownloadCard(file: File, title: string, text: string): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Any other share failure — fall through to a plain download instead
      // of leaving the member with nothing.
    }
  }
  downloadFile(file);
}
