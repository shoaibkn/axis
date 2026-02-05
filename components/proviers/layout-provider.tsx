import { AppSidebar } from "../app-sidebar";
import FilterHeader from "../filter-header";
import { ModeToggle } from "../mode-toggle";
import ModuleHeader from "../module-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { TooltipProvider } from "../ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "../../contexts/auth-context";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />

            <div className="flex flex-col gap-2 w-full p-2 ">
              <header className="flex h-4 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-4">
                <div className="flex items-center gap-2 px-0 w-full justify-between">
                  {/*<Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />*/}
                  <SidebarTrigger className="-ml-1" />

                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                          Building Your Application
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <ModeToggle />
                </div>
              </header>
              <SidebarInset className="border rounded-sm">
                <ModuleHeader>Module Header</ModuleHeader>
                <FilterHeader>Filters</FilterHeader>
                {children}
              </SidebarInset>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
