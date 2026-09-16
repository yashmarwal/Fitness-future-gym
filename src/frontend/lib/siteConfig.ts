// Single source of truth for site-wide facts used by metadata, JSON-LD,
// robots.ts, and sitemap.ts — kept in one place so nothing drifts out of
// sync the way SiteFooter.tsx's hours once did against location/page.tsx's.
// Every value here is a real, verified business fact — never a placeholder
// or an invented one (see the SEO/GEO audit this was built from).

export const SITE_URL = "https://fitnessfuturegym.in";

export const BUSINESS_NAME = "Fitness Future Gym";

export const BUSINESS_DESCRIPTION =
  "Raw strength training, unisex floor, heavy calibrated iron, and progressive overload coaching in Nangloi, Delhi.";

export const BUSINESS_ADDRESS = {
  streetAddress: "KH.No.52, Shop No.5 Plot No.8-A, 18, near Rao Vihar, Rao Vihar",
  addressLocality: "Nangloi, Delhi",
  postalCode: "110041",
  addressCountry: "IN",
};

export const BUSINESS_PHONE_PRIMARY = "+919643526435"; // Coach Vaibhav
export const BUSINESS_PHONE_SECONDARY = "+918700978341"; // Coach Hritik
export const BUSINESS_EMAIL = "contact.fitnessfuture@gmail.com";
export const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/za8QGX3eCtruW7FK7";

// Confirmed as the accurate, currently-in-effect hours (location page,
// not the footer's older "continuous 6am-11pm" copy — see
// SiteFooter.tsx, now corrected to match this).
export const OPENING_HOURS = [
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "05:00", closes: "11:00" },
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "16:00", closes: "23:00" },
] as const;

export const FOUNDING_YEAR = "2016";
