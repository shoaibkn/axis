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

async function getUserInfo(ctx: any, userId: string) {
  return await ctx.runQuery(components.betterAuth.users.getUser, { userId });
}

export const create = mutation({
  args: {
    organisationId: v.id("organisations"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
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

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin" && !employee.isManager)) {
      throw new Error("Not authorized");
    }

    const existingCount = await ctx.db
      .query("departments")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .collect()
      .then((depts) => depts.length);

    if (existingCount >= org.maxDepartments) {
      throw new Error(`You have reached the limit of ${org.maxDepartments} departments for your ${org.subscriptionTier} plan`);
    }

    const departmentId = await ctx.db.insert("departments", {
      organisationId: args.organisationId,
      name: args.name,
      description: args.description,
      color: args.color || "#3b82f6",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("departmentManagers", {
      departmentId,
      employeeId: employee._id,
      isPrimary: true,
      assignedAt: Date.now(),
    });

    return departmentId;
  },
});

export const getByOrganisation = query({
  args: { organisationId: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.organisationId)
      )
      .first();

    if (!employee || !employee.isActive) {
      return [];
    }

    const departments = await ctx.db
      .query("departments")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .order("asc")
      .collect();

    const departmentsWithManagers = await Promise.all(
      departments.map(async (dept) => {
        const managers = await ctx.db
          .query("departmentManagers")
          .withIndex("departmentId", (q) => q.eq("departmentId", dept._id))
          .collect();

        const managerDetails = await Promise.all(
          managers.map(async (m) => {
            const emp = await ctx.db.get(m.employeeId);
            if (!emp) return null;
            const user = await getUserInfo(ctx, emp.userId);
            return {
              ...m,
              employee: emp,
              user: user ? { name: user.name, email: user.email, image: user.image } : null,
            };
          })
        );

        return {
          ...dept,
          managers: managerDetails.filter((m): m is NonNullable<typeof m> => m !== null),
        };
      })
    );

    return departmentsWithManagers;
  },
});

export const getById = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }

    const dept = await ctx.db.get(args.id);
    if (!dept) {
      return null;
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", dept.organisationId)
      )
      .first();

    if (!employee || !employee.isActive) {
      return null;
    }

    const managers = await ctx.db
      .query("departmentManagers")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const employeesWithUser = await Promise.all(
      employees.map(async (emp) => {
        const user = await getUserInfo(ctx, emp.userId);
        return {
          ...emp,
          user: user ? { name: user.name, email: user.email, image: user.image } : null,
        };
      })
    );

    return {
      ...dept,
      managers,
      employees: employeesWithUser,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const dept = await ctx.db.get(args.id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", dept.organisationId)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin" && !employee.isManager)) {
      throw new Error("Not authorized");
    }

    const isManagerOfDept = await ctx.db
      .query("departmentManagers")
      .withIndex("departmentId_employeeId", (q) =>
        q.eq("departmentId", args.id).eq("employeeId", employee._id)
      )
      .first();

    if (employee.role !== "owner" && employee.role !== "admin" && !isManagerOfDept) {
      throw new Error("Not authorized to edit this department");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const addManager = mutation({
  args: {
    departmentId: v.id("departments"),
    employeeId: v.id("employees"),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const dept = await ctx.db.get(args.departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", dept.organisationId)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const targetEmployee = await ctx.db.get(args.employeeId);
    if (!targetEmployee || targetEmployee.organisationId !== dept.organisationId) {
      throw new Error("Employee not found");
    }

    const existingManager = await ctx.db
      .query("departmentManagers")
      .withIndex("departmentId_employeeId", (q) =>
        q.eq("departmentId", args.departmentId).eq("employeeId", args.employeeId)
      )
      .first();

    if (existingManager) {
      throw new Error("Employee is already a manager of this department");
    }

    await ctx.db.insert("departmentManagers", {
      departmentId: args.departmentId,
      employeeId: args.employeeId,
      isPrimary: args.isPrimary || false,
      assignedAt: Date.now(),
    });

    await ctx.db.patch(args.employeeId, {
      isManager: true,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const removeManager = mutation({
  args: {
    departmentId: v.id("departments"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const dept = await ctx.db.get(args.departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", dept.organisationId)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const managerRecord = await ctx.db
      .query("departmentManagers")
      .withIndex("departmentId_employeeId", (q) =>
        q.eq("departmentId", args.departmentId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!managerRecord) {
      throw new Error("Manager record not found");
    }

    await ctx.db.delete(managerRecord._id);

    const otherDepartments = await ctx.db
      .query("departmentManagers")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    if (otherDepartments.length === 0) {
      await ctx.db.patch(args.employeeId, {
        isManager: false,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const dept = await ctx.db.get(args.id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", dept.organisationId)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const managers = await ctx.db
      .query("departmentManagers")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .collect();
    for (const m of managers) {
      await ctx.db.delete(m._id);
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .collect();
    for (const emp of employees) {
      await ctx.db.patch(emp._id, {
        departmentId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
