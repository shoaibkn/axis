"use client";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { modules } from "@/constants";

export function AppSidebarClient() {
  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={modules.navMain} />
        <NavProjects projects={modules.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={modules.user} />
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}
