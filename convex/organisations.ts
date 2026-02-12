import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { components } from "./_generated/api";

const SUBSCRIPTION_LIMITS = {
  free: { maxDepartments: 1, maxEmployees: 10 },
  pro: { maxDepartments: 20, maxEmployees: 50 },
  enterprise: { maxDepartments: 999999, maxEmployees: 999999 },
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
    name: v.string(),
    description: v.optional(v.string()),
    subscriptionTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const tier = args.subscriptionTier || "free";
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
    
    if (!limits) {
      throw new Error("Invalid subscription tier");
    }

    const slug = generateSlug(args.name);
    
    const existingOrg = await ctx.db
      .query("organisations")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .first();
    
    if (existingOrg) {
      throw new Error("Organisation with this name already exists");
    }

    const organisationId = await ctx.db.insert("organisations", {
      name: args.name,
      slug,
      description: args.description,
      ownerId: userId,
      subscriptionTier: tier,
      subscriptionStatus: "active",
      maxDepartments: limits.maxDepartments,
      maxEmployees: limits.maxEmployees,
      onboardingCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("employees", {
      userId,
      organisationId,
      role: "owner",
      jobTitle: "Organisation Owner",
      isManager: true,
      isActive: true,
      joinedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organisationId;
  },
});

export const getMyOrganisations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const organisations = await Promise.all(
      employees.map(async (emp) => {
        const org = await ctx.db.get(emp.organisationId);
        if (!org) return null;
        return {
          ...org,
          employeeId: emp._id,
          myRole: emp.role,
          myDepartmentId: emp.departmentId,
        };
      })
    );

    return organisations.filter((o): o is NonNullable<typeof o> => o !== null);
  },
});

export const getById = query({
  args: { id: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }

    const org = await ctx.db.get(args.id);
    if (!org) {
      return null;
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.id)
      )
      .first();

    if (!employee || !employee.isActive) {
      return null;
    }

    const departmentCount = await ctx.db
      .query("departments")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.id))
      .collect()
      .then((depts) => depts.length);

    const employeeCount = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((emps) => emps.length);

    return {
      ...org,
      currentDepartmentCount: departmentCount,
      currentEmployeeCount: employeeCount,
      myEmployeeId: employee._id,
      myRole: employee.role,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("organisations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organisation not found");
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId_organisationId", (q) =>
        q.eq("userId", userId).eq("organisationId", args.id)
      )
      .first();

    if (!employee || (employee.role !== "owner" && employee.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) {
      updates.name = args.name;
      updates.slug = generateSlug(args.name);
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.website !== undefined) updates.website = args.website;

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const updateSubscription = mutation({
  args: {
    id: v.id("organisations"),
    subscriptionTier: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organisation not found");
    }

    if (org.ownerId !== userId) {
      throw new Error("Only the owner can change subscription");
    }

    const limits = SUBSCRIPTION_LIMITS[args.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS];
    if (!limits) {
      throw new Error("Invalid subscription tier");
    }

    if (args.subscriptionTier === "pro" || args.subscriptionTier === "enterprise") {
      const ownerOrgs = await ctx.db
        .query("organisations")
        .withIndex("ownerId", (q) => q.eq("ownerId", userId))
        .collect();
      
      const existingPaidOrg = ownerOrgs.find(
        (o) => o._id !== args.id && 
        (o.subscriptionTier === "pro" || o.subscriptionTier === "enterprise")
      );
      
      if (existingPaidOrg) {
        throw new Error("You can only have one Pro or Enterprise organisation. Please downgrade your other organisation first.");
      }
    }

    await ctx.db.patch(args.id, {
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: "active",
      maxDepartments: limits.maxDepartments,
      maxEmployees: limits.maxEmployees,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const completeOnboarding = mutation({
  args: { id: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organisation not found");
    }

    if (org.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const checkLimits = query({
  args: { organisationId: v.id("organisations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organisationId);
    if (!org) {
      throw new Error("Organisation not found");
    }

    const departmentCount = await ctx.db
      .query("departments")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .collect()
      .then((depts) => depts.length);

    const employeeCount = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.organisationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((emps) => emps.length);

    return {
      canCreateDepartment: departmentCount < org.maxDepartments,
      canInviteEmployee: employeeCount < org.maxEmployees,
      departmentsUsed: departmentCount,
      employeesUsed: employeeCount,
      departmentsLimit: org.maxDepartments,
      employeesLimit: org.maxEmployees,
      departmentSpotsLeft: org.maxDepartments - departmentCount,
      employeeSpotsLeft: org.maxEmployees - employeeCount,
    };
  },
});

export const deleteOrganisation = mutation({
  args: { id: v.id("organisations") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.id);
    if (!org) {
      throw new Error("Organisation not found");
    }

    if (org.ownerId !== userId) {
      throw new Error("Only the owner can delete the organisation");
    }

    const departments = await ctx.db
      .query("departments")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.id))
      .collect();
    for (const dept of departments) {
      await ctx.db.delete(dept._id);
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.id))
      .collect();
    for (const emp of employees) {
      await ctx.db.delete(emp._id);
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("organisationId", (q) => q.eq("organisationId", args.id))
      .collect();
    for (const inv of invitations) {
      await ctx.db.delete(inv._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
