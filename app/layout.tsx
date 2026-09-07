import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { AppChrome } from "@/components/layout/site-chrome";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { unreadNotificationCount } from "@/services/notifications";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Tell us what’s happening with your vehicle. Pocket Mechanic helps you find a mechanic you can trust.",
  icons: { icon: "/brand/wrench-mark.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  const unreadCount = user ? await unreadNotificationCount(user.id) : 0;
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-navy-soft font-sans text-ink">
        <AppChrome user={user} unreadCount={unreadCount}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
