import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { sendInvitationEmail } from "./email";
import { isManagerRole } from "./access";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const now = () => Date.now();

const createInviteToken = () => crypto.randomUUID();

export const listInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = String(user._id);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership) {
      return [];
    }

    return ctx.db
      .query("invitations")
      .withIndex("by_organization", (q) => q.eq("organizationId", membership.organizationId))
      .collect();
  },
});

export const inviteUser = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = String(user._id);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership) {
      throw new ConvexError("Organization membership not found.");
    }

    if (!isManagerRole(membership.role)) {
      throw new ConvexError("Only owners and managers can invite users.");
    }

    const organization = await ctx.db.get(membership.organizationId);
    if (!organization) {
      throw new ConvexError("Organization not found.");
    }

    const email = args.email.trim().toLowerCase();
    const token = createInviteToken();

    const invitationId = await ctx.db.insert("invitations", {
      organizationId: organization._id,
      email,
      role: args.role,
      invitedByUserId: userId,
      token,
      createdAt: now(),
      expiresAt: now() + INVITATION_TTL_MS,
      status: "pending",
    });

    await sendInvitationEmail(ctx, {
      to: email,
      organizationName: organization.name,
      role: args.role,
      token,
    });

    return invitationId;
  },
});

export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = String(user._id);
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new ConvexError("Invitation is invalid.");
    }

    if (invitation.status !== "pending") {
      throw new ConvexError("Invitation is not pending.");
    }

    if (invitation.expiresAt < now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new ConvexError("Invitation has expired.");
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ConvexError("You must sign in with the invited email address.");
    }

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", invitation.organizationId).eq("userId", userId),
      )
      .first();

    if (!existingMembership) {
      await ctx.db.insert("memberships", {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        createdAt: now(),
        joinedAt: now(),
      });
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now(),
    });

    return invitation.organizationId;
  },
});

export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return null;
    }

    const organization = await ctx.db.get(invitation.organizationId);
    return {
      invitation,
      organization,
      isExpired: invitation.expiresAt < now(),
    };
  },
});
