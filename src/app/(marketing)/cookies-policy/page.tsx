import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/frontend/components/BreadcrumbJsonLd";
import { SITE_URL, BUSINESS_NAME, BUSINESS_EMAIL } from "@/frontend/lib/siteConfig";

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: `The cookies and third-party resources used on the ${BUSINESS_NAME} website, and how to control them.`,
  alternates: { canonical: `${SITE_URL}/cookies-policy` },
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

export default function CookiesPolicyPage() {
  return (
    <div className="flex flex-col w-full">
      <BreadcrumbJsonLd name="Cookies Policy" path="/cookies-policy" />

      <section className="w-full bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-(--container-max) mx-auto">
          <span className="font-label text-xs uppercase tracking-widest text-primary-container">Legal</span>
          <h1 className="font-display text-display-lg-mobile lg:text-display-lg text-on-surface uppercase tracking-tight mt-2">
            Cookies Policy
          </h1>
          <p className="font-body text-sm text-tertiary mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="w-full bg-background px-gutter-mobile lg:px-gutter-desktop py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <P>
            This page lists the cookies and similar technologies (like browser local storage) our website
            actually uses, grouped by category, and explains the choice you&apos;re given through the cookie
            banner shown on your first visit.
          </P>

          <H2>Essential (always on)</H2>
          <P>
            These are required for the site and member app to function, so they are not switched off by the
            cookie banner:
          </P>
          <div className="overflow-x-auto rounded-xl border border-surface-variant/40 my-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container">
                  <th className="font-label text-[10px] uppercase tracking-wide text-primary-container px-4 py-3">Name / type</th>
                  <th className="font-label text-[10px] uppercase tracking-wide text-primary-container px-4 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30 font-body text-sm text-tertiary">
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Session cookie (auth)</td>
                  <td className="px-4 py-3 align-top">Keeps you signed in to your member or admin account.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Cookie-consent preference (local storage)</td>
                  <td className="px-4 py-3 align-top">Remembers the choice you make in the cookie banner so we don&apos;t ask again on every visit.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Service worker cache</td>
                  <td className="px-4 py-3 align-top">Lets the app work offline and load faster on repeat visits; stores no personal data itself.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <H2>Functional — Third-Party Resources</H2>
          <P>
            These are not tracking/advertising cookies, but they do involve loading a resource from a third
            party, which can expose your IP address and browser information to that provider:
          </P>
          <div className="overflow-x-auto rounded-xl border border-surface-variant/40 my-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container">
                  <th className="font-label text-[10px] uppercase tracking-wide text-primary-container px-4 py-3">Provider</th>
                  <th className="font-label text-[10px] uppercase tracking-wide text-primary-container px-4 py-3">Purpose</th>
                  <th className="font-label text-[10px] uppercase tracking-wide text-primary-container px-4 py-3">When it loads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30 font-body text-sm text-tertiary">
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Google Fonts</td>
                  <td className="px-4 py-3 align-top">Delivers the site&apos;s typefaces.</td>
                  <td className="px-4 py-3 align-top">On every page load (site cannot render its intended design without it).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Google Maps</td>
                  <td className="px-4 py-3 align-top">Shows an embedded map of our location.</td>
                  <td className="px-4 py-3 align-top">Only after you choose to load the map on our Location page — it is not loaded automatically.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-on-surface">Web3Forms</td>
                  <td className="px-4 py-3 align-top">Delivers the &quot;Direct Inquiry&quot; contact form to our inbox.</td>
                  <td className="px-4 py-3 align-top">Only when you submit that form.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <H2>Analytics &amp; Marketing</H2>
          <P>
            We do not currently run any analytics (e.g. Google Analytics), advertising pixels, or marketing
            trackers on this site. The cookie banner includes a toggle for these categories so that if we add
            any in the future, they will only run once you&apos;ve given consent — nothing needs to change on
            your end for that protection to apply.
          </P>

          <H2>Your Choices</H2>
          <P>
            When you first visit, a banner lets you Accept All, Reject Non-Essential, or Customize your choice by
            category. You can change your mind at any time by clearing your browser&apos;s site data for{" "}
            {SITE_URL.replace("https://", "")}, which resets the banner. You can also control cookies directly
            through your browser&apos;s settings, and block the embedded Google Map from loading by simply not
            tapping to load it on the Location page.
          </P>

          <H2>Contact</H2>
          <P>
            Questions about this policy can be sent to{" "}
            <a href={`mailto:${BUSINESS_EMAIL}`} className="text-primary-container hover:underline">{BUSINESS_EMAIL}</a>.
          </P>
        </div>
      </section>
    </div>
  );
}
