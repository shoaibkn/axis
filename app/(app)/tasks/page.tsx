"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncingPill } from "@/components/ui/syncing-pill";
import { useLoadingToast } from "@/lib/use-loading-toast";

type TaskView = "table" | "kanban";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskType = "one_time" | "recurring";
type TaskUpdateStatus = "pending" | "in_progress" | "completed" | "disputed";
type TaskFilterStatus =
  | "pending"
  | "in_progress"
  | "completed_requested"
  | "completed_finalized"
  | "disputed";

const viewStorageKey = "axis.tasks.view";

const statusOptions: Array<{ label: string; value: string }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Completed (Requested)", value: "completed_requested" },
  { label: "Completed (Finalized)", value: "completed_finalized" },
  { label: "Disputed", value: "disputed" },
];

const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];

const typeOptions: Array<{ label: string; value: "all" | TaskType }> = [
  { label: "All types", value: "all" },
  { label: "One-time", value: "one_time" },
  { label: "Recurring", value: "recurring" },
];

const normalizeRole = (role: string) => (role === "admin" ? "manager" : role);

const canAssignTo = (actorRole?: string, targetRole?: string) => {
  const actor = normalizeRole(actorRole ?? "");
  const target = normalizeRole(targetRole ?? "");

  if (actor === "owner") {
    return target === "manager" || target === "member";
  }

  if (actor === "manager") {
    return target === "member";
  }

  return false;
};

const formatDateTime = (value?: number) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const assignmentDisplayStatus = (status: string) => {
  switch (status) {
    case "completed_requested":
      return "Completed (single check)";
    case "completed_finalized":
      return "Completed (double check)";
    case "in_progress":
      return "In Progress";
    case "pending":
      return "Pending";
    case "disputed":
      return "Disputed";
    default:
      return status;
  }
};

const asTaskAssignmentId = (id: string) => id as Id<"taskAssignments">;
const asDepartmentId = (id: string) => id as Id<"departments">;

const toOptimisticAssignmentStatus = (
  nextStatus: TaskUpdateStatus,
  role: string | undefined,
  actorUserId: string | undefined,
  assigneeUserId: string,
): TaskFilterStatus => {
  if (nextStatus !== "completed") {
    return nextStatus;
  }

  const normalizedRole = normalizeRole(role ?? "");
  const isMemberUpdatingOwnTask = normalizedRole === "member" && actorUserId === assigneeUserId;
  return isMemberUpdatingOwnTask ? "completed_requested" : "completed_finalized";
};

