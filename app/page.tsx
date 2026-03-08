"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/onboarding");
    }
  }, [isPending, router, session?.user]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">Axis</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Task and approvals workspace</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Set up authentication, organization onboarding, departments, and invitations.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Create account
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
