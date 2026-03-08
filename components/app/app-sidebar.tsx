"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckSquare,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarText,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Approvals", href: "/approvals", icon: ShieldCheck },
];

const otherItems = [{ title: "Settings", href: "/settings", icon: Settings }];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const orgData = useQuery(api.organizations.getMyOrganization);
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="rounded-md border border-border bg-background p-2">
          <p className="truncate text-sm font-semibold">
            {orgData?.organization.name ?? "Organization"}
          </p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
            {orgData?.organization.plan ?? "Plan"}
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton isActive={active}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <SidebarText>{item.title}</SidebarText>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            {otherItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton isActive={active}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <SidebarText>{item.title}</SidebarText>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div ref={menuRef} className="relative rounded-md border border-border bg-background p-2">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-accent"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              <UserRound className="h-4 w-4 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session?.user.name ?? "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user.email ?? ""}</p>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen ? (
            <div className="absolute bottom-full left-2 right-2 z-20 mb-2 rounded-md border border-border bg-popover p-1 shadow-md">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <UserRound className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await authClient.signOut();
                  router.push("/sign-in");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
