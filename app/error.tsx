"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

function friendlyMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("not authorized") || lower.includes("permission")) {
    return {
      title: "You don’t have access to that",
      body: "This action is limited to the account that owns the job, asset, or record.",
      href: "/home",
      label: "Go home",
    };
  }
  if (lower.includes("session") || lower.includes("sign in") || lower.includes("jwt") || lower.includes("expired")) {
    return {
      title: "Your session expired",
      body: "Sign in again to keep working. Unsaved form fields were not submitted.",
      href: "/sign-in",
      label: "Sign in",
    };
  }
  if (lower.includes("payment") || lower.includes("stripe") || lower.includes("card")) {
    return {
      title: "Payment didn’t go through",
      body: "Nothing was charged. Try again, or use another method from the job page.",
      href: "/jobs",
      label: "Open jobs",
    };
  }
  if (lower.includes("upload") || lower.includes("file") || lower.includes("photo")) {
    return {
      title: "Upload failed",
      body: "The photo or document didn’t save. Check the file size and try again.",
      href: "/jobs",
      label: "Back to jobs",
    };
  }
  if (lower.includes("match") || lower.includes("provider unavailable") || lower.includes("no mechanic")) {
    return {
      title: "No provider available",
      body: "Widen the search or try urgent help. HQ sees unserved requests as demand.",
      href: "/mechanics",
      label: "Find a provider",
    };
  }
  if (lower.includes("authorization") || lower.includes("estimate") || lower.includes("no longer awaiting")) {
    return {
      title: "This estimate changed",
      body: "Reload the job. Original authorizations are never silently rewritten.",
      href: "/jobs",
      label: "Open jobs",
    };
  }
  if (lower.includes("asset") || lower.includes("garage") || lower.includes("vehicle")) {
    return {
      title: "That asset isn’t available",
      body: "It may have been transferred or isn’t on this account. Open your garage and try again.",
      href: "/vehicles",
      label: "My Garage",
    };
  }
  return {
    title: "Something went wrong",
    body: message || "The last action didn’t complete. Try again — nothing was silently saved.",
    href: "/",
    label: "Back home",
  };
}

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const copy = friendlyMessage(error.message);
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-ink">{copy.title}</h1>
      <p className="mt-2 text-sm text-muted">{copy.body}</p>
      <p className="mt-3 text-xs text-muted">{error.message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href={copy.href}>{copy.label}</Link>
        </Button>
      </div>
    </div>
  );
}
