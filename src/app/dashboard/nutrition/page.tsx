import { getMemberSession } from "@/backend/auth/session";
import { listTodaysFoodLogs } from "@/backend/services/nutrition";
import FoodLogForm from "@/frontend/components/dashboard/FoodLogForm";

export default async function NutritionPage() {
  const session = await getMemberSession();
  const logs = await listTodaysFoodLogs(session!.memberId);

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
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-primary-container">{totalCalories}</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Kcal Today</p>
        </div>
        <div className="bg-surface-container-low p-5 shadow-hard">
          <span className="font-display text-3xl text-on-surface">{totalProtein}g</span>
          <p className="font-label text-[10px] uppercase tracking-wider text-tertiary mt-1">Protein Today</p>
        </div>
      </div>

      <FoodLogForm />

      {logs.length === 0 ? (
        <p className="font-body text-sm text-tertiary">Nothing logged yet today.</p>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/40 bg-surface-container-low shadow-hard">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center px-5 py-3">
              <p className="font-label text-sm uppercase tracking-wide text-on-surface">{log.description}</p>
              <p className="font-display text-lg text-primary-container">{log.calories} kcal</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
