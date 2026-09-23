"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExerciseSearchField from "@/frontend/components/dashboard/ExerciseSearchField";
import { WORKOUT_TEMPLATES, type WorkoutTemplate } from "@/frontend/lib/workoutTemplates";
import { DashboardEmptyState } from "@/frontend/components/dashboard/Primitives";

export type WorkoutPlanExercise = { name: string; sets: number; reps: string; notes?: string };
export type WorkoutPlanDay = { day: string; focus?: string; exercises: WorkoutPlanExercise[] };
export type WorkoutPlan = { id: string; name: string; days: WorkoutPlanDay[]; createdAt: string };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function emptyDay(label: string): WorkoutPlanDay {
  return { day: label, focus: "", exercises: [] };
}

function emptyExercise(): WorkoutPlanExercise {
  return { name: "", sets: 3, reps: "8-10", notes: "" };
}

export default function WorkoutPlanner({ plans: initialPlans }: { plans: WorkoutPlan[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState<WorkoutPlanDay[]>([]);
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);
  // Arriving from the dashboard home's "Workout Templates" card
  // (?tab=templates) opens straight to the gallery, same as having no
  // saved plans yet.
  const [showTemplates, setShowTemplates] = useState(
    initialPlans.length === 0 || searchParams.get("tab") === "templates"
  );

  function startNew() {
    setEditingId(null);
    setName("");
    setDays([]);
    setBuilding(true);
  }

  function loadIntoBuilder(planName: string, planDays: WorkoutPlanDay[]) {
    setEditingId(null);
    setName(planName);
    setDays(planDays.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })));
    setBuilding(true);
  }

  function startFromTemplate(template: WorkoutTemplate) {
    loadIntoBuilder(template.name, template.days);
  }

  // Arriving from the fitness-onboarding wizard's "Use This Plan" button —
  // either a hand-built template (?template=<id>) or a freshly generated
  // plan (?generated=1, handed off via sessionStorage since a full plan's
  // JSON doesn't comfortably fit a URL — see FitnessOnboardingWizard.tsx).
  // Either way this opens straight into the same preview-then-confirm
  // builder as tapping "Use This Template" by hand — nothing is auto-saved,
  // the member still reviews it here and taps Save themselves. Runs once on
  // mount only, so it never re-fires and stomps on an in-progress edit.
  useEffect(() => {
    const templateId = searchParams.get("template");
    const isGenerated = searchParams.get("generated") === "1";
    if (!templateId && !isGenerated) return;

    let planToLoad: { name: string; days: WorkoutPlanDay[] } | null = null;
    if (templateId) {
      const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
      if (template) planToLoad = { name: template.name, days: template.days };
    } else {
      try {
        const raw = window.sessionStorage.getItem("ff_generated_plan");
        window.sessionStorage.removeItem("ff_generated_plan");
        if (raw) planToLoad = JSON.parse(raw) as { name: string; days: WorkoutPlanDay[] };
      } catch {
        planToLoad = null;
      }
    }
    if (!planToLoad) return;

    // Deferred out of the effect's synchronous body, same escape used
    // elsewhere in this app (e.g. WorkoutPromptBanner's schedule()).
    const plan = planToLoad;
    const timer = setTimeout(() => loadIntoBuilder(plan.name, plan.days), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(plan: WorkoutPlan) {
    setEditingId(plan.id);
    setName(plan.name);
    setDays(plan.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })));
    setBuilding(true);
  }

  function cancelBuilding() {
    setBuilding(false);
    setEditingId(null);
  }

  function addDay() {
    const usedLabels = new Set(days.map((d) => d.day));
    const nextWeekday = WEEKDAYS.find((w) => !usedLabels.has(w)) ?? `Day ${days.length + 1}`;
    setDays([...days, emptyDay(nextWeekday)]);
  }

  function removeDay(index: number) {
    setDays(days.filter((_, i) => i !== index));
  }

  function updateDay(index: number, patch: Partial<WorkoutPlanDay>) {
    setDays(days.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addExercise(dayIndex: number) {
    setDays(
      days.map((d, i) => (i === dayIndex ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d))
    );
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays(
      days.map((d, i) =>
        i === dayIndex ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== exIndex) } : d
      )
    );
  }

  function updateExercise(dayIndex: number, exIndex: number, patch: Partial<WorkoutPlanExercise>) {
    setDays(
      days.map((d, i) =>
        i === dayIndex
          ? { ...d, exercises: d.exercises.map((e, ei) => (ei === exIndex ? { ...e, ...patch } : e)) }
          : d
      )
    );
  }

  async function savePlan() {
    if (!name.trim() || days.length === 0) return;
    setSaving(true);
    try {
      const cleanDays = days.map((d) => ({
        ...d,
        exercises: d.exercises.filter((e) => e.name.trim()),
      }));

      if (editingId) {
        await fetch(`/api/dashboard/workout-plans/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, days: cleanDays }),
        });
      } else {
        await fetch("/api/dashboard/workout-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, days: cleanDays }),
        });
      }
      setBuilding(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this workout plan?")) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/dashboard/workout-plans/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (building) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-on-surface uppercase tracking-wide">
            {editingId ? "Edit Plan" : "New Plan"}
          </h2>
          <button
            onClick={cancelBuilding}
            className="font-label text-[10px] uppercase text-tertiary hover:text-on-surface"
          >
            Cancel
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Plan name (e.g. Push Pull Legs)"
          className="rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
        />

        <div className="flex flex-col gap-4">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-surface-container-low shadow-soft rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    list="weekday-options"
                    value={day.day}
                    onChange={(e) => updateDay(dayIndex, { day: e.target.value })}
                    placeholder="Day (e.g. Monday)"
                    className="flex-1 min-w-0 rounded-xl bg-surface-container border border-surface-variant text-on-surface font-label text-xs uppercase px-3 py-2 outline-none focus:border-primary-container"
                  />
                  <input
                    value={day.focus ?? ""}
                    onChange={(e) => updateDay(dayIndex, { focus: e.target.value })}
                    placeholder="Focus (e.g. Push)"
                    className="flex-1 min-w-0 rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body text-sm px-3 py-2 outline-none focus:border-primary-container"
                  />
                </div>
                <button
                  onClick={() => removeDay(dayIndex)}
                  aria-label="Remove day"
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-error-container/40 text-error hover:bg-error-container/60 transition-colors shrink-0 self-end sm:self-auto"
                >
                  <span className="material-symbols-outlined text-base leading-none">delete</span>
                </button>
              </div>

              {day.exercises.map((exercise, exIndex) => (
                <div key={exIndex} className="flex flex-wrap items-end gap-2 bg-surface-container rounded-xl p-3">
                  <div className="flex-1 min-w-40">
                    <ExerciseSearchField
                      compact
                      showXpHint={false}
                      value={exercise.name}
                      onChange={(name) => updateExercise(dayIndex, exIndex, { name })}
                      onPick={(name) => updateExercise(dayIndex, exIndex, { name })}
                    />
                  </div>
                  <div className="w-16">
                    <span className="font-label text-[9px] uppercase tracking-wider text-outline block mb-1">
                      Sets
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exercise.sets}
                      onChange={(e) => updateExercise(dayIndex, exIndex, { sets: Number(e.target.value) })}
                      className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-2 py-2 outline-none focus:border-primary-container"
                    />
                  </div>
                  <div className="w-20">
                    <span className="font-label text-[9px] uppercase tracking-wider text-outline block mb-1">
                      Reps
                    </span>
                    <input
                      value={exercise.reps}
                      onChange={(e) => updateExercise(dayIndex, exIndex, { reps: e.target.value })}
                      placeholder="8-10"
                      className="w-full rounded-xl bg-surface-container-low border border-surface-variant text-on-surface font-body text-sm px-2 py-2 outline-none focus:border-primary-container"
                    />
                  </div>
                  <button
                    onClick={() => removeExercise(dayIndex, exIndex)}
                    aria-label="Remove exercise"
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-error-container/40 text-error hover:bg-error-container/60 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-base leading-none">close</span>
                  </button>
                </div>
              ))}

              <button
                onClick={() => addExercise(dayIndex)}
                className="flex items-center gap-1 font-label text-[10px] uppercase text-primary-container hover:text-secondary transition-colors w-fit"
              >
                <span className="material-symbols-outlined text-base leading-none">add</span>
                Add Exercise
              </button>
            </div>
          ))}
        </div>

        <datalist id="weekday-options">
          {WEEKDAYS.map((w) => (
            <option key={w} value={w} />
          ))}
        </datalist>

        <button
          onClick={addDay}
          className="flex items-center justify-center gap-1 rounded-xl bg-surface-container-high text-on-surface font-label text-xs uppercase px-4 py-3 hover:bg-surface-container-highest transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
          Add Day
        </button>

        <button
          onClick={savePlan}
          disabled={saving || !name.trim() || days.length === 0}
          className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving..." : "Save Plan"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={startNew}
          className="flex items-center justify-center gap-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 rounded-xl shadow-soft transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-base leading-none">add</span>
          New Plan
        </button>
        <button
          onClick={() => setShowTemplates((s) => !s)}
          className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label text-sm uppercase px-6 py-3 transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {showTemplates ? "expand_less" : "auto_awesome"}
          </span>
          {showTemplates ? "Hide Templates" : "Browse Templates"}
        </button>
      </div>

      {showTemplates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {WORKOUT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-surface-container-low shadow-soft rounded-2xl border-t-2 border-primary-container p-4 flex flex-col gap-2"
            >
              <h3 className="font-display text-base text-on-surface uppercase tracking-wide leading-tight">
                {template.name}
              </h3>
              <span className="font-label text-[9px] uppercase tracking-wider text-primary-container">
                {template.schedule}
              </span>
              <p className="font-body text-xs text-tertiary leading-relaxed flex-1">{template.tagline}</p>
              <span className="font-label text-[9px] uppercase tracking-wider text-outline">
                {template.days.length} day{template.days.length > 1 ? "s" : ""} · {template.days.reduce((n, d) => n + d.exercises.length, 0)} exercises
              </span>
              <button
                onClick={() => startFromTemplate(template)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary-container/15 hover:bg-primary-container/25 text-primary-container font-label text-[10px] uppercase font-bold px-4 py-2.5 transition-colors mt-1"
              >
                <span className="material-symbols-outlined text-sm leading-none">add_task</span>
                Use This Template
              </button>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 ? (
        <DashboardEmptyState icon="event_note">
          No workout plans yet — pick a template above to start fast, or build one from scratch with your own days,
          exercises, sets, and reps.
        </DashboardEmptyState>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-surface-container-low shadow-soft rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-on-surface uppercase tracking-wide">{plan.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(plan)}
                    aria-label="Edit plan"
                    className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-xl bg-primary-container/15 text-primary-container hover:bg-primary-container/25 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    aria-label="Delete plan"
                    className="flex items-center gap-1 font-label text-[10px] uppercase px-3 py-2 rounded-xl bg-error-container/40 text-error hover:bg-error-container/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">delete</span>
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {plan.days.map((day, i) => (
                  <div key={i} className="border-l-2 border-primary-container pl-3">
                    <p className="font-label text-xs uppercase tracking-wide text-on-surface">
                      {day.day}
                      {day.focus ? ` — ${day.focus}` : ""}
                    </p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {day.exercises.map((ex, ei) => (
                        <li key={ei} className="font-body text-xs text-tertiary">
                          {ex.name} — {ex.sets} × {ex.reps}
                        </li>
                      ))}
                      {day.exercises.length === 0 && (
                        <li className="font-body text-xs text-outline italic">No exercises added</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
