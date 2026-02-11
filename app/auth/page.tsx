"use client";
import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { useState } from "react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [flow, setFlow] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({
      name,
      email,
      password,
      confirmPassword,
      flow,
    });
    if (flow === "signup") {
      await handleSignUp();
    } else if (flow === "login") {
      await handleSignIn();
    }
  };

  const handleSignUp = async () => {
    await authClient.signUp.email(
      {
        email,
        password,
        name,
        // custom field configured via user.additionalFields in
        // convex/auth.ts
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          setLoading(false);
        },
        onError: async (ctx) => {
          setLoading(false);
          console.error(ctx.error);
          console.error("response", ctx.response);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const handleSignIn = async () => {
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setOtpLoading(true);
        },
        onSuccess: (ctx) => {
          setOtpLoading(false);
          if (ctx.data.twoFactorRedirect) {
            router.push("/verify-2fa");
          } else {
            router.push("/");
          }
        },
        onError: (ctx) => {
          setOtpLoading(false);
          alert(ctx.error.message);
        },
      },
    );
  };

  // const handleResetPassword = async () => {
  //   setForgotLoading(true);
  //   try {
  //     await authClient.requestPasswordReset({
  //       email,
  //       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  //     });
  //     alert("Check your email for the reset password link!");
  //   } catch {
  //     alert("Failed to send reset password link. Please try again.");
  //   } finally {
  //     setForgotLoading(false);
  //   }
  // };

  // const handleAnonymousSignIn = async () => {
  //   await authClient.signIn.anonymous(
  //     {},
  //     {
  //       onRequest: () => {
  //         setAnonymousLoading(true);
  //       },
  //       onSuccess: () => {
  //         setAnonymousLoading(false);
  //         router.push("/");
  //       },
  //       onError: (ctx) => {
  //         setAnonymousLoading(false);
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  // const handleMagicLinkSignIn = async () => {
  //   await authClient.signIn.magicLink(
  //     {
  //       email,
  //     },
  //     {
  //       onRequest: () => {
  //         setMagicLinkLoading(true);
  //       },
  //       onSuccess: () => {
  //         setMagicLinkLoading(false);
  //         alert("Check your email for the magic link!");
  //       },
  //       onError: (ctx) => {
  //         setMagicLinkLoading(false);
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  // const handleGithubSignIn = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "github",
  //     },
  //     {
  //       onRequest: () => {
  //         setOtpLoading(true);
  //       },
  //       onResponse: () => setOtpLoading(false),
  //       onSuccess: () => {
  //         router.push("/");
  //       },
  //       onError: (ctx) => {
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  // const handleGoogleSignIn = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "google",
  //     },
  //     {
  //       onRequest: () => {
  //         setOtpLoading(true);
  //       },
  //       onSuccess: () => {
  //         setOtpLoading(false);
  //       },
  //       onError: (ctx) => {
  //         setOtpLoading(false);
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  // const handleSlackSignIn = async () => {
  //   await authClient.signIn.oauth2(
  //     {
  //       providerId: "slack",
  //     },
  //     {
  //       onRequest: () => {
  //         setOtpLoading(true);
  //       },
  //       onSuccess: () => {
  //         setOtpLoading(false);
  //       },
  //       onError: (ctx) => {
  //         setOtpLoading(false);
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  // const handleOtpSignIn = async () => {
  //   if (!otpSent) {
  //     await authClient.emailOtp.sendVerificationOtp(
  //       {
  //         email,
  //         type: "sign-in",
  //       },
  //       {
  //         onRequest: () => {
  //           setOtpLoading(true);
  //         },
  //         onSuccess: () => {
  //           setOtpLoading(false);
  //           setOtpSent(true);
  //         },
  //         onError: (ctx) => {
  //           setOtpLoading(false);
  //           alert(ctx.error.message);
  //         },
  //       },
  //     );
  //   } else {
  //     await authClient.signIn.emailOtp(
  //       {
  //         email,
  //         otp,
  //       },
  //       {
  //         onRequest: () => {
  //           setOtpLoading(true);
  //         },
  //         onSuccess: () => {
  //           setOtpLoading(false);
  //           router.push("/");
  //         },
  //         onError: (ctx) => {
  //           setOtpLoading(false);
  //           alert(ctx.error.message);
  //         },
  //       },
  //     );
  //   }
  // };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        {flow === "login" ? (
          // Login Form
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Login with your Apple or Google account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <Field>
                      <Button variant="outline" type="button">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                            fill="currentColor"
                          />
                        </svg>
                        Login with Apple
                      </Button>
                      <Button variant="outline" type="button">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        Login with Google
                      </Button>
                    </Field>
                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                      Or continue with
                    </FieldSeparator>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        required
                      />
                    </Field>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                          href="#"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <Button type="submit">Login</Button>
                      <FieldDescription className="text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="#" onClick={() => setFlow("signup")}>
                          Sign up
                        </Link>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
              By clicking continue, you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </FieldDescription>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>
                  Enter your email below to create your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">Full Name</FieldLabel>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        required
                      />
                    </Field>
                    <Field>
                      <Field className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                          <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="confirm-password">
                            Confirm Password
                          </FieldLabel>
                          <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </Field>
                      </Field>
                      <FieldDescription>
                        Must be at least 8 characters long.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <Button type="submit">Create Account</Button>
                      <FieldDescription className="text-center">
                        Already have an account?{" "}
                        <Link href="#" onClick={() => setFlow("login")}>
                          Sign in
                        </Link>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
              By clicking continue, you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </FieldDescription>
          </div>
        )}
      </div>
    </div>
  );
}
