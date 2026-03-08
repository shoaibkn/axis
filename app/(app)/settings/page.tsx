"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type TabKey = "organization" | "users" | "departments";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "organization", label: "Organization" },
  { key: "users", label: "Users" },
  { key: "departments", label: "Departments" },
];

const isManagerRole = (role?: string) =>
  role === "owner" || role === "manager" || role === "admin";

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("organization");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const orgData = useQuery(api.organizations.getMyOrganization);
  const users = useQuery(api.users.listOrganizationUsers);
  const departments = useQuery(api.departments.listDepartmentsWithMeta);
  const invites = useQuery(api.invitations.listInvitations);
  const imagePresets = useQuery(api.organizations.getOrganizationImagePresets);

  const updateOrganization = useMutation(api.organizations.updateOrganizationDetails);
  const updatePlan = useMutation(api.organizations.updatePlan);
  const saveOrganizationImage = useMutation(api.organizations.saveOrganizationImage);
  const inviteUser = useMutation(api.invitations.inviteUser);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const setUserDisabled = useMutation(api.users.setUserDisabled);
  const removeUser = useMutation(api.users.removeUserFromOrganization);
  const sendPasswordReset = useMutation(api.users.sendPasswordResetForUser);
  const setUserDepartments = useMutation(api.departments.setUserDepartments);
  const createDepartment = useMutation(api.departments.createDepartment);
  const updateDepartment = useMutation(api.departments.updateDepartment);
  const deleteDepartment = useMutation(api.departments.deleteDepartment);
  const createOrgImageUploadUrl = useAction(
    api.organizationActions.createOrganizationImageUploadUrl,
  );
  const applyOrgImagePreset = useAction(api.organizationActions.applyOrganizationImagePreset);

  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "member">("member");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [targetPlan, setTargetPlan] = useState<"pro" | "enterprise">("pro");

  const role = orgData?.membership.role;
  const isOwner = role === "owner";
  const canManageUsersAndDepartments = isManagerRole(role);

  const currentPlan = orgData?.organization.plan ?? "free";
  const upgradeOptions = useMemo(
    () =>
      currentPlan === "free"
        ? (["pro", "enterprise"] as const)
        : currentPlan === "pro"
          ? (["enterprise"] as const)
          : ([] as const),
    [currentPlan],
  );

  useEffect(() => {
    if (upgradeOptions.length === 0) {
      setTargetPlan("enterprise");
      return;
    }
    if (!(upgradeOptions as readonly string[]).includes(targetPlan)) {
      setTargetPlan(upgradeOptions[0]);
    }
  }, [targetPlan, upgradeOptions]);

  if (orgData === undefined || users === undefined || departments === undefined || invites === undefined) {
    return <main className="p-6">Loading settings...</main>;
  }

  const organization = orgData?.organization;

  async function onUpdateOrganizationName(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await updateOrganization({ name: orgName || organization?.name || "" });
      setInfo("Organization updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update organization.");
    }
  }

  async function onUploadCustomOrgImage(file: File) {
    if (!file) return;
    setError(null);
    setInfo(null);
    try {
      const upload = await createOrgImageUploadUrl({
        fileName: file.name,
        contentType: file.type || "image/jpeg",
      });

      const result = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed.");
      }

      await saveOrganizationImage({
        imageKey: upload.key,
        imageUrl: upload.publicUrl,
      });
      setInfo("Organization image updated.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    }
  }

  async function onApplyPreset() {
    if (!selectedPreset) return;
    setError(null);
    setInfo(null);
    try {
      await applyOrgImagePreset({ imageUrl: selectedPreset });
      setInfo("Organization image updated from preset.");
    } catch (presetError) {
      setError(presetError instanceof Error ? presetError.message : "Unable to apply preset image.");
    }
  }

  async function onUpgradePlan(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await updatePlan({ plan: targetPlan });
      setInfo(`Organization upgraded to ${targetPlan}.`);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "Unable to upgrade plan.");
    }
  }

  async function onInviteUser(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInfo("Invitation sent.");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to invite user.");
    }
  }

  async function onCreateDepartment(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await createDepartment({ name: newDepartmentName });
      setNewDepartmentName("");
      setInfo("Department created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create department.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage organization, users, and departments.
      </p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {info ? <p className="mt-4 text-sm text-muted-foreground">{info}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={`rounded-md border px-3 py-2 text-sm ${
              tab === tabItem.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "organization" ? (
        <section className="mt-6 space-y-6 rounded-lg border border-border p-5">
          <div>
            <h2 className="text-lg font-medium">Organization</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allowed access: Owner only.
            </p>
          </div>

          <form onSubmit={onUpdateOrganizationName} className="space-y-3">
            <label className="text-sm font-medium">Organization name</label>
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={orgName || organization?.name || ""}
                onChange={(event) => setOrgName(event.target.value)}
                disabled={!isOwner}
              />
              <button
                type="submit"
                disabled={!isOwner}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>

          <form onSubmit={onUpgradePlan} className="space-y-3">
            <label className="text-sm font-medium">Application plan</label>
            <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm">
                  Current plan: <span className="font-medium capitalize">{organization?.plan ?? "free"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Only upgrades are allowed here. Contact support for downgrades.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={targetPlan}
                  onChange={(event) =>
                    setTargetPlan(event.target.value as "pro" | "enterprise")
                  }
                  disabled={!isOwner || upgradeOptions.length === 0}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {upgradeOptions.length === 0 ? (
                    <option value="enterprise">No upgrade available</option>
                  ) : (
                    upgradeOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan[0].toUpperCase() + plan.slice(1)}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="submit"
                  disabled={!isOwner || upgradeOptions.length === 0}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-sm font-medium">Organization image</label>
            {organization?.imageUrl ? (
              <img
                src={organization.imageUrl}
                alt="Organization"
                className="h-28 w-52 rounded-md border border-border object-cover"
              />
            ) : null}

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Choose from presets</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(imagePresets ?? []).map((presetUrl) => (
                  <button
                    type="button"
                    key={presetUrl}
                    onClick={() => setSelectedPreset(presetUrl)}
                    disabled={!isOwner}
                    className={`overflow-hidden rounded-md border ${
                      selectedPreset === presetUrl ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={presetUrl} alt="Preset" className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onApplyPreset}
                disabled={!isOwner || !selectedPreset}
                className="mt-3 rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
              >
                Apply selected preset
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Upload custom image</p>
              <input
                type="file"
                accept="image/*"
                disabled={!isOwner}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onUploadCustomOrgImage(file);
                  }
                }}
              />
            </div>
          </div>
        </section>
      ) : null}

      {tab === "users" ? (
        <section className="mt-6 space-y-6 rounded-lg border border-border p-5">
          <div>
            <h2 className="text-lg font-medium">Users</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allowed access: Owner, Managers.
            </p>
          </div>

          <form onSubmit={onInviteUser} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="name@company.com"
              disabled={!canManageUsersAndDepartments}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "manager" | "member")}
              disabled={!canManageUsersAndDepartments}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
            </select>
            <button
              type="submit"
              disabled={!canManageUsersAndDepartments}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Invite
            </button>
          </form>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Departments</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => {
                  const isOwnerRow = entry.membership.role === "owner";
                  const departmentIds = (entry.departmentIds ?? []).map((id) => String(id));
                  return (
                    <tr key={entry.membership._id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <p className="font-medium">{entry.user?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{entry.user?.email ?? entry.membership.userId}</p>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={entry.membership.role === "admin" ? "manager" : entry.membership.role}
                          disabled={!canManageUsersAndDepartments || isOwnerRow}
                          onChange={async (event) => {
                            try {
                              await updateUserRole({
                                targetUserId: entry.membership.userId,
                                role: event.target.value as "manager" | "member",
                              });
                              setInfo("User role updated.");
                            } catch (roleError) {
                              setError(roleError instanceof Error ? roleError.message : "Unable to update role.");
                            }
                          }}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="owner">Owner</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(departments ?? []).map((department) => {
                            const checked = departmentIds.includes(String(department._id));
                            return (
                              <label key={department._id} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!canManageUsersAndDepartments || isOwnerRow}
                                  onChange={async (event) => {
                                    const next = new Set(departmentIds);
                                    const currentId = String(department._id);
                                    if (event.target.checked) {
                                      next.add(currentId);
                                    } else {
                                      next.delete(currentId);
                                    }

                                    try {
                                      const ids = Array.from(next)
                                        .map((id) => departments.find((department) => String(department._id) === id)?._id)
                                        .filter((id): id is (typeof departments)[number]["_id"] => Boolean(id));

                                      await setUserDepartments({
                                        userId: entry.membership.userId,
                                        departmentIds: ids,
                                      });
                                      setInfo("Department assignment updated.");
                                    } catch (assignmentError) {
                                      setError(
                                        assignmentError instanceof Error
                                          ? assignmentError.message
                                          : "Unable to update departments.",
                                      );
                                    }
                                  }}
                                />
                                {department.name}
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {entry.membership.isDisabled ? "Disabled" : "Active"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!canManageUsersAndDepartments}
                            onClick={async () => {
                              try {
                                await sendPasswordReset({ targetUserId: entry.membership.userId });
                                setInfo("Password reset email sent.");
                              } catch (resetError) {
                                setError(
                                  resetError instanceof Error
                                    ? resetError.message
                                    : "Unable to send password reset email.",
                                );
                              }
                            }}
                            className="rounded border border-border px-2 py-1 text-xs"
                          >
                            Reset password
                          </button>
                          <button
                            type="button"
                            disabled={!canManageUsersAndDepartments || isOwnerRow}
                            onClick={async () => {
                              try {
                                await setUserDisabled({
                                  targetUserId: entry.membership.userId,
                                  disabled: !entry.membership.isDisabled,
                                });
                                setInfo("User status updated.");
                              } catch (disableError) {
                                setError(
                                  disableError instanceof Error
                                    ? disableError.message
                                    : "Unable to update user status.",
                                );
                              }
                            }}
                            className="rounded border border-border px-2 py-1 text-xs"
                          >
                            {entry.membership.isDisabled ? "Enable" : "Disable"}
                          </button>
                          <button
                            type="button"
                            disabled={!canManageUsersAndDepartments || isOwnerRow}
                            onClick={async () => {
                              try {
                                await removeUser({ targetUserId: entry.membership.userId });
                                setInfo("User removed from organization.");
                              } catch (removeError) {
                                setError(
                                  removeError instanceof Error
                                    ? removeError.message
                                    : "Unable to remove user.",
                                );
                              }
                            }}
                            className="rounded border border-destructive px-2 py-1 text-xs text-destructive"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invites.length ? (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">Pending invitations</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {invites
                  .filter((invite) => invite.status === "pending")
                  .map((invite) => (
                    <li key={invite._id}>
                      {invite.email} - {invite.role}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "departments" ? (
        <section className="mt-6 space-y-6 rounded-lg border border-border p-5">
          <div>
            <h2 className="text-lg font-medium">Departments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allowed access: Owner, Managers.
            </p>
          </div>

          <form onSubmit={onCreateDepartment} className="flex gap-2">
            <input
              value={newDepartmentName}
              onChange={(event) => setNewDepartmentName(event.target.value)}
              placeholder="New department name"
              disabled={!canManageUsersAndDepartments}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!canManageUsersAndDepartments}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Create
            </button>
          </form>

          <div className="space-y-3">
            {(departments ?? []).map((department) => {
              const isEditing = editingDepartmentId === String(department._id);
              return (
                <div key={department._id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{department.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Users: {department.memberCount}
                        {department.hasUsers ? " (changes require warning confirmation)" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!canManageUsersAndDepartments}
                        onClick={() => {
                          setEditingDepartmentId(String(department._id));
                          setEditingDepartmentName(department.name);
                        }}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canManageUsersAndDepartments}
                        onClick={async () => {
                          try {
                            await deleteDepartment({ departmentId: department._id });
                            setInfo("Department deleted.");
                          } catch (deleteError) {
                            setError(
                              deleteError instanceof Error
                                ? deleteError.message
                                : "Unable to delete department.",
                            );
                          }
                        }}
                        className="rounded border border-destructive px-2 py-1 text-xs text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        try {
                          await updateDepartment({
                            departmentId: department._id,
                            name: editingDepartmentName,
                            confirmHasUsers: !department.hasUsers
                              ? undefined
                              : window.confirm(
                                  "This department has users. Are you sure you want to update it?",
                                ),
                          });
                          setEditingDepartmentId(null);
                          setEditingDepartmentName("");
                          setInfo("Department updated.");
                        } catch (updateError) {
                          setError(
                            updateError instanceof Error
                              ? updateError.message
                              : "Unable to update department.",
                          );
                        }
                      }}
                    >
                      <input
                        value={editingDepartmentName}
                        onChange={(event) => setEditingDepartmentName(event.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      >
                        Save
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {!isOwner && tab === "organization" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You can view organization settings, but only the owner can update them.
        </p>
      ) : null}
    </main>
  );
}
