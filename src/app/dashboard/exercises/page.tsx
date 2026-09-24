import Link from "next/link";
import { EXERCISE_GUIDE_CATEGORIES, filterExerciseGuide } from "@/frontend/lib/exerciseGuide";
import ExerciseGuideSearch from "@/frontend/components/dashboard/ExerciseGuideSearch";
import ExerciseGuideList from "@/frontend/components/dashboard/ExerciseGuideList";

// A result cap, not pagination — "upper arms" alone is 292 exercises, and
// sending all of them (each with its full step-by-step instructions) down
// as props for one page load is unnecessary when a search within the
// category narrows it to a handful immediately. The count line makes the
// cap visible instead of silently truncating.
const RESULT_CAP = 80;

export default async function ExerciseGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  // Requires a category or a search before showing anything — the
  // unfiltered set is all 1,324 exercises, which has no reason to ever
  // reach the client at once.
  const results = category || q ? filterExerciseGuide({ category, query: q }) : [];
  const capped = results.slice(0, RESULT_CAP);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Exercise Library</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Search by name or muscle, or browse by category — how to do it, step by step.
      </p>

      <div className="mb-4">
        <ExerciseGuideSearch initialQuery={q ?? ""} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {EXERCISE_GUIDE_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/dashboard/exercises?category=${encodeURIComponent(c.value)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`shrink-0 font-label text-xs uppercase font-bold px-4 py-2 rounded-full transition-colors ${
              category === c.value
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low text-tertiary hover:text-on-surface"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {!category && !q ? (
        <div className="bg-surface-container-low rounded-2xl shadow-soft py-8 px-4 text-center font-body text-sm text-tertiary">
          Pick a category above or search to see exercises.
        </div>
      ) : (
        <>
          {results.length > RESULT_CAP && (
            <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mb-2">
              Showing {RESULT_CAP} of {results.length} — search within this category to narrow it down
            </p>
          )}
          <ExerciseGuideList results={capped} />
        </>
      )}
    </div>
  );
}
