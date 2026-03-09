"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useLoadingToast } from "@/lib/use-loading-toast";

const asTaskAssignmentId = (id: string) => id as Id<"taskAssignments">;

export default function TaskAssignmentDetailsPage() {
  const params = useParams<{ taskAssignmentId: string }>();
  const taskAssignmentId = params.taskAssignmentId;

  const details = useQuery(
    api.tasks.getTaskAssignmentById,
    taskAssignmentId ? { taskAssignmentId: asTaskAssignmentId(taskAssignmentId) } : "skip",
  );
  const timeline = useQuery(
    api.tasks.getTaskAssignmentTimeline,
    taskAssignmentId ? { taskAssignmentId: asTaskAssignmentId(taskAssignmentId) } : "skip",
  );
  const reschedules = useQuery(
    api.tasks.listTaskRescheduleHistory,
    taskAssignmentId ? { taskAssignmentId: asTaskAssignmentId(taskAssignmentId) } : "skip",
  );

  const isLoadingData =
    details === undefined || timeline === undefined || reschedules === undefined;

  useLoadingToast({ isLoading: isLoadingData, toastId: "task-details-loading" });

  if (isLoadingData) {
    return <PageSkeleton lines={5} includeGrid={false} />;
  }

  if (!details) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Task not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This task assignment does not exist or is not accessible.
        </p>
        <Link href="/tasks" className="mt-4 inline-block rounded border border-border px-3 py-2 text-sm">
          Back to tasks
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{details.task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{details.task.description}</p>
        </div>
        <Link href="/tasks" className="rounded border border-border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Assignment</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Status: {details.assignment.status}</li>
            <li>Priority: {details.task.priority}</li>
            <li>Type: {details.task.type === "one_time" ? "One-time" : "Recurring"}</li>
            <li>
              Deadline: {details.assignment.deadline ? new Date(details.assignment.deadline).toLocaleString() : "-"}
            </li>
            <li>Assigned by: {details.task.assignedByUserId}</li>
            <li>Assigned to: {details.assignment.assigneeUserId}</li>
          </ul>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Attachments</h2>
          {details.attachments.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {details.attachments.map((attachment) => (
                <li key={attachment._id}>
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="underline">
                    {attachment.fileName}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No attachments</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Reschedule history</h2>
        {reschedules.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {reschedules.map((item) => (
              <li key={item._id} className="rounded border border-border p-2">
                <p>
                  {new Date(item.oldDeadline).toLocaleString()} {"->"} {new Date(item.newDeadline).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  By {item.changedByUserId} at {new Date(item.changedAt).toLocaleString()}
                  {item.reason ? ` | ${item.reason}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No reschedules yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Timeline</h2>
        {timeline.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {timeline.map((event, index) => (
              <li key={`${event.type}-${event.at}-${index}`} className="rounded border border-border p-2">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString()}</p>
                {event.byUserId ? (
                  <p className="text-xs text-muted-foreground">By: {event.byUserId}</p>
                ) : null}
                {event.detail ? <p className="mt-1 text-xs">{event.detail}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No timeline events.</p>
        )}
      </section>
    </main>
  );
}
