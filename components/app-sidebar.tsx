import * as React from "react";

import { AppSidebarClient } from "@/components/app-sidebar-client";
import { Sidebar } from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <AppSidebarClient />
    </Sidebar>
  );
}
