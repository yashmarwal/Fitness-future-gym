import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL, BUSINESS_NAME, BUSINESS_ADDRESS, BUSINESS_EMAIL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms governing use of ${BUSINESS_NAME}'s website, member app, and gym membership.`,
  alternates: { canonical: `${SITE_URL}/terms-conditions` },
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

export default function TermsConditionsPage() {
  return (
    <div className="flex flex-col w-full">
      <BreadcrumbJsonLd name="Terms & Conditions" path="/terms-conditions" />

      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-(--container-max) mx-auto">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Legal</span>
          <h1 className="font-display text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mt-2">
            Terms &amp; Conditions
          </h1>
          <p className="font-body text-sm text-tertiary mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="w-full bg-background px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <P>
            These Terms &amp; Conditions govern your use of the {BUSINESS_NAME} website ({SITE_URL}), member
            dashboard app, and your membership at our physical gym location. By creating an account, claiming a
            trial, or using our facility, you agree to these terms. This is a technical compliance document, not
            legal advice — it should be reviewed by a qualified lawyer before you rely on it.
          </P>

          <H2>1. Who We Are</H2>
          <P>
            {BUSINESS_NAME} operates a physical gym at {BUSINESS_ADDRESS.streetAddress},{" "}
            {BUSINESS_ADDRESS.addressLocality} {BUSINESS_ADDRESS.postalCode}, and the website/app that supports
            membership management, attendance, and fitness tracking for our members.{" "}
            <span className="text-primary-container">
              [Registered business name/entity type and any GST/business registration number, if applicable, to be
              confirmed by gym management and added here.]
            </span>
          </P>

          <H2>2. Eligibility &amp; Accounts</H2>
          <Ul>
            <li>You must provide accurate, current information (name, contact number, email) when creating an account.</li>
            <li>
              Members under 18 require a parent or guardian&apos;s consent to join and to have their data
              processed as described in our{" "}
              <Link href="/privacy-policy" className="text-primary-container hover:underline">Privacy Policy</Link>.
              <span className="text-primary-container"> [Minimum age / guardian-consent process to be confirmed by gym management.]</span>
            </li>
            <li>You are responsible for keeping your login/verification code confidential and for all activity under your account.</li>
            <li>Your digital membership card and QR code are personal to you and must not be shared or used to check in another person.</li>
          </Ul>

          <H2>3. Membership &amp; Fees</H2>
          <Ul>
            <li>Membership plans, durations, and fee amounts are as communicated to you at signup or renewal, or as displayed on our Membership page.</li>
            <li>Fees are payable in advance for the plan duration selected. We accept UPI, cash, and other manual payment methods at the front desk; we do not process card payments through the website.</li>
            <li>A membership fee that remains overdue for an extended period may result in your check-in and dashboard access being temporarily suspended until payment is made.</li>
            <li>See our{" "}
              <Link href="/refund-policy" className="text-primary-container hover:underline">Refund &amp; Cancellation Policy</Link>{" "}
              for how refunds, cancellations, and freezes are handled.
            </li>
          </Ul>

          <H2>4. Gym Floor Rules &amp; Assumption of Risk</H2>
          <Ul>
            <li>Physical exercise carries an inherent risk of injury. You should consult a physician before beginning any new fitness program, especially if you have a pre-existing medical condition.</li>
            <li>You agree to follow gym floor rules, staff/trainer instructions, and posted operating hours.</li>
            <li>Attendance is only permitted during posted operating hours, subject to a per-visit cooldown enforced by our check-in system.</li>
            <li>
              To the maximum extent permitted by law, {BUSINESS_NAME} is not liable for personal injury, loss, or
              damage arising from your use of the gym facility or equipment, except where caused by our proven
              negligence.
            </li>
          </Ul>

          <H2>5. Use Of The Website &amp; App</H2>
          <Ul>
            <li>The BMI/macro calculator, workout logging, exercise library, and other tools are provided for general fitness guidance only and are not medical advice.</li>
            <li>You agree not to misuse the platform — including attempting to access another member&apos;s account, interfering with the service, or submitting false information.</li>
            <li>Content you log (workouts, notes, food entries) remains yours; we process it only as described in our Privacy Policy to provide the service back to you.</li>
          </Ul>

          <H2>6. Communications</H2>
          <P>
            By providing your phone number and email, you consent to receive service-related messages from us
            (fee reminders, receipts, membership card, account status) by WhatsApp, email, and/or push
            notification. Optional reminders (water, meal-log, streak, workout) are sent only if you opt in, and
            you may turn them off at any time from your dashboard settings.
          </P>

          <H2>7. Limitation Of Liability</H2>
          <P>
            To the maximum extent permitted under Indian law, {BUSINESS_NAME} and its staff will not be liable
            for any indirect, incidental, or consequential loss arising from your use of the website, app, or
            gym facility. Nothing in these terms limits liability that cannot be limited under applicable law.
          </P>

          <H2>8. Termination</H2>
          <P>
            We may suspend or terminate your account or membership for breach of these terms, non-payment of
            fees, or conduct that endangers other members or staff. You may stop using the app or end your
            membership as described in our{" "}
            <Link href="/refund-policy" className="text-primary-container hover:underline">Refund &amp; Cancellation Policy</Link>.
          </P>

          <H2>9. Governing Law &amp; Dispute Resolution</H2>
          <P>
            These terms are governed by the laws of India. Any dispute arising out of or relating to these terms
            or your membership will be subject to the exclusive jurisdiction of the courts at{" "}
            <span className="text-primary-container">[city/district to be confirmed by gym management — typically the city where the gym is registered/operates, e.g. Delhi]</span>.
          </P>

          <H2>10. Changes To These Terms</H2>
          <P>
            We may update these terms from time to time. The &quot;Last updated&quot; date above reflects the
            most recent revision. Continued use after a change means you accept the updated terms.
          </P>

          <H2>11. Contact</H2>
          <P>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-primary-container hover:underline">{BUSINESS_EMAIL}</a>.
          </P>
        </div>
      </section>
    </div>
  );
}
