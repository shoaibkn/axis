import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.string(),
  }).index("userId", ["userId"]),
  organisations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    ownerId: v.string(),
    subscriptionTier: v.string(),
    subscriptionStatus: v.string(),
    subscriptionExpiry: v.optional(v.number()),
    maxDepartments: v.number(),
    maxEmployees: v.number(),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("name", ["name"])
    .index("slug", ["slug"])
    .index("ownerId", ["ownerId"])
    .index("subscriptionTier", ["subscriptionTier"]),
  departments: defineTable({
    organisationId: v.id("organisations"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organisationId", ["organisationId"])
    .index("organisationId_name", ["organisationId", "name"]),
  employees: defineTable({
    userId: v.string(),
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    role: v.string(),
    jobTitle: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
    isManager: v.boolean(),
    isActive: v.boolean(),
    joinedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("organisationId", ["organisationId"])
    .index("userId_organisationId", ["userId", "organisationId"])
    .index("departmentId", ["departmentId"])
    .index("isManager", ["isManager"])
    .index("organisationId_isManager", ["organisationId", "isManager"]),
  departmentManagers: defineTable({
    departmentId: v.id("departments"),
    employeeId: v.id("employees"),
    isPrimary: v.boolean(),
    assignedAt: v.number(),
  })
    .index("departmentId", ["departmentId"])
    .index("employeeId", ["employeeId"])
    .index("departmentId_employeeId", ["departmentId", "employeeId"]),
  tasks: defineTable({
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    assigneeId: v.optional(v.id("employees")),
    creatorId: v.id("employees"),
    dueDate: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organisationId", ["organisationId"])
    .index("departmentId", ["departmentId"])
    .index("assigneeId", ["assigneeId"])
    .index("creatorId", ["creatorId"])
    .index("status", ["status"])
    .index("organisationId_status", ["organisationId", "status"])
    .index("assigneeId_status", ["assigneeId", "status"])
    .index("dueDate", ["dueDate"]),
  taskComments: defineTable({
    taskId: v.id("tasks"),
    employeeId: v.id("employees"),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("taskId_createdAt", ["taskId", "createdAt"]),
  timeEntries: defineTable({
    taskId: v.id("tasks"),
    employeeId: v.id("employees"),
    organisationId: v.id("organisations"),
    description: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    isRunning: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("employeeId", ["employeeId"])
    .index("organisationId", ["organisationId"])
    .index("employeeId_isRunning", ["employeeId", "isRunning"])
    .index("startedAt", ["startedAt"])
    .index("employeeId_startedAt", ["employeeId", "startedAt"]),
  approvals: defineTable({
    organisationId: v.id("organisations"),
    requesterId: v.id("employees"),
    approverId: v.optional(v.id("employees")),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    relatedTaskId: v.optional(v.id("tasks")),
    relatedTimeEntryId: v.optional(v.id("timeEntries")),
    requestedAt: v.number(),
    decidedAt: v.optional(v.number()),
    comments: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organisationId", ["organisationId"])
    .index("requesterId", ["requesterId"])
    .index("approverId", ["approverId"])
    .index("status", ["status"])
    .index("organisationId_status", ["organisationId", "status"])
    .index("requesterId_status", ["requesterId", "status"])
    .index("approverId_status", ["approverId", "status"]),
  approvalWorkflows: defineTable({
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    name: v.string(),
    type: v.string(),
    approverIds: v.array(v.id("employees")),
    requireAllApprovers: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organisationId", ["organisationId"])
    .index("departmentId", ["departmentId"])
    .index("type", ["type"])
    .index("organisationId_type", ["organisationId", "type"]),
  invitations: defineTable({
    organisationId: v.id("organisations"),
    departmentId: v.optional(v.id("departments")),
    email: v.string(),
    role: v.string(),
    invitedBy: v.id("employees"),
    token: v.string(),
    status: v.string(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedByUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("organisationId", ["organisationId"])
    .index("email", ["email"])
    .index("token", ["token"])
    .index("status", ["status"])
    .index("organisationId_status", ["organisationId", "status"])
    .index("email_status", ["email", "status"]),
});
