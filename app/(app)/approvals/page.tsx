"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useLoadingToast } from "@/lib/use-loading-toast";

export default function ApprovalsPage() {
  const approvalsData = useQuery(api.tasks.listPendingApprovals);
  const resolveApprovalRequest = useMutation(api.tasks.resolveApprovalRequest);
  const isLoadingData = approvalsData === undefined;

  useLoadingToast({ isLoading: isLoadingData, toastId: "approvals-loading" });

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (isLoadingData) {
    return <PageSkeleton lines={4} includeGrid={false} />;
  }

  async function onResolve(
    approvalRequestId: Id<"taskApprovalRequests">,
    approve: boolean,
    note?: string,
  ) {
    setError(null);
    setInfo(null);
    try {
      await resolveApprovalRequest({ approvalRequestId, approve, note });
      setInfo(approve ? "Approval finalized." : "Approval rejected and task disputed.");
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Unable to resolve approval.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review member completion requests and finalize task status.
      </p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {info ? <p className="mt-4 text-sm text-muted-foreground">{info}</p> : null}

      <div className="mt-6 space-y-3">
        {approvalsData.length === 0 ? (
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            No pending approvals.
          </div>
        ) : null}

        {approvalsData.map((item) => {
          const key = String(item.approval._id);
          const noteValue = notes[key] ?? "";
          return (
            <article key={item.approval._id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.task?.title ?? "Untitled task"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Assignee: {item.assigneeUser?.name ?? item.assigneeUser?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested by: {item.requestedByUser?.name ?? item.requestedByUser?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested at: {new Date(item.approval.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <form
                className="mt-3 space-y-2"
                onSubmit={(event: FormEvent) => {
                  event.preventDefault();
                }}
              >
                <textarea
                  value={noteValue}
                  onChange={(event) =>
                    setNotes((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder="Optional note"
                  className="min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void onResolve(
                        item.approval._id as Id<"taskApprovalRequests">,
                        true,
                        noteValue.trim() || undefined,
                      )
                    }
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void onResolve(
                        item.approval._id as Id<"taskApprovalRequests">,
                        false,
                        noteValue.trim() || "Completion rejected",
                      )
                    }
                    className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive"
                  >
                    Reject
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </div>
    </main>
  );
}
