"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import NavHeader from "../nav-header";
import {
  BreadcrumbPage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { ScrollArea } from "../ui/scroll-area";
import { Provider } from "react-redux";
import store from "@/app/store";
import NavBreadcrumbs from "../nav-breadcrumbs";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <SidebarProvider className="pt-8 h-screen">
        <div className="flex h-8 bg-sidebar items-center flex-row justify-center gap-2 px-4 w-full fixed z-100 top-0">
          <NavBreadcrumbs />
        </div>
        <AppSidebar variant="inset" className="pt-8" />
        <SidebarInset className="rounded-3xl mb-2 bg-none shadow-none border-none">
          <ScrollArea className="h-full w-full rounded-xl border p-0">
            <NavHeader />
            {children}
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </Provider>
  );
}
