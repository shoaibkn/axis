"use client";
import { Bell, LayoutDashboard, ListFilter, Settings2 } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { ReactReduxContextValue, useSelector } from "react-redux";
import { icons, modules } from "@/constants";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavHeader() {
  const breads = useSelector((state: any) => state.breadcrumbs).items;
  const pathname = usePathname();

  const icon = icons.find((icon) => pathname.includes(icon.path));

  return (
    <header className="flex flex-col sticky bg-background top-0 rounded-t-xl mb-6 w-full gap-0 h-8 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8">
      <div className="flex flex-row w-full border-b bg-background h-8 justify-between px-6 items-center">
        <div className="flex flex-row gap-2 items-center">
          {icon && <icon.icon className="w-3 h-3" />}
          <h1 className="text-sm">
            {breads.length > 0 ? breads[breads.length - 1].title : ""}
          </h1>
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
