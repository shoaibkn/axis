"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const { data: session, isPending } = authClient.useSession();
  const invitationData = useQuery(
    api.invitations.getInvitationByToken,
    token ? { token } : "skip",
  );
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invitedEmail = invitationData?.invitation.email.toLowerCase();
  const signedInEmail = session?.user?.email?.toLowerCase();
  const isSignedInWithWrongEmail =
    Boolean(session?.user && invitedEmail && signedInEmail) && invitedEmail !== signedInEmail;
  const nextPath = `/accept-invite?token=${encodeURIComponent(token)}`;

  async function handleAccept() {
    if (!token) {
      setError("Invitation token is missing.");
      return;
    }

    if (!session?.user) {
      router.push(
        `/sign-in?next=${encodeURIComponent(nextPath)}&token=${encodeURIComponent(token)}`,
      );
      return;
    }

    if (isSignedInWithWrongEmail) {
      setError("You are signed in with a different email than the invitation email.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await acceptInvitation({ token });
      const orgName = invitationData?.organization?.name;
      if (orgName) {
        router.push(`/invite-accepted?org=${encodeURIComponent(orgName)}`);
      } else {
        router.push("/invite-accepted");
      }
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending || invitationData === undefined) {
    return <main className="p-6">Loading...</main>;
  }

  if (!token || !invitationData) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Invalid invitation</h1>
        <p className="mt-2 text-sm text-muted-foreground">This invitation link is invalid.</p>
        <Link href="/" className="mt-6 text-sm underline">
          Go home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Join organization</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You were invited to join {invitationData.organization?.name ?? "this organization"} as {" "}
        {invitationData.invitation.role}.
      </p>

      {invitationData.isExpired ? (
        <p className="mt-4 text-sm text-destructive">This invitation has expired.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {!session?.user ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Continue with the invited email address: {invitationData.invitation.email}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/sign-up?email=${encodeURIComponent(invitationData.invitation.email)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextPath)}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Create account
            </Link>
            <Link
              href={`/sign-in?email=${encodeURIComponent(invitationData.invitation.email)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextPath)}`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        </>
      ) : (
        <>
          <button
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            onClick={handleAccept}
            disabled={isSubmitting || invitationData.isExpired || isSignedInWithWrongEmail}
          >
            {isSubmitting ? "Accepting..." : "Accept invitation"}
          </button>

          {isSignedInWithWrongEmail ? (
            <div className="mt-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
              <p>
                You are signed in as {session?.user.email}. This invitation is for{" "}
                {invitationData.invitation.email}.
              </p>
              <button
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm"
                onClick={async () => {
                  await authClient.signOut();
                  router.push(
                    `/sign-in?email=${encodeURIComponent(invitationData.invitation.email)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextPath)}`,
                  );
                }}
              >
                Sign out and continue
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
