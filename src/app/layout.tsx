import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Oswald, Inter } from "next/font/google";
import PwaInstallPrompt from "@/frontend/components/PwaInstallPrompt";
import {
  SITE_URL,
  BUSINESS_NAME,
  BUSINESS_DESCRIPTION,
  BUSINESS_ADDRESS,
  BUSINESS_PHONE_PRIMARY,
  BUSINESS_EMAIL,
  OPENING_HOURS,
  FOUNDING_YEAR,
  INSTAGRAM_GYM,
} from "@/frontend/lib/siteConfig";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-label",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fitness Future Gym | Nangloi Raw Strength Training",
    // Individual pages set title: "About Us" etc. and this appends the
    // brand automatically — keeps every page's <title> unique without
    // repeating the brand name in each route's metadata export.
    template: `%s | ${BUSINESS_NAME}`,
  },
  description: BUSINESS_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fitness Future",
  },
  icons: {
    icon: [{ url: "/icon-192.png" }, { url: "/icon-512.png" }],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: BUSINESS_NAME,
    title: "Fitness Future Gym | Nangloi Raw Strength Training",
    description: BUSINESS_DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
    images: [{ url: "/images/desktop-hero.jpg", width: 1672, height: 941, alt: BUSINESS_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitness Future Gym | Nangloi Raw Strength Training",
    description: BUSINESS_DESCRIPTION,
    images: ["/images/desktop-hero.jpg"],
  },
};

// Organization/local-business + website entities, real data only (see
// src/frontend/lib/siteConfig.ts) — rendered once here since this is
// site-wide brand identity, not page-specific content. One @graph, not
// separate <script> tags, so there's a single JSON-LD document instead of
// duplicate graphs.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ExerciseGym",
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS_NAME,
      url: SITE_URL,
      description: BUSINESS_DESCRIPTION,
      telephone: BUSINESS_PHONE_PRIMARY,
      email: BUSINESS_EMAIL,
      image: `${SITE_URL}/images/desktop-hero.jpg`,
      foundingDate: FOUNDING_YEAR,
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS_ADDRESS.streetAddress,
        addressLocality: BUSINESS_ADDRESS.addressLocality,
        postalCode: BUSINESS_ADDRESS.postalCode,
        addressCountry: BUSINESS_ADDRESS.addressCountry,
      },
      openingHoursSpecification: OPENING_HOURS.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
      sameAs: [INSTAGRAM_GYM],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BUSINESS_NAME,
      publisher: { "@id": `${SITE_URL}/#business` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#141311",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`dark ${bebasNeue.variable} ${oswald.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Subsetted to exactly the icons this app uses (via Google's
            icon_names param) instead of the full Material Symbols set —
            the unsubsetted font is ~314KB; this is ~9KB. That's real
            weight on every single page load, most felt on a mobile
            connection. Adding a new icon anywhere in the app means adding
            its name to this list too, or it'll render as a blank glyph. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=accessibility_new,add,add_circle,add_task,arrow_forward,auto_awesome,autorenew,badge,block,bolt,cake,calculate,calendar_month,call,campaign,check,check_box,check_circle,chevron_left,chevron_right,close,construction,dashboard,delete,directions_run,diversity_3,download,edit,edit_note,emoji_events,error,event_available,event_busy,event_note,expand_less,expand_more,fitness_center,format_quote,group,home,hourglass_top,info,local_fire_department,location_on,lock,lock_open,logout,menu,military_tech,monitor_heart,navigation,notifications,notifications_active,notifications_off,pause,payments,person,person_add,person_off,pin_drop,play_arrow,precision_manufacturing,qr_code_2,qr_code_scanner,refresh,remove,repeat,restart_alt,restaurant,rowing,schedule,search,self_improvement,shield,smart_toy,sports_gymnastics,sports_kabaddi,sports_martial_arts,stars,stop,storefront,timelapse,timer,today,verified,view_compact,volume_off,volume_up,warning,water_drop,workspace_premium&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col bg-background antialiased selection:bg-primary-container selection:text-on-primary-container">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
