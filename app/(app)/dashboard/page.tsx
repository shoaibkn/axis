"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const orgData = useQuery(api.organizations.getMyOrganization);
  const users = useQuery(api.users.listOrganizationUsers);
  const departments = useQuery(api.departments.listDepartments);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/sign-in");
    }
  }, [isPending, router, session?.user]);

  if (isPending || orgData === undefined || users === undefined || departments === undefined) {
    return <main className="p-6">Loading...</main>;
  }

  if (!orgData) {
    router.replace("/onboarding");
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{orgData.organization.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Role: {orgData.membership.role} | Plan: {orgData.organization.plan}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Users</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((entry) => (
            <li key={entry.membership._id} className="rounded-md border border-border px-3 py-2">
              {entry.user?.name ?? entry.user?.email ?? entry.membership.userId} - {entry.membership.role}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Departments</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {departments.map((department) => (
            <li key={department._id} className="rounded-md border border-border px-3 py-2">
              {department.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
