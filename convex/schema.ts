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

  tasks: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("one_time"), v.literal("recurring")),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    assignedByUserId: v.string(),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
          v.literal("yearly"),
        ),
        interval: v.number(),
        timezone: v.string(),
      }),
    ),
    nextRunAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_org_and_priority", ["organizationId", "priority"])
    .index("by_org_and_type", ["organizationId", "type"])
    .index("by_org_and_assigned_by", ["organizationId", "assignedByUserId"]),

  taskAssignments: defineTable({
    organizationId: v.id("organizations"),
    taskId: v.id("tasks"),
    assigneeUserId: v.string(),
    approverUserId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed_requested"),
      v.literal("completed_finalized"),
      v.literal("disputed"),
    ),
    deadline: v.optional(v.number()),
    completedRequestedAt: v.optional(v.number()),
    completedFinalizedAt: v.optional(v.number()),
    disputedAt: v.optional(v.number()),
    disputeReason: v.optional(v.string()),
    recurringRunAt: v.optional(v.number()),
    lastStatusUpdatedByUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_task", ["taskId"])
    .index("by_assignee", ["assigneeUserId"])
    .index("by_org_and_assignee", ["organizationId", "assigneeUserId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_org_and_approver", ["organizationId", "approverUserId"])
    .index("by_task_assignee_run", ["taskId", "assigneeUserId", "recurringRunAt"]),

  recurringTaskRuns: defineTable({
    organizationId: v.id("organizations"),
    taskId: v.id("tasks"),
    assigneeUserId: v.string(),
    runAt: v.number(),
    taskAssignmentId: v.id("taskAssignments"),
    generatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_task_assignee_run", ["taskId", "assigneeUserId", "runAt"])
    .index("by_org", ["organizationId"]),

  taskApprovalRequests: defineTable({
    organizationId: v.id("organizations"),
    taskId: v.id("tasks"),
    taskAssignmentId: v.id("taskAssignments"),
    requestedByUserId: v.string(),
    approverUserId: v.string(),
    requestedStatus: v.literal("completed_finalized"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestedAt: v.number(),
    decisionAt: v.optional(v.number()),
    decisionByUserId: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_assignment", ["taskAssignmentId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_org_approver_status", ["organizationId", "approverUserId", "status"]),

  taskReschedules: defineTable({
    organizationId: v.id("organizations"),
    taskId: v.id("tasks"),
    taskAssignmentId: v.id("taskAssignments"),
    oldDeadline: v.number(),
    newDeadline: v.number(),
    reason: v.optional(v.string()),
    changedByUserId: v.string(),
    changedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_task", ["taskId"])
    .index("by_assignment", ["taskAssignmentId"]),

  taskAttachments: defineTable({
    organizationId: v.id("organizations"),
    taskId: v.id("tasks"),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.optional(v.number()),
    storageKey: v.string(),
    url: v.string(),
    uploadedByUserId: v.string(),
    uploadedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_task", ["taskId"]),
});
