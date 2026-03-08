"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/onboarding";
  const token = searchParams.get("token");
  const inviteEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: `${window.location.origin}${next ?? "/onboarding"}`,
    });

    setIsSubmitting(false);

    if (signInError) {
      if (signInError.status === 403) {
        setError("Please verify your email before signing in.");
      } else {
        setError(signInError.message ?? "Unable to sign in.");
      }
      return;
    }

    router.push(next);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {token
          ? "Sign in with your invited email to continue accepting the invitation."
          : "Continue to your organization workspace."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground underline">
          Forgot password?
        </Link>
        <Link
          href={
            token
              ? `/sign-up?email=${encodeURIComponent(inviteEmail)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
              : "/sign-up"
          }
          className="text-muted-foreground underline"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
