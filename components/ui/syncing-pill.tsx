"use client";

import { Loader2 } from "lucide-react";

export function SyncingPill({ label = "Syncing" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {label}
    </div>
  );
}
