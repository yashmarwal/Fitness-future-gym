import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL, BUSINESS_NAME, BUSINESS_EMAIL, BUSINESS_PHONE_PRIMARY } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: `How membership fee refunds, cancellations, and freezes work at ${BUSINESS_NAME}.`,
  alternates: { canonical: `${SITE_URL}/refund-policy` },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "26 September 2026";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl md:text-2xl text-on-surface uppercase tracking-wide mt-10 mb-3 first:mt-0">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="font-body text-sm md:text-base text-tertiary leading-relaxed mb-3">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 md:pl-6 font-body text-sm md:text-base text-tertiary leading-relaxed mb-3 flex flex-col gap-1.5">{children}</ul>;
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-primary-container/15 text-primary-container border border-primary-container/40 rounded-md px-2 py-0.5 text-xs font-body">
      {children}
    </span>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col w-full">
      <BreadcrumbJsonLd name="Refund & Cancellation Policy" path="/refund-policy" />

      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-(--container-max) mx-auto">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Legal</span>
          <h1 className="font-display text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mt-2">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="font-body text-sm text-tertiary mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="w-full bg-background px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-container-low border border-primary-container/40 rounded-2xl p-4 mb-8">
            <p className="font-body text-sm text-on-surface leading-relaxed">
              <strong>Note for gym management:</strong> the specific numbers on this page (notice periods, refund
              percentages, freeze allowances) are placeholders — we have not invented figures, since getting these
              wrong is a real financial/legal exposure. Please confirm each <Placeholder>bracketed</Placeholder>{" "}
              value against your actual policy before this page goes live.
            </p>
          </div>

          <P>
            This policy covers how membership fee payments, cancellations, and freezes are handled at{" "}
            {BUSINESS_NAME}. We accept fee payments by UPI, cash, and other manual methods recorded by our
            front-desk staff — we do not process card payments through the website, so refunds are handled
            directly with our team rather than through an automated online process.
          </P>

          <H2>1. Membership Fees</H2>
          <P>
            Membership fees are billed for the plan duration you choose (e.g. monthly, quarterly, half-yearly,
            annual) and are payable in advance. Your next due date is set based on the plan duration from your
            last payment, regardless of how many days into the cycle you actually paid.
          </P>

          <H2>2. Cancellations</H2>
          <P>
            To cancel your membership, contact us in person, by phone, or by WhatsApp using the details below.{" "}
            <Placeholder>[Notice period required before cancellation takes effect — e.g. immediate, or N days —
            to be confirmed by gym management.]</Placeholder>
          </P>

          <H2>3. Refunds</H2>
          <Ul>
            <li>
              <Placeholder>[Whether the unused portion of a prepaid plan is refundable, and if so, on what
              basis (pro-rata, flat percentage, or not at all) — to be confirmed by gym management.]</Placeholder>
            </li>
            <li>
              <Placeholder>[Refund method and timeline once approved — e.g. bank transfer within N business
              days — to be confirmed by gym management.]</Placeholder>
            </li>
            <li>
              Registration or joining fees, if any, are{" "}
              <Placeholder>[refundable / non-refundable — to be confirmed by gym management]</Placeholder>.
            </li>
          </Ul>

          <H2>4. Membership Freezes / Holds</H2>
          <P>
            <Placeholder>[Whether members can pause/freeze a membership for medical or travel reasons, how many
            times per year, for how long, and whether a fee applies — to be confirmed by gym management.]</Placeholder>
          </P>

          <H2>5. Trial Period</H2>
          <P>
            A free trial claimed through our website does not involve any payment, so no refund applies to it.
            Trial terms (duration, eligibility) are as stated when you claim your trial.
          </P>

          <H2>6. Involuntary Suspension</H2>
          <P>
            If your access is suspended due to an overdue fee, making the outstanding payment restores access
            immediately — this is not a cancellation and does not itself trigger any refund.
          </P>

          <H2>7. How To Request A Refund Or Cancellation</H2>
          <P>
            Contact us at{" "}
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-primary-container hover:underline">{BUSINESS_EMAIL}</a>{" "}
            or{" "}
            <a href={`tel:${BUSINESS_PHONE_PRIMARY}`} className="text-primary-container hover:underline">{BUSINESS_PHONE_PRIMARY}</a>{" "}
            with your membership number and the reason for your request. We will confirm the outcome in writing
            (WhatsApp or email).
          </P>
        </div>
      </section>
    </div>
  );
}
