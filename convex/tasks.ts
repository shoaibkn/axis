import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { isManagerRole, requireMembership } from "./access";

const now = () => Date.now();

const taskPriorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent"),
);

const taskTypeValidator = v.union(v.literal("one_time"), v.literal("recurring"));

const recurrenceValidator = v.object({
  frequency: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly"),
  ),
  interval: v.number(),
  timezone: v.string(),
});

const nextRunAtFrom = (
  from: number,
  recurrence: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
  },
) => {
  const interval = Math.max(1, recurrence.interval);
  const date = new Date(from);
  switch (recurrence.frequency) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + interval);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + interval * 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + interval);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + interval);
      break;
  }
  return date.getTime();
};

const normalizeRole = (role: "owner" | "manager" | "admin" | "member") =>
  role === "admin" ? "manager" : role;

const canAssignTo = ({
  actorRole,
  targetRole,
}: {
  actorRole: "owner" | "manager" | "admin" | "member";
  targetRole: "owner" | "manager" | "admin" | "member";
}) => {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  if (actor === "owner") {
    return target === "manager" || target === "member";
  }

  if (actor === "manager") {
    return target === "member";
  }

  return false;
};

const canUpdateStatus = ({
  actorRole,
  actorUserId,
  assigneeRole,
  assigneeUserId,
}: {
  actorRole: "owner" | "manager" | "admin" | "member";
  actorUserId: string;
  assigneeRole: "owner" | "manager" | "admin" | "member";
  assigneeUserId: string;
}) => {
  const actor = normalizeRole(actorRole);
  const assignee = normalizeRole(assigneeRole);

  if (actor === "owner") {
    return true;
  }

  if (actor === "manager") {
    return assignee !== "owner";
  }

  return actorUserId === assigneeUserId;
};

const taskCardStatusFilterValidator = v.optional(
  v.array(
    v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed_requested"),
      v.literal("completed_finalized"),
      v.literal("disputed"),
    ),
  ),
);

const taskCardFilterArgs = {
  search: v.optional(v.string()),
  priority: v.optional(taskPriorityValidator),
  status: taskCardStatusFilterValidator,
  assigneeUserId: v.optional(v.string()),
  assignedByUserId: v.optional(v.string()),
  departmentId: v.optional(v.id("departments")),
  type: v.optional(taskTypeValidator),
  includeInactiveRecurring: v.optional(v.boolean()),
};

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: taskTypeValidator,
    priority: taskPriorityValidator,
    assigneeUserIds: v.array(v.string()),
    deadline: v.optional(v.number()),
    recurrence: v.optional(recurrenceValidator),
    attachments: v.optional(
      v.array(
        v.object({
          fileName: v.string(),
          contentType: v.string(),
          fileSize: v.optional(v.number()),
          storageKey: v.string(),
          url: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);

    if (!isManagerRole(membership.role)) {
      throw new ConvexError("Only owners and managers can create tasks.");
    }

    const uniqueAssigneeIds = [...new Set(args.assigneeUserIds.map((id) => id.trim()))].filter(Boolean);
    if (!uniqueAssigneeIds.length) {
      throw new ConvexError("At least one assignee is required.");
    }

    for (const assigneeUserId of uniqueAssigneeIds) {
      const targetMembership = await ctx.db
        .query("memberships")
        .withIndex("by_org_and_user", (q) =>
          q.eq("organizationId", membership.organizationId).eq("userId", assigneeUserId),
        )
        .first();

      if (!targetMembership) {
        throw new ConvexError(`User ${assigneeUserId} is not in your organization.`);
      }

      if (targetMembership.isDisabled) {
        throw new ConvexError("Cannot assign tasks to disabled users.");
      }

      if (
        !canAssignTo({
          actorRole: membership.role,
          targetRole: targetMembership.role,
        })
      ) {
        throw new ConvexError("You do not have permission to assign one or more selected users.");
      }
    }

    if (args.type === "recurring" && !args.recurrence) {
      throw new ConvexError("Recurring tasks require recurrence settings.");
    }

    if (args.type === "one_time" && args.recurrence) {
      throw new ConvexError("One-time tasks cannot include recurrence settings.");
    }

    const createdAt = now();
    const recurringRunAt = args.type === "recurring" ? createdAt : undefined;
    const taskId = await ctx.db.insert("tasks", {
      organizationId: membership.organizationId,
      title: args.title.trim(),
      description: args.description.trim(),
      type: args.type,
      priority: args.priority,
      assignedByUserId: userId,
      recurrence: args.recurrence,
      nextRunAt:
        args.type === "recurring" && args.recurrence
          ? nextRunAtFrom(createdAt, args.recurrence)
          : undefined,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    });

    for (const assigneeUserId of uniqueAssigneeIds) {
      const taskAssignmentId = await ctx.db.insert("taskAssignments", {
        organizationId: membership.organizationId,
        taskId,
        assigneeUserId,
        approverUserId: userId,
        status: "pending",
        deadline: args.deadline,
        recurringRunAt,
        createdAt,
        updatedAt: createdAt,
      });

      if (args.type === "recurring" && recurringRunAt) {
        await ctx.db.insert("recurringTaskRuns", {
          organizationId: membership.organizationId,
          taskId,
          assigneeUserId,
          runAt: recurringRunAt,
          taskAssignmentId,
          generatedAt: createdAt,
        });
      }
    }

    for (const attachment of args.attachments ?? []) {
      await ctx.db.insert("taskAttachments", {
        organizationId: membership.organizationId,
        taskId,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        fileSize: attachment.fileSize,
        storageKey: attachment.storageKey,
        url: attachment.url,
        uploadedByUserId: userId,
        uploadedAt: createdAt,
      });
    }

    return taskId;
  },
});

