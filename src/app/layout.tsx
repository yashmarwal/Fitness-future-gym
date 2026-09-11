import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Oswald, Inter } from "next/font/google";
import PwaInstallPrompt from "@/frontend/components/PwaInstallPrompt";
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
  title: "Fitness Future Gym 2.0 | Nangloi Raw Strength Training",
  description: "Raw strength training, unisex floor, heavy calibrated iron, and progressive overload coaching in Nangloi, Delhi.",
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
      lang="en"
      className={`dark ${bebasNeue.variable} ${oswald.variable} ${inter.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background antialiased selection:bg-primary-container selection:text-on-primary-container">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
