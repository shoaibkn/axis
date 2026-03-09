"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-md border border-border",
          title: "text-sm",
          description: "text-xs text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
