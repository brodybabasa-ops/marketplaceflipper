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
    "Score Marketplace deals, then click through to Facebook to contact the seller. FlipFinder does not host checkout.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