export default function TasksPage() {
  const orgState = useQuery(api.organizations.getMyOrganization);
  const users = useQuery(api.users.listOrganizationUsers);
  const departments = useQuery(api.departments.listDepartments);

  const [view, setView] = useState<TaskView>("table");
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState("");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assignedByFilter, setAssignedByFilter] = useState<"all" | "me">("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("one_time");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceTimezone, setRecurrenceTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [files, setFiles] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, TaskFilterStatus>
  >({});

  const createTask = useMutation(api.tasks.createTask);
  const updateTaskAssignmentStatus = useMutation(api.tasks.updateTaskAssignmentStatus);
  const rescheduleTaskAssignmentDeadline = useMutation(api.tasks.rescheduleTaskAssignmentDeadline);
  const createTaskAttachmentUploadUrl = useAction(api.taskActions.createTaskAttachmentUploadUrl);

  const meUserId = orgState?.membership.userId;
  const myRole = orgState?.membership.role;

  const taskArgs = {
    search: search.trim() || undefined,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    status:
      statusFilter === "all"
        ? undefined
        : statusFilter === "completed"
          ? (["completed_requested", "completed_finalized"] as TaskFilterStatus[])
          : ([statusFilter as TaskFilterStatus] as TaskFilterStatus[]),
    assigneeUserId: assigneeFilter === "all" ? undefined : assigneeFilter,
    assignedByUserId: assignedByFilter === "me" ? meUserId : undefined,
    departmentId: departmentFilter === "all" ? undefined : asDepartmentId(departmentFilter),
    type: typeFilter === "all" ? undefined : typeFilter,
    includeInactiveRecurring: false,
  };

  const cards = useQuery(api.tasks.listVisibleTaskCards, taskArgs);
  const [cardsCache, setCardsCache] = useState<typeof cards>(undefined);

  useEffect(() => {
    const savedView = window.localStorage.getItem(viewStorageKey);
    if (savedView === "table" || savedView === "kanban") {
      setView(savedView);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(viewStorageKey, view);
  }, [view]);

  useEffect(() => {
    if (cards !== undefined) {
      setCardsCache(cards);
    }
  }, [cards]);

  const activeCards = useMemo(() => cards ?? cardsCache ?? [], [cards, cardsCache]);
  const isInitialLoading =
    orgState === undefined ||
    users === undefined ||
    departments === undefined ||
    (cards === undefined && !cardsCache);
  const isRefreshingCards = cards === undefined && !!cardsCache;
  useLoadingToast({ isLoading: isRefreshingCards, toastId: "tasks-loading" });

  const assigneeOptions = useMemo(() => {
    return (users ?? []).filter((entry) => canAssignTo(myRole, entry.membership.role));
  }, [users, myRole]);

  const filteredCards = useMemo(() => {
    const source = activeCards;
    if (!employeeNameFilter.trim()) return source;
    const needle = employeeNameFilter.toLowerCase();
    return source.filter((card) => {
      const name = card.assigneeUser?.name ?? "";
      const email = card.assigneeUser?.email ?? "";
      return `${name} ${email}`.toLowerCase().includes(needle);
    });
  }, [activeCards, employeeNameFilter]);

  const cardsWithOptimisticStatus = useMemo(() => {
    return filteredCards.map((card) => {
      const assignmentId = String(card.assignment._id);
      const optimisticStatus = optimisticStatuses[assignmentId];
      if (!optimisticStatus) {
        return card;
      }

      return {
        ...card,
        assignment: {
          ...card.assignment,
          status: optimisticStatus,
        },
      };
    });
  }, [filteredCards, optimisticStatuses]);

  const kanbanColumns = useMemo(
    () => ({
      pending: cardsWithOptimisticStatus.filter((card) => card.assignment.status === "pending"),
      in_progress: cardsWithOptimisticStatus.filter((card) => card.assignment.status === "in_progress"),
      completed: cardsWithOptimisticStatus.filter(
        (card) =>
          card.assignment.status === "completed_requested" ||
          card.assignment.status === "completed_finalized",
      ),
      disputed: cardsWithOptimisticStatus.filter((card) => card.assignment.status === "disputed"),
    }),
    [cardsWithOptimisticStatus],
  );

  useEffect(() => {
    if (!cards) return;
    setOptimisticStatuses((prev) => {
      const next: Record<string, TaskFilterStatus> = {};
      for (const [assignmentId, optimisticStatus] of Object.entries(prev)) {
        const serverCard = cards.find((card) => String(card.assignment._id) === assignmentId);
        if (!serverCard) continue;
        if (serverCard.assignment.status !== optimisticStatus) {
          next[assignmentId] = optimisticStatus;
        }
      }
      return next;
    });
  }, [cards]);

  const usersData = users ?? [];
  const departmentsData = departments ?? [];

  if (isInitialLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </main>
    );
  }

  async function uploadSelectedFiles() {
    const uploaded: Array<{
      fileName: string;
      contentType: string;
      fileSize?: number;
      storageKey: string;
      url: string;
    }> = [];

    for (const file of files) {
      const upload = await createTaskAttachmentUploadUrl({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      });

      const result = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed for ${file.name}`);
      }

      uploaded.push({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        storageKey: upload.key,
        url: upload.publicUrl,
      });
    }

    return uploaded;
  }

  async function onCreateTask(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!assignees.length) {
      setError("Select at least one assignee.");
      return;
    }

    setIsCreating(true);
    try {
      const attachments = files.length ? await uploadSelectedFiles() : [];

      await createTask({
        title,
        description,
        type: taskType,
        priority,
        assigneeUserIds: assignees,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        recurrence:
          taskType === "recurring"
            ? {
                frequency: recurrenceFrequency,
                interval: Math.max(1, recurrenceInterval),
                timezone: recurrenceTimezone,
              }
            : undefined,
        attachments,
      });

      setTitle("");
      setDescription("");
      setTaskType("one_time");
      setPriority("medium");
      setAssignees([]);
      setDeadline("");
      setFiles([]);
      setShowCreate(false);
      setInfo("Task created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setIsCreating(false);
    }
  }

  async function onUpdateStatus(taskAssignmentId: Id<"taskAssignments">, status: TaskUpdateStatus) {
    setError(null);
    setInfo(null);
    try {
      const result = await updateTaskAssignmentStatus({
        taskAssignmentId,
        status,
      });
      if (result.requiresApproval) {
        setInfo("Status marked complete and sent for approval.");
      } else {
        setInfo("Task status updated.");
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update status.");
    }
  }

  async function onReschedule(taskAssignmentId: Id<"taskAssignments">, currentDeadline?: number) {
    if (!currentDeadline) {
      setError("Task has no deadline to reschedule.");
      return;
    }

    const nextDeadlineValue = window.prompt(
      "Enter new deadline (YYYY-MM-DDTHH:mm)",
      new Date(currentDeadline).toISOString().slice(0, 16),
    );

    if (!nextDeadlineValue) return;

    const reason = window.prompt("Reason for reschedule (optional)", "") || undefined;

    setError(null);
    setInfo(null);
    try {
      await rescheduleTaskAssignmentDeadline({
        taskAssignmentId,
        newDeadline: new Date(nextDeadlineValue).getTime(),
        reason,
      });
      setInfo("Deadline rescheduled and logged.");
    } catch (rescheduleError) {
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : "Unable to reschedule deadline.",
      );
    }
  }

  async function handleDrop(column: "pending" | "in_progress" | "completed" | "disputed") {
    if (!draggingAssignmentId) return;
    const nextStatus: TaskUpdateStatus =
      column === "completed"
        ? "completed"
        : column === "in_progress"
          ? "in_progress"
          : column === "disputed"
            ? "disputed"
            : "pending";

    const draggedCard = cardsWithOptimisticStatus.find(
      (card) => String(card.assignment._id) === draggingAssignmentId,
    );

    if (!draggedCard) {
      setDraggingAssignmentId(null);
      return;
    }

    const previousStatus = draggedCard.assignment.status as TaskFilterStatus;
    const optimisticStatus = toOptimisticAssignmentStatus(
      nextStatus,
      myRole,
      meUserId,
      draggedCard.assignment.assigneeUserId,
    );

    setOptimisticStatuses((prev) => ({
      ...prev,
      [draggingAssignmentId]: optimisticStatus,
    }));

    void updateTaskAssignmentStatus({
      taskAssignmentId: asTaskAssignmentId(draggingAssignmentId),
      status: nextStatus,
    })
      .then((result) => {
        if (nextStatus === "completed") {
          setOptimisticStatuses((prev) => ({
            ...prev,
            [draggingAssignmentId]: result.requiresApproval
              ? "completed_requested"
              : "completed_finalized",
          }));
        }
      })
      .catch((mutationError) => {
        setOptimisticStatuses((prev) => ({
          ...prev,
          [draggingAssignmentId]: previousStatus,
        }));
        toast.error(
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to update task status.",
        );
      });

    setDraggingAssignmentId(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage one-time and recurring task cards per assignee.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-md border px-3 py-2 text-sm ${
              view === "table" ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-md border px-3 py-2 text-sm ${
              view === "kanban"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((open) => !open)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            {showCreate ? "Close" : "Create task"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {info ? <p className="mt-4 text-sm text-muted-foreground">{info}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAssignedByFilter("all");
            setAssigneeFilter("all");
          }}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          All visible tasks
        </button>
        <button
          type="button"
          onClick={() => {
            if (meUserId) setAssigneeFilter(meUserId);
          }}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          My assignments
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed_requested")}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          Needs approval
        </button>
        <button
          type="button"
          onClick={() => setPriorityFilter("urgent")}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          Urgent only
        </button>
        {isRefreshingCards ? <SyncingPill label="Syncing" /> : null}
      </div>

      {showCreate ? (
        <form onSubmit={onCreateTask} className="mt-6 space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-lg font-medium">Create Task</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={taskType}
              onChange={(event) => setTaskType(event.target.value as TaskType)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description (links allowed)"
              className="min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2"
            />
          </div>

          {taskType === "recurring" ? (
            <div className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-3">
              <select
                value={recurrenceFrequency}
                onChange={(event) =>
                  setRecurrenceFrequency(
                    event.target.value as "daily" | "weekly" | "monthly" | "yearly",
                  )
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="number"
                min={1}
                value={recurrenceInterval}
                onChange={(event) => setRecurrenceInterval(Number(event.target.value) || 1)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={recurrenceTimezone}
                onChange={(event) => setRecurrenceTimezone(event.target.value)}
                placeholder="Timezone"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">Assign to</p>
            <div className="flex flex-wrap gap-2">
              {assigneeOptions.map((entry) => {
                const checked = assignees.includes(entry.membership.userId);
                return (
                  <label
                    key={entry.membership._id}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const userId = entry.membership.userId;
                        setAssignees((prev) => {
                          if (event.target.checked) {
                            return [...new Set([...prev, userId])];
                          }
                          return prev.filter((id) => id !== userId);
                        });
                      }}
                    />
                    {entry.user?.name ?? entry.user?.email ?? entry.membership.userId}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Documents / Images</p>
            <input
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            {files.length ? (
              <p className="mt-1 text-xs text-muted-foreground">{files.length} file(s) selected</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create task"}
          </button>
        </form>
      ) : null}

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Filters</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title/description"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={employeeNameFilter}
            onChange={(event) => setEmployeeNameFilter(event.target.value)}
            placeholder="Filter by employee name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as "all" | TaskPriority)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All priorities</option>
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | TaskType)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All assignees</option>
            {usersData.map((entry) => (
              <option key={entry.membership._id} value={entry.membership.userId}>
                {entry.user?.name ?? entry.user?.email ?? entry.membership.userId}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All departments</option>
            {departmentsData.map((department) => (
              <option key={department._id} value={String(department._id)}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            value={assignedByFilter}
            onChange={(event) => setAssignedByFilter(event.target.value as "all" | "me")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Assigned by anyone</option>
            <option value="me">Assigned by me</option>
          </select>
        </div>
      </section>

      {view === "table" ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Assignee</th>
                <th className="px-3 py-2">Assigned by</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cardsWithOptimisticStatus.map((card) => (
                <tr key={card.assignment._id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-medium">{card.task.title}</p>
                    <p className="text-xs text-muted-foreground">{card.task.description}</p>
                  </td>
                  <td className="px-3 py-2">
                    {card.assigneeUser?.name ?? card.assigneeUser?.email ?? card.assignment.assigneeUserId}
                  </td>
                  <td className="px-3 py-2">
                    {card.assignedByUser?.name ?? card.assignedByUser?.email ?? card.task.assignedByUserId}
                  </td>
                  <td className="px-3 py-2">{card.task.type === "one_time" ? "One-time" : "Recurring"}</td>
                  <td className="px-3 py-2 capitalize">{card.task.priority}</td>
                  <td className="px-3 py-2">{formatDateTime(card.assignment.deadline)}</td>
                  <td className="px-3 py-2">{assignmentDisplayStatus(card.assignment.status)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={
                          card.assignment.status === "completed_requested" ||
                          card.assignment.status === "completed_finalized"
                            ? "completed"
                            : card.assignment.status
                        }
                        onChange={(event) =>
                          void onUpdateStatus(
                            asTaskAssignmentId(String(card.assignment._id)),
                            event.target.value as TaskUpdateStatus,
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="disputed">Disputed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          void onReschedule(
                            asTaskAssignmentId(String(card.assignment._id)),
                            card.assignment.deadline,
                          )
                        }
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        Reschedule
                      </button>
                      <Link
                        href={`/tasks/${String(card.assignment._id)}`}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {[
            { key: "pending", label: "Pending", cards: kanbanColumns.pending },
            { key: "in_progress", label: "In Progress", cards: kanbanColumns.in_progress },
            { key: "completed", label: "Completed", cards: kanbanColumns.completed },
            { key: "disputed", label: "Disputed", cards: kanbanColumns.disputed },
          ].map((column) => (
            <section
              key={column.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() =>
                void handleDrop(
                  column.key as "pending" | "in_progress" | "completed" | "disputed",
                )
              }
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <h3 className="text-sm font-semibold">
                {column.label} <span className="text-muted-foreground">({column.cards.length})</span>
              </h3>

              <div className="mt-3 space-y-2">
                {column.cards.map((card) => (
                  <article
                    key={card.assignment._id}
                    draggable
                    onDragStart={() => setDraggingAssignmentId(String(card.assignment._id))}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <p className="text-sm font-medium">{card.task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{card.task.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                      <span className="rounded border border-border px-1.5 py-0.5 capitalize">
                        {card.task.priority}
                      </span>
                      <span className="rounded border border-border px-1.5 py-0.5">
                        {card.task.type === "one_time" ? "One-time" : "Recurring"}
                      </span>
                      <span className="rounded border border-border px-1.5 py-0.5">
                        {assignmentDisplayStatus(card.assignment.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Assignee: {card.assigneeUser?.name ?? card.assigneeUser?.email ?? card.assignment.assigneeUserId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deadline: {formatDateTime(card.assignment.deadline)}
                    </p>
                    <Link
                      href={`/tasks/${String(card.assignment._id)}`}
                      className="mt-2 inline-block rounded border border-border px-2 py-1 text-xs"
                    >
                      View details
                    </Link>
                  </article>
                ))}
                {isRefreshingCards && column.cards.length === 0 ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
