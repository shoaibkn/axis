import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { requireMembership, requireOwnerOrManager } from "./access";

const now = () => Date.now();

export const listOrganizationUsers = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", membership.organizationId))
      .collect();

    const users = await Promise.all(
      memberships.map(async (entry) => {
        const authUser = await authComponent.getAnyUserById(ctx, entry.userId);
        const departments = await ctx.db
          .query("departmentMembers")
          .withIndex("by_user", (q) => q.eq("userId", entry.userId))
          .collect();

        const orgDepartments = departments.filter(
          (department) => department.organizationId === membership.organizationId,
        );

        return {
          membership: entry,
          user: authUser,
          departmentIds: orgDepartments.map((department) => department.departmentId),
        };
      }),
    );

    return users;
  },
});

export const updateUserRole = mutation({
  args: {
    targetUserId: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { userId: actorUserId, membership } = await requireOwnerOrManager(ctx);
    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", args.targetUserId),
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("User membership not found.");
    }

    if (targetMembership.role === "owner") {
      throw new ConvexError("Owner role cannot be changed from organization settings.");
    }

    if (targetMembership.userId === actorUserId && membership.role !== "owner") {
      throw new ConvexError("Managers cannot change their own role.");
    }

    await ctx.db.patch(targetMembership._id, {
      role: args.role,
    });
  },
});

export const setUserDisabled = mutation({
  args: {
    targetUserId: v.string(),
    disabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId: actorUserId, membership } = await requireOwnerOrManager(ctx);
    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", args.targetUserId),
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("User membership not found.");
    }

    if (targetMembership.role === "owner") {
      throw new ConvexError("Owner account can only be managed from their own profile.");
    }

    if (targetMembership.userId === actorUserId) {
      throw new ConvexError("Manage your own account from profile.");
    }

    await ctx.db.patch(targetMembership._id, {
      isDisabled: args.disabled,
      joinedAt: args.disabled ? targetMembership.joinedAt : targetMembership.joinedAt ?? now(),
    });
  },
});

export const removeUserFromOrganization = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId: actorUserId, membership } = await requireOwnerOrManager(ctx);
    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", args.targetUserId),
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("User membership not found.");
    }

    if (targetMembership.role === "owner") {
      throw new ConvexError("Owner account can only be managed from their own profile.");
    }

    if (targetMembership.userId === actorUserId) {
      throw new ConvexError("Manage your own account from profile.");
    }

    const departmentMemberships = await ctx.db
      .query("departmentMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .collect();

    for (const departmentMembership of departmentMemberships) {
      if (departmentMembership.organizationId === membership.organizationId) {
        await ctx.db.delete(departmentMembership._id);
      }
    }

    await ctx.db.delete(targetMembership._id);
  },
});

export const sendPasswordResetForUser = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId: actorUserId, membership } = await requireOwnerOrManager(ctx);
    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", args.targetUserId),
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("User membership not found.");
    }

    if (targetMembership.role === "owner" && targetMembership.userId !== actorUserId) {
      throw new ConvexError("Owner account can only be managed from their own profile.");
    }

    const targetUser = await authComponent.getAnyUserById(ctx, args.targetUserId);
    if (!targetUser?.email) {
      throw new ConvexError("Target user email not found.");
    }

    const auth = createAuth(ctx);
    await auth.api.requestPasswordReset({
      body: {
        email: targetUser.email,
        redirectTo: `${process.env.SITE_URL ?? "http://localhost:3000"}/reset-password`,
      },
    });
  },
});
