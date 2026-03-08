import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/auth-server";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <SidebarTrigger />
            <AppBreadcrumbs />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
