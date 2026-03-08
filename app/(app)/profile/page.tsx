"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const orgData = useQuery(api.organizations.getMyOrganization);
  const sendPasswordReset = useMutation(api.users.sendPasswordResetForUser);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage your account details and workspace access.
      </p>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {session?.user.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {session?.user.email ?? "-"}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            setMessage(null);
            try {
              if (!session?.user.id) {
                throw new Error("Unable to identify current user.");
              }
              await sendPasswordReset({ targetUserId: session.user.id });
              setMessage("Password reset email sent.");
            } catch (resetError) {
              setError(
                resetError instanceof Error
                  ? resetError.message
                  : "Unable to send password reset email.",
              );
            }
          }}
          className="mt-4 rounded border border-border px-3 py-1.5 text-sm"
        >
          Send password reset email
        </button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </section>

      <section className="mt-4 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Organization</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {orgData?.organization.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Plan:</span>{" "}
            {orgData?.organization.plan ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{" "}
            {orgData?.membership.role ?? "-"}
          </p>
        </div>
      </section>
    </main>
  );
}
