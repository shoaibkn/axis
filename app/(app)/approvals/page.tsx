export default function ApprovalsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Demo page: this is where approval requests and approval chains will be managed.
      </p>
      <div className="mt-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Coming next: multi-step approvals, thresholds, and audit history.
      </div>
    </main>
  );
}
