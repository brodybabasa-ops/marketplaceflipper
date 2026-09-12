"use client";

import { useEffect } from "react";
import { markThreadReadAction } from "@/app/actions/marketplace";

export function MarkRead({ threadId }: { threadId: string }) {
  useEffect(() => {
    void markThreadReadAction(threadId);
  }, [threadId]);
  return null;
}
