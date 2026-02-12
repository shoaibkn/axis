import "./polyfills";
import VerifyEmail from "./emails/verifyEmail";
import MagicLinkEmail from "./emails/magicLink";
import VerifyOTP from "./emails/verifyOTP";
import InvitationEmail from "./emails/invitation";
import { render } from "@react-email/components";
import React from "react";
import ResetPasswordEmail from "./emails/resetPassword";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { type ActionCtx, type MutationCtx, type QueryCtx } from "./_generated/server";

export const resend = new Resend(components.resend, {
  testMode: false,
});

export const sendEmailVerification = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  console.log("Sending email verification");
  await resend.sendEmail(ctx, {
    from: "Test <onboarding@resend.dev>",
    to,
    subject: "Verify your email address",
    html: await render(<VerifyEmail url={url} />),
  });
};

export const sendOTPVerification = async (
  ctx: ActionCtx,
  {
    to,
    code,
  }: {
    to: string;
    code: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Test <onboarding@resend.dev>",
    to,
    subject: "Verify your email address",
    html: await render(<VerifyOTP code={code} />),
  });
};

export const sendMagicLink = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Test <onboarding@resend.dev>",
    to,
    subject: "Sign in to your account",
    html: await render(<MagicLinkEmail url={url} />),
  });
};

export const sendResetPassword = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Test <onboarding@resend.dev>",
    to,
    subject: "Reset your password",
    html: await render(<ResetPasswordEmail url={url} />),
  });
};

// Note: sendInvitationEmail should be called from an action, not directly from a mutation
// For now, we'll create a simple internal action to handle this
export const sendInvitationEmail = async (
  ctx: ActionCtx,
  {
    to,
    organisationName,
    inviterName,
    token,
  }: {
    to: string;
    organisationName: string;
    inviterName: string;
    token: string;
  },
) => {
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/invite/${token}`;
  
  await resend.sendEmail(ctx, {
    from: "Test <onboarding@resend.dev>",
    to,
    subject: `You've been invited to join ${organisationName} on Axis`,
    html: await render(
      <InvitationEmail
        organisationName={organisationName}
        inviterName={inviterName}
        url={url}
      />
    ),
  });
};
