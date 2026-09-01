import type { Metadata } from "next";
import Script from "next/script";
import { Nunito, Fredoka } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { SessionProvider } from "@/components/SessionProvider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const description =
  "Answer a few quick questions and discover which dog breeds best match your lifestyle.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Canine Companion — Find Your Perfect Dog Breed",
  description,
  openGraph: {
    title: "Canine Companion — Find Your Perfect Dog Breed",
    description,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Runs before paint so the page never flashes the wrong theme: an explicit
// localStorage choice wins, otherwise it follows the OS preference.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="53491270-1c65-405f-9e5f-da7f593d9517"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text">
        <SessionProvider>
          {children}
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
