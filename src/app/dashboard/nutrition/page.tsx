import { getMemberSession } from "@/backend/auth/session";
import { listTodaysFoodLogs, listFrequentFoods } from "@/backend/services/nutrition";
import FoodLogForm from "@/frontend/components/dashboard/FoodLogForm";
import { StatCard, DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export default async function NutritionPage() {
  const session = await getMemberSession();
  const [logs, frequentFoods] = await Promise.all([
    listTodaysFoodLogs(session!.memberId),
    listFrequentFoods(session!.memberId),
  ]);

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.proteinG ?? 0), 0);

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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard value={totalCalories} label="Kcal Today" tone="accent" />
        <StatCard value={`${totalProtein}g`} label="Protein Today" />
      </div>

      <FoodLogForm frequentFoods={frequentFoods} />

      {logs.length === 0 ? (
        <DashboardEmptyState icon="restaurant">Nothing logged yet today.</DashboardEmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
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
