import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMembership, requireOwnerOrManager } from "./access";

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const now = () => Date.now();

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);

    return ctx.db
      .query("departments")
      .withIndex("by_organization", (q) => q.eq("organizationId", membership.organizationId))
      .collect();
  },
});

export const listDepartmentsWithMeta = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_organization", (q) => q.eq("organizationId", membership.organizationId))
      .collect();

    const result = await Promise.all(
      departments.map(async (department) => {
        const members = await ctx.db
          .query("departmentMembers")
          .withIndex("by_department", (q) => q.eq("departmentId", department._id))
          .collect();

        return {
          ...department,
          memberCount: members.length,
          hasUsers: members.length > 0,
        };
      }),
    );

    return result;
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    managerUserIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireOwnerOrManager(ctx);

    const slug = normalizeSlug(args.name);
    if (!slug) {
      throw new ConvexError("Department name is invalid.");
    }

    const existing = await ctx.db
      .query("departments")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("organizationId", membership.organizationId).eq("slug", slug),
      )
      .first();

    if (existing) {
      throw new ConvexError("Department already exists.");
    }

    return ctx.db.insert("departments", {
      organizationId: membership.organizationId,
      name: args.name.trim(),
      slug,
      managerUserIds: args.managerUserIds ?? [],
      createdByUserId: userId,
      createdAt: now(),
    });
  },
});

export const updateDepartment = mutation({
  args: {
    departmentId: v.id("departments"),
    name: v.string(),
    managerUserIds: v.optional(v.array(v.string())),
    confirmHasUsers: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOwnerOrManager(ctx);
    const department = await ctx.db.get(args.departmentId);
    if (!department || department.organizationId !== membership.organizationId) {
      throw new ConvexError("Department not found.");
    }

    const members = await ctx.db
      .query("departmentMembers")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    if (members.length > 0 && !args.confirmHasUsers) {
      throw new ConvexError(
        "This department has users. Confirm changes before updating.",
      );
    }

    const slug = normalizeSlug(args.name);
    if (!slug) {
      throw new ConvexError("Department name is invalid.");
    }

    const existing = await ctx.db
      .query("departments")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("organizationId", membership.organizationId).eq("slug", slug),
      )
      .first();

    if (existing && existing._id !== args.departmentId) {
      throw new ConvexError("Department name already exists.");
    }

    await ctx.db.patch(args.departmentId, {
      name: args.name.trim(),
      slug,
      managerUserIds: args.managerUserIds ?? [],
    });
  },
});

export const deleteDepartment = mutation({
  args: {
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOwnerOrManager(ctx);
    const department = await ctx.db.get(args.departmentId);
    if (!department || department.organizationId !== membership.organizationId) {
      throw new ConvexError("Department not found.");
    }

    const members = await ctx.db
      .query("departmentMembers")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    if (members.length > 0) {
      throw new ConvexError("Cannot delete a department that still has users.");
    }

    await ctx.db.delete(args.departmentId);
  },
});

export const setUserDepartments = mutation({
  args: {
    userId: v.string(),
    departmentIds: v.array(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const { userId: actorUserId, membership } = await requireOwnerOrManager(ctx);

    const orgMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!orgMembership) {
      throw new ConvexError("Target user is not part of this organization.");
    }

    const uniqueDepartmentIds = [...new Set(args.departmentIds)];

    for (const departmentId of uniqueDepartmentIds) {
      const department = await ctx.db.get(departmentId);
      if (!department || department.organizationId !== membership.organizationId) {
        throw new ConvexError("One or more departments are invalid.");
      }
    }

    const existingAssignments = await ctx.db
      .query("departmentMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const inOrgAssignments = existingAssignments.filter(
      (assignment) => assignment.organizationId === membership.organizationId,
    );

    const wanted = new Set(uniqueDepartmentIds.map(String));
    const current = new Set(inOrgAssignments.map((assignment) => String(assignment.departmentId)));

    for (const assignment of inOrgAssignments) {
      if (!wanted.has(String(assignment.departmentId))) {
        await ctx.db.delete(assignment._id);
      }
    }

    for (const departmentId of uniqueDepartmentIds) {
      if (!current.has(String(departmentId))) {
        await ctx.db.insert("departmentMembers", {
          organizationId: membership.organizationId,
          departmentId,
          userId: args.userId,
          addedByUserId: actorUserId,
          addedAt: now(),
        });
      }
    }
  },
});
