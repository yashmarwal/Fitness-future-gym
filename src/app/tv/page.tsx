import type { Metadata } from "next";
import TvFeed from "@/frontend/components/tv/TvFeed";

// Public, no-login — meant to be opened once on a gym TV/display device and
// left running. See /api/tv/feed for what it shows and why it's safe to be
// unauthenticated (first names + achievements only, nothing sensitive).
export const metadata: Metadata = {
  title: "Live — Fitness Future Gym",
  robots: { index: false, follow: false },
};

export default function TvPage() {
  return <TvFeed />;
}
