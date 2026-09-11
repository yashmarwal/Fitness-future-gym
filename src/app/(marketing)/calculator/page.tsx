import CalculatorForm from "@/frontend/components/calculator/CalculatorForm";

export default function CalculatorPage() {
  return (
    <div className="flex flex-col w-full">
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
          <CalculatorForm />
        </div>
      </section>
    </div>
  );
}
