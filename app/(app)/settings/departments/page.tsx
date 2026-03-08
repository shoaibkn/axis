import Link from "next/link";

export default function DepartmentsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Departments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Department structure and ownership live here.
      </p>
      <div className="mt-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Department setup is currently available via onboarding.
        <Link href="/onboarding" className="ml-1 underline">
          Go to onboarding
        </Link>
      </div>
    </main>
  );
}
