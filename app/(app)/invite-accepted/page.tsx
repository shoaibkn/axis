"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function InviteAcceptedPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get("org");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Invitation accepted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {orgName
          ? `You have joined ${orgName}.`
          : "You have successfully joined the organization."}
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to dashboard
        </Link>
        <Link href="/onboarding" className="rounded-md border border-border px-4 py-2 text-sm">
          Review setup
        </Link>
      </div>
    </main>
  );
}
