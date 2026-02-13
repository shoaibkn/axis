"use client";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useAuthQuery } from "better-auth/client";
import { useQuery } from "convex/react";
import { Command } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "./ui/button";

export default function NavWebsite() {
  const pathname = usePathname();

  const user = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    console.log(user);
  }, [user]);

  if (!pathname.includes("/")) {
    return null;
  }

  return (
    <header className="flex flex-row items-center justify-between p-6">
      <Link href="/" className="flex items-center gap-2">
        <Command />
        <h1 className="text-2xl font-bold">Lumin8 Axis</h1>
      </Link>
      {user ? (
        <nav className="flex items-center gap-4">
          <Link href="/docs">Docs</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Button onClick={() => authClient.signOut()}>Sign Out</Button>
        </nav>
      ) : (
        <nav className="flex items-center gap-4">
          <Link href="/auth">Login</Link>
        </nav>
      )}
    </header>
  );
}
