import { getMemberSession } from "@/backend/auth/session";
import { listTodaysFoodLogs, listFrequentFoods } from "@/backend/services/nutrition";
import { listSavedMeals } from "@/backend/services/savedMeals";
import FoodLogForm from "@/frontend/components/dashboard/FoodLogForm";
import SavedMealsSection from "@/frontend/components/dashboard/SavedMealsSection";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function NutritionPage() {
  const session = await getMemberSession();
  const [logs, frequentFoods, savedMeals] = await Promise.all([
    listTodaysFoodLogs(session!.memberId),
    listFrequentFoods(session!.memberId),
    listSavedMeals(session!.memberId),
  ]);

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.proteinG ?? 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbsG ?? 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fatG ?? 0), 0);
  // Grams, not calories, drive the split — the same convention
  // DashboardSnapshot's own macro bar uses, so the two stay readable the
  // same way instead of one page weighting fat 2x by calorie density.
  const macroGrams = totalProtein + totalCarbs + totalFat;
  const proteinPct = macroGrams > 0 ? Math.round((totalProtein / macroGrams) * 100) : 0;
  const carbsPct = macroGrams > 0 ? Math.round((totalCarbs / macroGrams) * 100) : 0;
  const fatPct = macroGrams > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Today&apos;s Food Log</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Not sure of your daily targets? Check the{" "}
        <a href="/calculator" className="text-primary-container underline">
          BMI &amp; Macro Calculator
        </a>
        .
      </p>

      <div className="relative overflow-hidden card-corner-glow card-glow-border bg-surface-container-low border rounded-2xl p-5 mb-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display leading-none text-primary-container text-5xl tabular-nums">{totalCalories}</p>
            <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-2">Calories logged today</p>
          </div>
          {logs.length > 0 && (
            <span className="font-label text-[10px] uppercase tracking-wider text-tertiary shrink-0">
              {logs.length} {logs.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {macroGrams > 0 && (
          <>
            <div className="flex h-2 w-full gap-px bg-surface-container-high rounded-full overflow-hidden mt-4">
              <span className="block h-full bg-primary-container" style={{ width: `${proteinPct}%` }} />
              <span className="block h-full bg-primary" style={{ width: `${carbsPct}%` }} />
              <span className="block h-full bg-tertiary" style={{ width: `${fatPct}%` }} />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 font-label text-[10px] uppercase tracking-wider text-on-surface">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container shrink-0" />
                Protein <span className="text-tertiary">{totalProtein}g</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                Carbs <span className="text-tertiary">{totalCarbs}g</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
                Fat <span className="text-tertiary">{totalFat}g</span>
              </li>
            </ul>
          </>
        )}
      </div>

      <SavedMealsSection savedMeals={savedMeals} todaysLogs={logs} />

      <FoodLogForm frequentFoods={frequentFoods} />

      {logs.length === 0 ? (
        <DashboardEmptyState icon="restaurant">Nothing logged yet today.</DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-soft rounded-2xl border border-surface-variant/40 overflow-hidden">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3">
              <span className="material-symbols-outlined text-lg text-primary-container leading-none shrink-0">
                restaurant
              </span>
              <p className="font-label text-sm uppercase tracking-wide text-on-surface flex-1">{log.description}</p>
              <p className="font-display text-lg text-primary-container">{log.calories} kcal</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
