"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FoodLogForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, calories, proteinG: proteinG || undefined }),
      });
      setDescription("");
      setCalories("");
      setProteinG("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low p-5 shadow-hard flex flex-col gap-3 mb-6">
      <span className="font-label text-xs uppercase tracking-widest text-primary-container">Log A Meal</span>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        placeholder="e.g. Chicken & Rice Bowl"
        className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          required
          placeholder="Calories"
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
        />
        <input
          type="number"
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          placeholder="Protein (g)"
          className="bg-surface-container border border-surface-variant text-on-surface font-body px-3 py-3 outline-none focus:border-primary-container"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Log Meal"}
      </button>
    </form>
  );
}
