import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import LayoutProvider from "@/components/providers/LayoutProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    // Redirect to auth page if not authenticated
    redirect("/auth");
  }

  return (
    <LayoutProvider>
      {children}
    </LayoutProvider>
  );
}