export const listVisibleTaskCards = query({
  args: taskCardFilterArgs,
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const actorRole = membership.role;

    const allAssignments = await ctx.db
      .query("taskAssignments")
      .withIndex("by_organization", (q) => q.eq("organizationId", membership.organizationId))
      .collect();

    const departmentUserIds = new Set<string>();
    if (args.departmentId) {
      const departmentMembers = await ctx.db
        .query("departmentMembers")
        .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId!))
        .collect();
      for (const departmentMember of departmentMembers) {
        departmentUserIds.add(departmentMember.userId);
      }
    }

    const visibleAssignments = [] as typeof allAssignments;

    for (const assignment of allAssignments) {
      const task = await ctx.db.get(assignment.taskId);
      if (!task) {
        continue;
      }

      const canSee =
        normalizeRole(actorRole) === "owner" ||
        assignment.assigneeUserId === userId ||
        task.assignedByUserId === userId;

      if (!canSee) {
        continue;
      }

      if (args.assigneeUserId && assignment.assigneeUserId !== args.assigneeUserId) {
        continue;
      }

      if (args.assignedByUserId && task.assignedByUserId !== args.assignedByUserId) {
        continue;
      }

      if (args.priority && task.priority !== args.priority) {
        continue;
      }

      if (args.type && task.type !== args.type) {
        continue;
      }

      if (args.status && args.status.length && !args.status.includes(assignment.status)) {
        continue;
      }

      if (args.departmentId && !departmentUserIds.has(assignment.assigneeUserId)) {
        continue;
      }

      if (task.type === "recurring" && !args.includeInactiveRecurring && task.isActive === false) {
        continue;
      }

      if (args.search) {
        const haystack = `${task.title} ${task.description}`.toLowerCase();
        if (!haystack.includes(args.search.toLowerCase())) {
          continue;
        }
      }

      visibleAssignments.push(assignment);
    }

    return Promise.all(
      visibleAssignments.map(async (assignment) => {
        const task = await ctx.db.get(assignment.taskId);
        if (!task) {
          return null;
        }

        const attachments = await ctx.db
          .query("taskAttachments")
          .withIndex("by_task", (q) => q.eq("taskId", assignment.taskId))
          .collect();

        const assigneeUser = await authComponent.getAnyUserById(ctx, assignment.assigneeUserId);
        const assignedByUser = await authComponent.getAnyUserById(ctx, task.assignedByUserId);

        return {
          task,
          assignment,
          assigneeUser,
          assignedByUser,
          attachments,
        };
      }),
    ).then((cards) => cards.filter((card): card is NonNullable<typeof card> => card !== null));
  },
});

