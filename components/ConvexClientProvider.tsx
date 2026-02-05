"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import {
  AuthProvider,
  AuthTokenProvider,
  useAuthTokenForConvex,
} from "@/contexts/auth-context";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthTokenProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthTokenForConvex}>
        <AuthProvider>{children}</AuthProvider>
      </ConvexProviderWithAuth>
    </AuthTokenProvider>
  );
}
