import { Resend } from "@convex-dev/resend";
import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
} from "convex/server";
import { components } from "./_generated/api";

const INVITE_EXPIRES_DAYS = 7;
const FALLBACK_FROM = "Axis <onboarding@resend.dev>";

type RunMutationCtx =
  | GenericMutationCtx<GenericDataModel>
  | GenericActionCtx<GenericDataModel>;

export const resend = new Resend(components.resend, {
  testMode: process.env.RESEND_TEST_MODE !== "false",
});

const getSiteUrl = () =>
  process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const getFromAddress = () => process.env.RESEND_FROM_EMAIL ?? FALLBACK_FROM;

export async function sendEmailVerification(
  ctx: RunMutationCtx,
  args: { to: string; url: string },
) {
  await resend.sendEmail(ctx, {
    from: getFromAddress(),
    to: args.to,
    subject: "Verify your Axis account",
    html: `<p>Welcome to Axis.</p><p>Please verify your email address by clicking <a href="${args.url}">this link</a>.</p>`,
    text: `Welcome to Axis. Verify your email address: ${args.url}`,
  });
}

export async function sendResetPasswordEmail(
  ctx: RunMutationCtx,
  args: { to: string; url: string },
) {
  await resend.sendEmail(ctx, {
    from: getFromAddress(),
    to: args.to,
    subject: "Reset your Axis password",
    html: `<p>You requested a password reset.</p><p>Click <a href="${args.url}">this link</a> to continue.</p>`,
    text: `You requested a password reset. Continue here: ${args.url}`,
  });
}

export async function sendInvitationEmail(
  ctx: RunMutationCtx,
  args: {
    to: string;
    organizationName: string;
    role: "manager" | "admin" | "member";
    token: string;
  },
) {
  const inviteUrl = `${getSiteUrl()}/accept-invite?token=${encodeURIComponent(args.token)}`;

  await resend.sendEmail(ctx, {
    from: getFromAddress(),
    to: args.to,
    subject: `You are invited to join ${args.organizationName} on Axis`,
    html: `<p>You were invited to join <strong>${args.organizationName}</strong> as <strong>${args.role}</strong>.</p><p>This link expires in ${INVITE_EXPIRES_DAYS} days.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
    text: `You were invited to join ${args.organizationName} as ${args.role}. This link expires in ${INVITE_EXPIRES_DAYS} days. Accept: ${inviteUrl}`,
  });
}
