"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/onboarding";
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resendVerification() {
    if (!email) {
      setError("Email address is missing.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSending(true);

    const { error: sendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}${next}`,
    });

    setIsSending(false);

    if (sendError) {
      setError(sendError.message ?? "Unable to send verification email.");
      return;
    }

    setMessage("Verification email sent.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check your inbox and click the verification link before signing in.
      </p>

      {email ? (
        <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">{email}</p>
      ) : null}

      <button
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={resendVerification}
        disabled={isSending}
      >
        {isSending ? "Sending..." : "Resend verification email"}
      </button>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}

      <p className="mt-6 text-sm text-muted-foreground">
        Go to{" "}
        <Link
          href={
            token
              ? `/sign-in?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
              : "/sign-in"
          }
          className="underline"
        >
          sign in
        </Link>
      </p>
    </main>
  );
}
