"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message ?? "Unable to send reset email.");
      return;
    }

    setMessage("If that email exists, a password reset link has been sent.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter your account email to receive a reset link.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <button
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Back to{" "}
        <Link href="/sign-in" className="underline">
          sign in
        </Link>
      </p>
    </main>
  );
}
