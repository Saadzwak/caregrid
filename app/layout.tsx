import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CareGrid — Create capacity that didn't exist yesterday",
  description:
    "CareGrid assembles idle rooms, available practitioners, equipment and the patient waitlist into brand-new medical sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <div className="bg-atmosphere" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
