"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await authClient.resetPassword({
      token,
      newPassword,
    });
    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message ?? "Unable to reset password.");
      return;
    }

    setMessage("Password reset successful. You can now sign in.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <button
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Updating..." : "Reset password"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline">
          Return to sign in
        </Link>
      </p>
    </main>
  );
}
