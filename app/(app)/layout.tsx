"use client";
import LayoutProvider from "@/components/providers/layout-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <LayoutProvider>{children}</LayoutProvider>;
}
