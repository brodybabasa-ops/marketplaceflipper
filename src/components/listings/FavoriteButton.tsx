"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FavoriteButton({
  listingId,
  initial,
}: {
  listingId: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initial);

  async function toggle() {
    const response = await fetch(`/api/listings/${listingId}/favorite`, { method: "POST" });
    if (response.status === 401) {
      router.push(`/login?next=/listing/${listingId}`);
      return;
    }
    const data = (await response.json()) as { favorited?: boolean };
    setFavorited(Boolean(data.favorited));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-medium"
    >
      {favorited ? "Saved to favorites" : "Save to favorites"}
    </button>
  );
}
