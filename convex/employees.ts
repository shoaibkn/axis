import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
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

async function getUserInfo(ctx: any, userId: string) {
  return await ctx.runQuery(components.betterAuth.users.getUser, { userId });
}

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

    if (!requester || !requester.isActive) {
      return [];
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const employeesWithUser = await Promise.all(
      employees.map(async (emp) => {
        const user = await getUserInfo(ctx, emp.userId);
        let department = null;
        if (emp.departmentId) {
          department = await ctx.db.get(emp.departmentId);
        }
        return {
          ...emp,
          user: user
            ? {
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
          department: department
            ? {
                name: department.name,
                color: department.color,
              }
            : null,
        };
      })
    );

    return employeesWithUser;
  },
});

export const getMeInOrganisation = query({
  args: { organisationId: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (!employee || !employee.isActive) {
      return null;
    }

    const user = await getUserInfo(ctx, employee.userId);
    let department = null;
    if (employee.departmentId) {
      department = await ctx.db.get(employee.departmentId);
    }

    return {
      ...employee,
      user: user
        ? {
            name: user.name,
            email: user.email,
            image: user.image,
          }
        : null,
      department: department
        ? {
            name: department.name,
            color: department.color,
          }
        : null,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    departmentId: v.optional(v.id("departments")),
    jobTitle: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const employee = await ctx.db.get(args.id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const requester = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", employee.organisationId)
      )
      .first();

    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.departmentId !== undefined) updates.departmentId = args.departmentId;
    if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
    if (args.role !== undefined) updates.role = args.role;

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const removeFromOrganisation = mutation({
  args: {
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const requester = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", employee.organisationId)
      )
      .first();

    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new Error("Not authorized");
    }

    if (employee.role === "owner") {
      throw new Error("Cannot remove organisation owner");
    }

    const departments = await ctx.db
      .query("departmentManagers")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    for (const dept of departments) {
      await ctx.db.delete(dept._id);
    }

    await ctx.db.patch(args.employeeId, {
      isActive: false,
      departmentId: undefined,
      isManager: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const createEmployeeFromInvitation = internalMutation({
  args: {
    userId: v.string(),
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    role: v.string(),
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const existingEmployee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", args.userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (existingEmployee) {
      await ctx.db.patch(existingEmployee._id, {
        isActive: true,
        departmentId: args.departmentId,
        role: args.role,
        updatedAt: Date.now(),
      });
      return existingEmployee._id;
    }

    const employeeId = await ctx.db.insert("employees", {
      userId: args.userId,
      organisationId: args.organisationId,
      departmentId: args.departmentId,
      role: args.role,
      isManager: false,
      isActive: true,
      joinedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedByUserId: args.userId,
    });

    return employeeId;
  },
});
