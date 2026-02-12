import {
  Bell,
  LayoutDashboard,
  ListFilter,
  Settings2,
  Tags,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { NotificationIcon } from "@phosphor-icons/react";

export default function NavHeader() {
  return (
    <header className="flex flex-col sticky bg-background top-0 rounded-t-xl mb-6 w-full gap-0 h-8 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8">
      <div className="flex flex-row w-full border-b bg-background h-8 justify-between px-6 items-center">
        <div className="flex flex-row gap-2 items-center">
          <LayoutDashboard size={12} />
          <h1 className="text-sm">Module Title</h1>
        </div>

        <div className="flex flex-row gap-2">
          <Button size={"icon"} variant={"ghost"}>
            <Bell />
          </Button>
          <Separator orientation="vertical" />
          <SidebarTrigger className="" />
        </div>
      </div>
      <div className="flex flex-row w-full border-b h-8 bg-background justify-between px-4 items-center">
        <Button size={"icon"} variant={"ghost"}>
          <ListFilter />
        </Button>
        <Button variant={"outline"} size={"sm"}>
          <Settings2 />
          Options
        </Button>
      </div>
    </header>
  );
}
