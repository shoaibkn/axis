"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function useLoadingToast({
  isLoading,
  toastId,
  label = "Loading",
}: {
  isLoading: boolean;
  toastId: string;
  label?: string;
}) {
  useEffect(() => {
    if (isLoading) {
      toast.loading(label, {
        id: toastId,
        position: "bottom-right",
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
      });
      return;
    }

    toast.dismiss(toastId);
  }, [isLoading, toastId, label]);
}
