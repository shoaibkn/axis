import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    ownerUserId: v.string(),
    imageUrl: v.optional(v.string()),
    imageKey: v.optional(v.string()),
    createdAt: v.number(),
    onboardingCompletedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_owner_user", ["ownerUserId"]),

  memberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("manager"),
      v.literal("admin"),
      v.literal("member"),
    ),
    isDisabled: v.optional(v.boolean()),
    createdAt: v.number(),
    joinedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  departments: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    managerUserIds: v.array(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_org_and_slug", ["organizationId", "slug"]),

  departmentMembers: defineTable({
    organizationId: v.id("organizations"),
    departmentId: v.id("departments"),
    userId: v.string(),
    addedByUserId: v.string(),
    addedAt: v.number(),
  })
    .index("by_department", ["departmentId"])
    .index("by_user", ["userId"])
    .index("by_department_and_user", ["departmentId", "userId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("manager"), v.literal("admin"), v.literal("member")),
    invitedByUserId: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("cancelled"),
    ),
  })
    .index("by_token", ["token"])
    .index("by_organization", ["organizationId"])
    .index("by_org_and_email", ["organizationId", "email"]),
});
