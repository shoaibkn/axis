"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamSwitcherProps {
  currentOrganisationId?: string;
}

export function TeamSwitcher({ currentOrganisationId }: TeamSwitcherProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  
  const organisations = useQuery(api.organisations.getMyOrganisations);

  const activeOrganisation = currentOrganisationId 
    ? organisations?.find((org) => org._id === currentOrganisationId)
    : organisations?.[0];

  const handleOrgChange = (orgId: string) => {
    if (orgId === "create") {
      router.push("/onboarding");
    } else if (orgId !== currentOrganisationId) {
      router.push(`/dashboard?org=${orgId}`);
    }
  };

  if (organisations === undefined) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (organisations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={() => router.push("/onboarding")}>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Create Organisation</span>
              <span className="truncate text-xs">Get started</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const canCreateMore = organisations.every(
    (org) => org.subscriptionTier === "free" || org.subscriptionTier === "enterprise"
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganisation?.name || "Select Organisation"}
                </span>
                <span className="truncate text-xs capitalize">
                  {activeOrganisation?.subscriptionTier || ""} Plan
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Organisations
            </DropdownMenuLabel>
            {organisations.map((org) => (
              <DropdownMenuItem
                key={org._id}
                onClick={() => handleOrgChange(org._id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {org.subscriptionTier} • {org.myRole}
                  </p>
                </div>
                {org._id === currentOrganisationId && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {canCreateMore ? (
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => handleOrgChange("create")}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Create Organisation
                </div>
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Upgrade to Enterprise to create more organisations
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
