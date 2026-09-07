import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { unreadNotificationCount } from "@/services/notifications";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Connect with verified mechanics, compare real customer ratings, get transparent estimates, and keep your entire repair experience in one place.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  const unreadCount = user ? await unreadNotificationCount(user.id) : 0;
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        <SiteHeader user={user} unreadCount={unreadCount} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