export const updateTaskAssignmentStatus = mutation({
  args: {
    taskAssignmentId: v.id("taskAssignments"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("disputed"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const assignment = await ctx.db.get(args.taskAssignmentId);

    if (!assignment || assignment.organizationId !== membership.organizationId) {
      throw new ConvexError("Task assignment not found.");
    }

    const task = await ctx.db.get(assignment.taskId);
    if (!task) {
      throw new ConvexError("Task not found.");
    }

    const assigneeMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", assignment.assigneeUserId),
      )
      .first();

    if (!assigneeMembership) {
      throw new ConvexError("Assignee membership not found.");
    }

    if (
      !canUpdateStatus({
        actorRole: membership.role,
        actorUserId: userId,
        assigneeRole: assigneeMembership.role,
        assigneeUserId: assignment.assigneeUserId,
      })
    ) {
      throw new ConvexError("You do not have permission to update this task status.");
    }

    const memberUpdatingOwnTask =
      normalizeRole(membership.role) === "member" && assignment.assigneeUserId === userId;

    if (args.status === "completed" && memberUpdatingOwnTask) {
      const pendingApproval = await ctx.db
        .query("taskApprovalRequests")
        .withIndex("by_assignment", (q) => q.eq("taskAssignmentId", assignment._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (!pendingApproval) {
        await ctx.db.insert("taskApprovalRequests", {
          organizationId: membership.organizationId,
          taskId: task._id,
          taskAssignmentId: assignment._id,
          requestedByUserId: userId,
          approverUserId: assignment.approverUserId,
          requestedStatus: "completed_finalized",
          status: "pending",
          requestedAt: now(),
          note: args.note?.trim() || undefined,
        });
      }

      await ctx.db.patch(assignment._id, {
        status: "completed_requested",
        completedRequestedAt: now(),
        updatedAt: now(),
        lastStatusUpdatedByUserId: userId,
      });

      return { requiresApproval: true };
    }

    const directStatus =
      args.status === "completed"
        ? "completed_finalized"
        : (args.status as "pending" | "in_progress" | "disputed");

    const pendingApprovals = await ctx.db
      .query("taskApprovalRequests")
      .withIndex("by_assignment", (q) => q.eq("taskAssignmentId", assignment._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    if (pendingApprovals.length) {
      for (const pendingApproval of pendingApprovals) {
        await ctx.db.patch(pendingApproval._id, {
          status: "rejected",
          decisionAt: now(),
          decisionByUserId: userId,
          note: "Status changed before approval.",
        });
      }
    }

    await ctx.db.patch(assignment._id, {
      status: directStatus,
      updatedAt: now(),
      lastStatusUpdatedByUserId: userId,
      completedFinalizedAt: directStatus === "completed_finalized" ? now() : undefined,
      disputedAt: directStatus === "disputed" ? now() : undefined,
      disputeReason: directStatus === "disputed" ? args.note?.trim() || undefined : undefined,
    });

    return { requiresApproval: false };
  },
});

export const listPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const { userId, membership } = await requireMembership(ctx);
    const actor = normalizeRole(membership.role);

    const approvals =
      actor === "owner"
        ? await ctx.db
            .query("taskApprovalRequests")
            .withIndex("by_org_and_status", (q) =>
              q.eq("organizationId", membership.organizationId).eq("status", "pending"),
            )
            .collect()
        : await ctx.db
            .query("taskApprovalRequests")
            .withIndex("by_org_approver_status", (q) =>
              q
                .eq("organizationId", membership.organizationId)
                .eq("approverUserId", userId)
                .eq("status", "pending"),
            )
            .collect();

    return Promise.all(
      approvals.map(async (approval) => {
        const assignment = await ctx.db.get(approval.taskAssignmentId);
        const task = await ctx.db.get(approval.taskId);
        const requestedByUser = await authComponent.getAnyUserById(ctx, approval.requestedByUserId);
        const assigneeUser = assignment
          ? await authComponent.getAnyUserById(ctx, assignment.assigneeUserId)
          : null;

        return {
          approval,
          assignment,
          task,
          requestedByUser,
          assigneeUser,
        };
      }),
    );
  },
});

export const resolveApprovalRequest = mutation({
  args: {
    approvalRequestId: v.id("taskApprovalRequests"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const approval = await ctx.db.get(args.approvalRequestId);

    if (!approval || approval.organizationId !== membership.organizationId) {
      throw new ConvexError("Approval request not found.");
    }

    if (approval.status !== "pending") {
      throw new ConvexError("Approval request is already resolved.");
    }

    if (approval.approverUserId !== userId) {
      throw new ConvexError("Only the assigned approver can resolve this request.");
    }

    const assignment = await ctx.db.get(approval.taskAssignmentId);
    if (!assignment) {
      throw new ConvexError("Task assignment not found.");
    }

    await ctx.db.patch(approval._id, {
      status: args.approve ? "approved" : "rejected",
      decisionAt: now(),
      decisionByUserId: userId,
      note: args.note?.trim() || undefined,
    });

    await ctx.db.patch(assignment._id, {
      status: args.approve ? "completed_finalized" : "disputed",
      completedFinalizedAt: args.approve ? now() : undefined,
      disputedAt: args.approve ? undefined : now(),
      disputeReason: args.approve ? undefined : args.note?.trim() || "Completion rejected",
      updatedAt: now(),
      lastStatusUpdatedByUserId: userId,
    });
  },
});

export const rescheduleTaskAssignmentDeadline = mutation({
  args: {
    taskAssignmentId: v.id("taskAssignments"),
    newDeadline: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);

    if (!isManagerRole(membership.role)) {
      throw new ConvexError("Only owners and managers can reschedule deadlines.");
    }

    const assignment = await ctx.db.get(args.taskAssignmentId);
    if (!assignment || assignment.organizationId !== membership.organizationId) {
      throw new ConvexError("Task assignment not found.");
    }

    const assigneeMembership = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", membership.organizationId).eq("userId", assignment.assigneeUserId),
      )
      .first();

    if (!assigneeMembership) {
      throw new ConvexError("Assignee membership not found.");
    }

    if (
      normalizeRole(membership.role) === "manager" &&
      normalizeRole(assigneeMembership.role) === "owner"
    ) {
      throw new ConvexError("Managers cannot reschedule owner tasks.");
    }

    if (assignment.deadline === undefined) {
      throw new ConvexError("Task assignment has no existing deadline to reschedule.");
    }

    if (args.newDeadline <= assignment.deadline) {
      throw new ConvexError("New deadline must be after current deadline.");
    }

    const task = await ctx.db.get(assignment.taskId);
    if (!task) {
      throw new ConvexError("Task not found.");
    }

    await ctx.db.insert("taskReschedules", {
      organizationId: membership.organizationId,
      taskId: task._id,
      taskAssignmentId: assignment._id,
      oldDeadline: assignment.deadline,
      newDeadline: args.newDeadline,
      reason: args.reason?.trim() || undefined,
      changedByUserId: userId,
      changedAt: now(),
    });

    await ctx.db.patch(assignment._id, {
      deadline: args.newDeadline,
      updatedAt: now(),
      lastStatusUpdatedByUserId: userId,
    });
  },
});

export const listTaskRescheduleHistory = query({
  args: {
    taskAssignmentId: v.id("taskAssignments"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMembership(ctx);
    const assignment = await ctx.db.get(args.taskAssignmentId);

    if (!assignment || assignment.organizationId !== membership.organizationId) {
      throw new ConvexError("Task assignment not found.");
    }

    return ctx.db
      .query("taskReschedules")
      .withIndex("by_assignment", (q) => q.eq("taskAssignmentId", args.taskAssignmentId))
      .collect();
  },
});

export const addTaskAttachment = mutation({
  args: {
    taskId: v.id("tasks"),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.optional(v.number()),
    storageKey: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.organizationId !== membership.organizationId) {
      throw new ConvexError("Task not found.");
    }

    if (task.assignedByUserId !== userId && normalizeRole(membership.role) !== "owner") {
      throw new ConvexError("Only the assigner or owner can add attachments.");
    }

    await ctx.db.insert("taskAttachments", {
      organizationId: membership.organizationId,
      taskId: task._id,
      fileName: args.fileName,
      contentType: args.contentType,
      fileSize: args.fileSize,
      storageKey: args.storageKey,
      url: args.url,
      uploadedByUserId: userId,
      uploadedAt: now(),
    });

    await ctx.db.patch(task._id, {
      updatedAt: now(),
    });
  },
});

export const updateTaskActiveState = mutation({
  args: {
    taskId: v.id("tasks"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.organizationId !== membership.organizationId) {
      throw new ConvexError("Task not found.");
    }

    if (task.assignedByUserId !== userId && !isManagerRole(membership.role)) {
      throw new ConvexError("Only owners and managers can update recurring task activity.");
    }

    await ctx.db.patch(task._id, {
      isActive: args.isActive,
      updatedAt: now(),
    });
  },
});

export const generateRecurringTaskInstances = internalMutation({
  args: {
    nowMs: v.optional(v.number()),
    maxRunsPerTask: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const nowMs = args.nowMs ?? now();
    const maxRunsPerTask = Math.max(1, Math.min(args.maxRunsPerTask ?? 6, 48));

    const recurringTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("type"), "recurring"))
      .collect();

    let createdAssignments = 0;

    for (const task of recurringTasks) {
      if (task.isActive === false || !task.recurrence || !task.nextRunAt) {
        continue;
      }

      const templateAssignments = await ctx.db
        .query("taskAssignments")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();

      const byAssignee = new Map<string, (typeof templateAssignments)[number]>();
      for (const assignment of templateAssignments) {
        const existing = byAssignee.get(assignment.assigneeUserId);
        if (!existing) {
          byAssignee.set(assignment.assigneeUserId, assignment);
          continue;
        }
        const existingRunAt = existing.recurringRunAt ?? existing.createdAt;
        const nextRunAt = assignment.recurringRunAt ?? assignment.createdAt;
        if (nextRunAt > existingRunAt) {
          byAssignee.set(assignment.assigneeUserId, assignment);
        }
      }

      let nextRunAt = task.nextRunAt;
      let runsProcessed = 0;

      while (nextRunAt <= nowMs && runsProcessed < maxRunsPerTask) {
        for (const [assigneeUserId, template] of byAssignee.entries()) {
          const membership = await ctx.db
            .query("memberships")
            .withIndex("by_org_and_user", (q) =>
              q.eq("organizationId", task.organizationId).eq("userId", assigneeUserId),
            )
            .first();

          if (!membership || membership.isDisabled) {
            continue;
          }

          const existingRun = await ctx.db
            .query("recurringTaskRuns")
            .withIndex("by_task_assignee_run", (q) =>
              q.eq("taskId", task._id).eq("assigneeUserId", assigneeUserId).eq("runAt", nextRunAt),
            )
            .first();

          if (existingRun) {
            continue;
          }

          const sourceRunAt = template.recurringRunAt ?? template.createdAt;
          const sourceDeadline = template.deadline;
          const deadlineOffset = sourceDeadline ? sourceDeadline - sourceRunAt : undefined;

          const taskAssignmentId = await ctx.db.insert("taskAssignments", {
            organizationId: task.organizationId,
            taskId: task._id,
            assigneeUserId,
            approverUserId: task.assignedByUserId,
            status: "pending",
            deadline: deadlineOffset !== undefined ? nextRunAt + deadlineOffset : undefined,
            recurringRunAt: nextRunAt,
            createdAt: nowMs,
            updatedAt: nowMs,
          });

          await ctx.db.insert("recurringTaskRuns", {
            organizationId: task.organizationId,
            taskId: task._id,
            assigneeUserId,
            runAt: nextRunAt,
            taskAssignmentId,
            generatedAt: nowMs,
          });

          createdAssignments += 1;
        }

        runsProcessed += 1;
        nextRunAt = nextRunAtFrom(nextRunAt, task.recurrence);
      }

      if (nextRunAt !== task.nextRunAt) {
        await ctx.db.patch(task._id, {
          nextRunAt,
          updatedAt: nowMs,
        });
      }
    }

    return {
      createdAssignments,
      generatedAt: nowMs,
    };
  },
});

