"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "Is the gym suitable for complete beginners?",
    answer:
      "Yes. Every new member gets a floor walkthrough and technique onboarding before lifting heavy — posture, breathing, and bar path first.",
  },
  {
    question: "Is the gym strictly unisex with a safe training environment?",
    answer:
      "Yes, the floor is open to all lifters with a zero-harassment policy and equal access to every platform.",
  },
  {
    question: "What are your operating timings?",
    answer: "See the Location & Timings page for the full weekly schedule.",
  },
  {
    question: "Do I need to sign a long-term contract?",
    answer: "No. Monthly, quarterly, and annual passes are all available with no lock-in requirement.",
  },
  {
    question: "How does the free trial work?",
    answer: "New visitors get a short trial period with full floor access and a baseline coach review — no payment details required upfront.",
  },
  {
    question: "Is personal training mandatory?",
    answer: "No — general floor trainers are always available, and 1-on-1 personal training is an optional add-on.",
  },
  {
    question: "What equipment do you have for heavy compound lifts?",
    answer: "Calibrated barbells, dedicated squat/deadlift platforms, and dumbbells suited for serious progressive overload.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={faq.question} className="bg-surface-container-low shadow-hard">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="flex items-center gap-4">
                <span className="font-display text-xl text-primary-container">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-label text-sm lg:text-base text-on-surface uppercase tracking-wide">
                  {faq.question}
                </span>
              </span>
              <span className="font-display text-xl text-primary-container shrink-0">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="font-body text-sm text-tertiary border-l-2 border-primary-container pl-4">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
