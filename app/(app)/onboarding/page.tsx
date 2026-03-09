"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useLoadingToast } from "@/lib/use-loading-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const orgData = useQuery(api.organizations.getMyOrganization);
  const departments = useQuery(api.departments.listDepartments);
  const invitations = useQuery(api.invitations.listInvitations);

  const isLoadingData =
    isSessionPending ||
    orgData === undefined ||
    departments === undefined ||
    invitations === undefined;

  useLoadingToast({ isLoading: isLoadingData, toastId: "onboarding-loading" });

  const createOrganization = useMutation(api.organizations.createOrganization);
  const createDepartment = useMutation(api.departments.createDepartment);
  const inviteUser = useMutation(api.invitations.inviteUser);
  const completeOnboarding = useMutation(api.organizations.markOnboardingComplete);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [departmentName, setDepartmentName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "member">("member");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/sign-in");
    }
  }, [isSessionPending, router, session?.user]);

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await createOrganization({
        name: organizationName,
        slug: organizationSlug,
        plan,
      });
      setInfo("Organization created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create organization.");
    }
  }

  async function handleCreateDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await createDepartment({ name: departmentName });
      setDepartmentName("");
      setInfo("Department created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create department.");
    }
  }

  async function handleInviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await inviteUser({
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setInfo("Invitation sent. Link expires in 7 days.");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to send invitation.");
    }
  }

  async function handleFinish() {
    setError(null);
    setInfo(null);
    try {
      await completeOnboarding({});
      router.push("/dashboard");
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Unable to finish onboarding.");
    }
  }

  if (isLoadingData) {
    return <PageSkeleton lines={5} />;
  }

  if (!orgData) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Create your organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start with one organization and choose your plan metadata.
        </p>
        <form onSubmit={handleCreateOrganization} className="mt-8 space-y-4">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Organization name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Organization slug"
            value={organizationSlug}
            onChange={(e) => setOrganizationSlug(e.target.value)}
            required
          />
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={plan}
            onChange={(e) => setPlan(e.target.value as "free" | "pro" | "enterprise")}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
            Create organization
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Onboarding: {orgData.organization.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Plan: {orgData.organization.plan}</p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {info ? <p className="mt-4 text-sm text-muted-foreground">{info}</p> : null}

      <section className="mt-8 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Departments</h2>
        <form onSubmit={handleCreateDepartment} className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Add department"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">
            Add
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {(departments ?? []).map((department) => (
            <li key={department._id} className="rounded-md border border-border px-3 py-2">
              {department.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Invite teammates</h2>
        <form onSubmit={handleInviteUser} className="mt-4 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "manager" | "member")}
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
          </select>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">
            Invite
          </button>
        </form>

        <ul className="mt-4 space-y-2 text-sm">
          {(invitations ?? []).map((invite) => (
            <li key={invite._id} className="rounded-md border border-border px-3 py-2">
              {invite.email} - {invite.role} - {invite.status}
            </li>
          ))}
        </ul>
      </section>

      <button className="mt-8 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={handleFinish}>
        Finish onboarding
      </button>
    </main>
  );
}
