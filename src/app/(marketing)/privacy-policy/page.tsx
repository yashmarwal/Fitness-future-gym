import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import {
  SITE_URL,
  BUSINESS_NAME,
  BUSINESS_ADDRESS,
  BUSINESS_EMAIL,
  BUSINESS_PHONE_PRIMARY,
} from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BUSINESS_NAME} collects, uses, and protects your personal data, and your rights under India's Digital Personal Data Protection Act, 2023.`,
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
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

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col w-full">
      <BreadcrumbJsonLd name="Privacy Policy" path="/privacy-policy" />

      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-(--container-max) mx-auto">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Legal</span>
          <h1 className="font-display text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mt-2">
            Privacy Policy
          </h1>
          <p className="font-body text-sm text-tertiary mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="w-full bg-background px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <P>
            This policy explains what personal data {BUSINESS_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;the gym&quot;) collects through our
            website ({SITE_URL}) and member app, why we collect it, who we share it with, and the rights you have
            over it under India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;). It applies to
            visitors to our website, prospective members who submit an enquiry or claim a trial, and enrolled
            members using our member dashboard.
          </P>
          <P>
            This is a plain-language summary of our actual data practices, prepared as a technical compliance
            measure — it is not a substitute for legal advice, and should be reviewed by a qualified lawyer before
            you rely on it for compliance purposes.
          </P>

          <H2>1. What We Collect</H2>
          <P>Depending on how you interact with us, we collect:</P>
          <Ul>
            <li><strong className="text-on-surface">Contact &amp; identity details</strong> — full name, WhatsApp/phone number, email address, and postal address, collected when you sign up for an account, claim a free trial, or send us an enquiry.</li>
            <li><strong className="text-on-surface">Date of birth</strong> — optional, collected at signup, used for birthday greetings and age-appropriate program guidance.</li>
            <li><strong className="text-on-surface">Membership &amp; attendance data</strong> — your membership number, plan, joining date, and check-in timestamps each time you mark attendance (in person via QR code or through the app).</li>
            <li><strong className="text-on-surface">Fee &amp; payment records</strong> — the amount, method (UPI, cash, or other manual method), and date of each payment you make. We do not process card payments and do not store card numbers or bank details — payments are recorded manually by our front-desk staff.</li>
            <li><strong className="text-on-surface">Fitness &amp; activity data</strong> — information you choose to log, such as workout entries, personal records, muscle-group progress, body-weight/height for the BMI &amp; macro calculator, and food/nutrition entries.</li>
            <li><strong className="text-on-surface">Communication preferences &amp; push notifications</strong> — your reminder settings (water, meal-log, streak, workout) and, if you enable them, a push-notification subscription token from your browser.</li>
            <li><strong className="text-on-surface">Enquiry messages</strong> — anything you type into the &quot;Direct Inquiry&quot; form on our Location page.</li>
            <li><strong className="text-on-surface">Technical data</strong> — standard web server logs (IP address, browser type, pages visited) collected automatically by our hosting provider as part of running the website securely.</li>
          </Ul>
          <P>
            We do not knowingly collect data from anyone below the age set out in our{" "}
            <Link href="/terms-conditions" className="text-primary-container hover:underline">
              Terms &amp; Conditions
            </Link>{" "}
            without appropriate consent.
          </P>

          <H2>2. Why We Collect It</H2>
          <Ul>
            <li>To create and administer your membership account and digital membership card.</li>
            <li>To record attendance, calculate streaks, and track fee due dates.</li>
            <li>To let you log and review your own workouts, nutrition, and progress.</li>
            <li>To send service messages relevant to your membership — fee due/overdue reminders, payment receipts, membership card delivery, account block/unblock notices, birthday greetings, and (only if you opt in) water/meal/streak reminders — by WhatsApp, email, and/or push notification.</li>
            <li>To respond to enquiries and trial requests you submit to us.</li>
            <li>To operate, secure, and improve the website and app, and to detect abuse (e.g. fee non-payment patterns).</li>
          </Ul>
          <P>
            We do not sell your personal data, and we do not use it for third-party advertising or profiling.
          </P>

          <H2>3. Who We Share It With</H2>
          <P>
            We use a small number of service providers to run the website and app. Each one only receives the
            data it needs to perform its specific function on our behalf:
          </P>
          <Ul>
            <li><strong className="text-on-surface">Supabase</strong> — our database and authentication provider, which stores your account, attendance, fee, and activity records.</li>
            <li><strong className="text-on-surface">Vercel</strong> — our website hosting provider.</li>
            <li><strong className="text-on-surface">Resend</strong> — our email delivery provider, used to send receipts, reminders, and account notices.</li>
            <li><strong className="text-on-surface">Meta / WhatsApp Business Platform</strong> — used to deliver WhatsApp messages (reminders, receipts, membership cards) to the number you provide.</li>
            <li><strong className="text-on-surface">Web3Forms</strong> — processes the &quot;Direct Inquiry&quot; form on our Location page and forwards it to our email inbox. If you use that form, your name, phone number, and message pass through this third-party service.</li>
            <li><strong className="text-on-surface">Google (Fonts &amp; Maps)</strong> — our website loads typefaces from Google Fonts and, on our Location page, an embedded Google Map. Loading these can expose your IP address and browser information to Google. See our{" "}
              <Link href="/cookies-policy" className="text-primary-container hover:underline">Cookies Policy</Link>{" "}
              for how we handle this.
            </li>
            <li>Your device&apos;s push-notification service (e.g. the one built into your browser/OS) — used only if you opt in to push notifications.</li>
          </Ul>
          <P>
            Some of these providers may process or store data outside India. We only share what each provider
            needs to do its job, under their own respective privacy and security terms. We do not otherwise sell,
            rent, or trade your personal data to anyone.
          </P>
          <P>
            We may also disclose information where required by law, to a court or government authority, or to
            protect the rights, safety, or property of the gym, our members, or the public.
          </P>

          <H2>4. How Long We Keep It</H2>
          <P>
            Core account information (your name, contact details, membership, and fee records) is kept for as
            long as your membership is active, and for a reasonable period afterward for accounting and legal
            record-keeping purposes{" "}
            <span className="text-primary-container">[exact post-membership retention period to be confirmed by gym management]</span>.
          </P>
          <P>Granular activity logs are automatically deleted on a rolling basis:</P>
          <Ul>
            <li>Attendance check-in history — kept 30 days.</li>
            <li>Workout logs — kept 30 days.</li>
            <li>Food/nutrition logs — kept 30 days.</li>
            <li>In-app notifications — kept 7 days.</li>
          </Ul>
          <P>
            Your permanent streak counters, personal records, and membership/fee history are not subject to this
            rolling deletion, since they are the record of your membership itself.
          </P>

          <H2>5. Your Rights Under the DPDP Act, 2023</H2>
          <P>As a Data Principal under India&apos;s DPDP Act, you have the right to:</P>
          <Ul>
            <li><strong className="text-on-surface">Access</strong> a summary of the personal data we hold about you and how it has been processed.</li>
            <li><strong className="text-on-surface">Correction</strong> of inaccurate or incomplete personal data.</li>
            <li><strong className="text-on-surface">Erasure</strong> of your personal data, once it is no longer needed for the purpose it was collected for or once you withdraw consent (subject to our legal/accounting record-keeping obligations).</li>
            <li><strong className="text-on-surface">Withdraw consent</strong> at any time for optional processing (e.g. opt-in reminder notifications), without affecting the lawfulness of processing before withdrawal.</li>
            <li><strong className="text-on-surface">Grievance redressal</strong> — to raise a complaint about how your data is handled and receive a response within a reasonable time.</li>
            <li><strong className="text-on-surface">Nominate</strong> another individual to exercise these rights on your behalf in the event of your death or incapacity.</li>
          </Ul>
          <P>
            To exercise any of these rights, contact us using the details in Section 7 below. We will respond
            within a reasonable timeframe.
          </P>

          <H2>6. Security</H2>
          <P>
            We take reasonable technical and organisational measures to protect your data, including access
            controls on our admin systems and encrypted connections (HTTPS) across the website and app. No method
            of storage or transmission is completely secure, and we cannot guarantee absolute security.
          </P>

          <H2>7. Grievance Officer &amp; Contact</H2>
          <P>
            For any question about this policy, or to exercise your rights above, contact:
          </P>
          <P>
            <strong className="text-on-surface">{BUSINESS_NAME}</strong>
            <br />
            {BUSINESS_ADDRESS.streetAddress}, {BUSINESS_ADDRESS.addressLocality} {BUSINESS_ADDRESS.postalCode}
            <br />
            Email: <a href={`mailto:${BUSINESS_EMAIL}`} className="text-primary-container hover:underline">{BUSINESS_EMAIL}</a>
            <br />
            Phone: <a href={`tel:${BUSINESS_PHONE_PRIMARY}`} className="text-primary-container hover:underline">{BUSINESS_PHONE_PRIMARY}</a>
          </P>
          <P>
            <span className="text-primary-container">[The DPDP Act requires a named Grievance Officer contact to be published — gym management should confirm a named individual for this role.]</span>
          </P>

          <H2>8. Changes To This Policy</H2>
          <P>
            We may update this policy from time to time as our practices or the law change. The &quot;Last
            updated&quot; date at the top reflects the most recent revision. Continued use of the website or app
            after a change means you accept the updated policy.
          </P>
        </div>
      </section>
    </div>
  );
}
