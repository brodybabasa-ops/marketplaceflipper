import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlipFinder — Find it. Flip it. Profit.",
    template: "%s · FlipFinder",
  },
  description:
    "Scan marketplace listings across Facebook Marketplace categories, score the spread, and click through to the original listing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
