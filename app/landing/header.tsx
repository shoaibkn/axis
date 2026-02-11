"use client";

import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import type { Preloaded } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { api } from "@/convex/_generated/api";

export const Header = ({
  preloadedUserQuery,
}: {
  preloadedUserQuery: Preloaded<typeof api.auth.getCurrentUser>;
}) => {
  const user = usePreloadedAuthQuery(preloadedUserQuery);
  return (
    <div>
      {user ? (
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      )}
    </div>
  );
};

export default Header;
