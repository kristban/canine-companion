import type { Metadata } from "next";
import { Nunito, Fredoka } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
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

export const metadata: Metadata = {
  title: "Canine Companion — Find Your Perfect Dog Breed",
  description:
    "Answer a few quick questions and discover which dog breeds best match your lifestyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