export const listTaskAttachments = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMembership(ctx);
    const task = await ctx.db.get(args.taskId);

    if (!task || task.organizationId !== membership.organizationId) {
      throw new ConvexError("Task not found.");
    }

    return ctx.db
      .query("taskAttachments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const getTaskAssignmentTimeline = query({
  args: {
    taskAssignmentId: v.id("taskAssignments"),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const assignment = await ctx.db.get(args.taskAssignmentId);

    if (!assignment || assignment.organizationId !== membership.organizationId) {
      throw new ConvexError("Task assignment not found.");
    }

    const task = await ctx.db.get(assignment.taskId);
    if (!task) {
      throw new ConvexError("Task not found.");
    }

    const canSee =
      normalizeRole(membership.role) === "owner" ||
      assignment.assigneeUserId === userId ||
      task.assignedByUserId === userId;

    if (!canSee) {
      throw new ConvexError("You do not have access to this task assignment.");
    }

    const approvalRequests = await ctx.db
      .query("taskApprovalRequests")
      .withIndex("by_assignment", (q) => q.eq("taskAssignmentId", assignment._id))
      .collect();

    const reschedules = await ctx.db
      .query("taskReschedules")
      .withIndex("by_assignment", (q) => q.eq("taskAssignmentId", assignment._id))
      .collect();

    const timeline: Array<{
      type: string;
      at: number;
      title: string;
      detail?: string;
      byUserId?: string;
    }> = [
      {
        type: "assignment_created",
        at: assignment.createdAt,
        title: "Task assigned",
        detail: `Assigned to ${assignment.assigneeUserId}`,
        byUserId: task.assignedByUserId,
      },
      {
        type: "status_current",
        at: assignment.updatedAt,
        title: `Current status: ${assignmentDisplayStatusForTimeline(assignment.status)}`,
        byUserId: assignment.lastStatusUpdatedByUserId,
        detail: assignment.disputeReason,
      },
    ];

    if (assignment.completedRequestedAt) {
      timeline.push({
        type: "completed_requested",
        at: assignment.completedRequestedAt,
        title: "Completion requested",
        byUserId: assignment.assigneeUserId,
      });
    }

    if (assignment.completedFinalizedAt) {
      timeline.push({
        type: "completed_finalized",
        at: assignment.completedFinalizedAt,
        title: "Completion finalized",
      });
    }

    if (assignment.disputedAt) {
      timeline.push({
        type: "disputed",
        at: assignment.disputedAt,
        title: "Task disputed",
        detail: assignment.disputeReason,
      });
    }

    for (const request of approvalRequests) {
      timeline.push({
        type: "approval_request",
        at: request.requestedAt,
        title: `Approval request: ${request.status}`,
        detail: request.note,
        byUserId: request.requestedByUserId,
      });

      if (request.decisionAt) {
        timeline.push({
          type: "approval_decision",
          at: request.decisionAt,
          title: `Approval ${request.status}`,
          detail: request.note,
          byUserId: request.decisionByUserId,
        });
      }
    }

    for (const reschedule of reschedules) {
      timeline.push({
        type: "reschedule",
        at: reschedule.changedAt,
        title: "Deadline rescheduled",
        detail: `${new Date(reschedule.oldDeadline).toLocaleString()} -> ${new Date(
          reschedule.newDeadline,
        ).toLocaleString()}${reschedule.reason ? ` | ${reschedule.reason}` : ""}`,
        byUserId: reschedule.changedByUserId,
      });
    }

    timeline.sort((a, b) => b.at - a.at);

    return timeline;
  },
});

const assignmentDisplayStatusForTimeline = (status: string) => {
  if (status === "completed_requested") return "Completed (single check)";
  if (status === "completed_finalized") return "Completed (double check)";
  if (status === "in_progress") return "In Progress";
  if (status === "pending") return "Pending";
  if (status === "disputed") return "Disputed";
  return status;
};

export const getTaskAssignmentById = query({
  args: {
    taskAssignmentId: v.id("taskAssignments"),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireMembership(ctx);
    const assignment = await ctx.db.get(args.taskAssignmentId);
    if (!assignment || assignment.organizationId !== membership.organizationId) {
      return null;
    }

    const task = await ctx.db.get(assignment.taskId);
    if (!task) {
      return null;
    }

    const canSee =
      normalizeRole(membership.role) === "owner" ||
      assignment.assigneeUserId === userId ||
      task.assignedByUserId === userId;

    if (!canSee) {
      throw new ConvexError("You do not have access to this task assignment.");
    }

    const attachments = await ctx.db
      .query("taskAttachments")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    return {
      task,
      assignment,
      attachments,
    };
  },
});
