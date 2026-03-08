export type BreadcrumbNode = {
  label: string;
  parent?: string;
};

export const breadcrumbMap: Record<string, BreadcrumbNode> = {
  "/dashboard": { label: "Dashboard" },
  "/tasks": { label: "Tasks", parent: "/dashboard" },
  "/approvals": { label: "Approvals", parent: "/dashboard" },
  "/settings": { label: "Settings", parent: "/dashboard" },
  "/settings/departments": { label: "Departments", parent: "/settings" },
  "/settings/people": { label: "People", parent: "/settings" },
  "/profile": { label: "Profile", parent: "/dashboard" },
  "/onboarding": { label: "Onboarding", parent: "/dashboard" },
  "/invite-accepted": { label: "Invitation Accepted", parent: "/dashboard" },
};

export function resolveBreadcrumbs(pathname: string) {
  const cleanPath = pathname.split("?")[0];
  const parts = cleanPath.split("/").filter(Boolean);
  const normalizedPath = `/${parts.join("/")}` || "/dashboard";

  const trail: Array<{ href: string; label: string }> = [];
  const visited = new Set<string>();

  let currentPath = normalizedPath;

  if (!breadcrumbMap[currentPath]) {
    if (currentPath !== "/dashboard") {
      const label = parts.length
        ? parts[parts.length - 1].replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
        : "Dashboard";
      trail.push({ href: "/dashboard", label: "Dashboard" });
      trail.push({ href: currentPath, label });
      return trail;
    }
  }

  while (currentPath && !visited.has(currentPath)) {
    visited.add(currentPath);
    const node = breadcrumbMap[currentPath];
    if (!node) break;
    trail.push({ href: currentPath, label: node.label });
    currentPath = node.parent ?? "";
  }

  const reversed = trail.reverse();

  if (!reversed.some((item) => item.href === "/dashboard")) {
    reversed.unshift({ href: "/dashboard", label: "Dashboard" });
  }

  return reversed;
}
