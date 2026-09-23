import type { Metadata } from "next";
import CalculatorForm from "@/frontend/components/calculator/CalculatorForm";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Free BMI & Macro Calculator",
  description:
    "Instant BMI classification and daily protein, carb, fat, and calorie targets — built with the Mifflin-St Jeor formula. Free tool from Fitness Future Gym.",
  alternates: { canonical: `${SITE_URL}/calculator` },
};

export default function CalculatorPage() {
  return (
    <div className="flex flex-col w-full">
      <BreadcrumbJsonLd name="BMI & Macro Calculator" path="/calculator" />
      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-20">
        <div className="max-w-(--container-max) mx-auto">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">
            Bio-Metric Matrix
          </span>
          <h1 className="font-display text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mt-2">
            Calculate Your Targets
          </h1>
          <p className="font-body text-base lg:text-lg text-tertiary max-w-2xl mt-3">
            Instant BMI classification and daily protein, carb, fat, and caloric targets — built with the
            Mifflin-St Jeor formula.
          </p>
        </div>
      </section>

      <section className="w-full bg-background px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-20">
        <div className="max-w-(--container-max) mx-auto">
          <CalculatorForm dashboardStyle />
        </div>
      </section>
    </div>
  );
}
