"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteEmail = searchParams.get("email") ?? "";
  const token = searchParams.get("token");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/onboarding";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (inviteEmail && email.toLowerCase() !== inviteEmail.toLowerCase()) {
      setIsSubmitting(false);
      setError("Use the same email address that received the invitation.");
      return;
    }

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}${next}`,
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? "Unable to create account.");
      return;
    }

    const query = new URLSearchParams({
      email,
      next,
      ...(token ? { token } : {}),
    });

    router.push(`/verify-email?${query.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {token
          ? "Create your account with the invited email to continue."
          : "Use email and password to get started."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={Boolean(token && inviteEmail)}
          required
        />
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={
            token
              ? `/sign-in?email=${encodeURIComponent(email || inviteEmail)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
              : "/sign-in"
          }
          className="text-foreground underline"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
