"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div
        data-collapsed={collapsed ? "true" : "false"}
        className="group/sidebar-wrapper flex min-h-screen w-full bg-background"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "hidden border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col",
        collapsed ? "md:w-16" : "md:w-72",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setCollapsed((prev) => !prev)}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? ">" : "<"}
    </button>
  );
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-b border-border p-3", className)}>{children}</div>;
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto p-3", className)}>{children}</div>;
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-t border-border p-3", className)}>{children}</div>;
}

export function SidebarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function SidebarGroupLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return <p className={cn("mb-2 px-2 text-xs uppercase tracking-wide text-muted-foreground", className)}>{children}</p>;
}

export function SidebarMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("space-y-1", className)}>{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  className,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-active={isActive ? "true" : "false"}
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        collapsed ? "justify-center" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarInset({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-screen flex-1 flex-col", className)}>{children}</div>;
}

export function SidebarText({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return <span className="truncate">{children}</span>;
}
