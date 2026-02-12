import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { components } from "./_generated/api";

async function getCurrentUserId(ctx: any): Promise<string | null> {
  try {
    const user = await authComponent.getAuthUser(ctx);
    return user?._id ?? null;
  } catch {
    return null;
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const sendInvitation = mutation({
  args: {
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.organisationId);
    if (!org) {
      throw new Error("Organisation not found");
    }

    const inviter = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (!inviter || (inviter.role !== "owner" && inviter.role !== "admin")) {
      throw new Error("Not authorized to send invitations");
    }

    const employeeCount = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((emps) => emps.length);

    const pendingInvitations = await ctx.db
      .query("invitations")
      .withIndex("organisationId_status", (q) =>
        q.eq("organisationId", args.organisationId).eq("status", "pending")
      )
      .collect();

    const totalMembers = employeeCount + pendingInvitations.length;
    if (totalMembers >= org.maxEmployees) {
      throw new Error(
        `You have reached the limit of ${org.maxEmployees} employees for your ${org.subscriptionTier} plan. Please upgrade to add more members.`
      );
    }

    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .collect()
      .then((emps) => emps.find((e) => {
        return false;
      }));

    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("email_status", (q) =>
        q.eq("email", args.email.toLowerCase()).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("organisationId"), args.organisationId))
      .first();

    if (existingInvitation) {
      throw new Error("An invitation has already been sent to this email");
    }

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const invitationId = await ctx.db.insert("invitations", {
      organisationId: args.organisationId,
      departmentId: args.departmentId,
      email: args.email.toLowerCase(),
      role: args.role,
      invitedBy: inviter._id,
      token,
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
    });

    // TODO: Send invitation email via action once types are regenerated
    // await ctx.scheduler.runAfter(0, api.actions.sendInvitationEmail, {
    //   to: args.email,
    //   organisationName: org.name,
    //   inviterName: (await ctx.runQuery(components.betterAuth.users.getUser, { userId }))?.name || "Someone",
    //   token,
    // });
    console.log(`Invitation created for ${args.email} with token ${token}`);

    return invitationId;
  },
});

export const validateToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return { valid: false, reason: "invitation_not_found" };
    }

    if (invitation.status !== "pending") {
      return { valid: false, reason: "already_used" };
    }

    if (invitation.expiresAt < Date.now()) {
      return { valid: false, reason: "expired" };
    }

    const org = await ctx.db.get(invitation.organisationId);
    if (!org) {
      return { valid: false, reason: "organisation_not_found" };
    }

    let department = null;
    if (invitation.departmentId) {
      department = await ctx.db.get(invitation.departmentId);
    }

    return {
      valid: true,
      invitation: {
        ...invitation,
        organisationName: org.name,
        departmentName: department?.name || null,
      },
    };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been used");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    const user = await ctx.runQuery(components.betterAuth.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }

    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", invitation.organisationId)
      )
      .first();

    if (existingEmployee) {
      await ctx.db.patch(existingEmployee._id, {
        isActive: true,
        departmentId: invitation.departmentId,
        role: invitation.role,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("employees", {
        userId,
        organisationId: invitation.organisationId,
        departmentId: invitation.departmentId,
        role: invitation.role,
        isManager: false,
        isActive: true,
        joinedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedByUserId: userId,
    });

    return {
      success: true,
      organisationId: invitation.organisationId,
    };
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const requester = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", invitation.organisationId)
      )
      .first();

    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
    });

    return true;
  },
});

export const getByOrganisation = query({
  args: { organisationId: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const requester = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      return [];
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .order("desc")
      .collect();

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        const inviterUser = inviter
          ? await ctx.runQuery(components.betterAuth.users.getUser, { userId: inviter.userId })
          : null;
        const department = inv.departmentId ? await ctx.db.get(inv.departmentId) : null;

        return {
          ...inv,
          inviterName: inviterUser?.name || "Unknown",
          departmentName: department?.name || null,
        };
      })
    );

    return invitationsWithDetails;
  },
});

export const resend = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const requester = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", invitation.organisationId)
      )
      .first();

    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new Error("Not authorized");
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only resend pending invitations");
    }

    const org = await ctx.db.get(invitation.organisationId);
    if (!org) {
      throw new Error("Organisation not found");
    }

    const newToken = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.invitationId, {
      token: newToken,
      expiresAt,
    });

    // TODO: Resend invitation email via action once types are regenerated
    // await ctx.scheduler.runAfter(0, api.actions.sendInvitationEmail, {
    //   to: invitation.email,
    //   organisationName: org.name,
    //   inviterName: (await ctx.runQuery(components.betterAuth.users.getUser, { userId }))?.name || "Someone",
    //   token: newToken,
    // });
    console.log(`Invitation resent to ${invitation.email} with new token ${newToken}`);

    return true;
  },
});
