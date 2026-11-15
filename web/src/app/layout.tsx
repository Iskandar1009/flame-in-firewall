import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flame in Freefall — Fire Safety Insights from Microgravity Combustion Data",
  description:
    "An AI-powered dashboard that summarizes, ranks and interprets NASA PSI combustion investigations for spacecraft, Moon base and Mars fire safety.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
