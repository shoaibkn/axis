import { v } from "convex/values";
import { action } from "./_generated/server";
import { sendInvitationEmail as sendEmail } from "./email";
import { components } from "./_generated/api";

export const sendInvitationEmail = action({
  args: {
    to: v.string(),
    organisationName: v.string(),
    inviterName: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail(ctx, {
      to: args.to,
      organisationName: args.organisationName,
      inviterName: args.inviterName,
      token: args.token,
    });
    return { success: true };
  },
});
