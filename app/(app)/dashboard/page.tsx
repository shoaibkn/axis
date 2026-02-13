"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { updatePaths } from "@/features/breadcrumb/breadcrumbSlice";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const organisations = useQuery(api.organisations.getMyOrganisations);
  const currentOrg = orgId
    ? organisations?.find((o: any) => o._id === orgId)
    : organisations?.[0];

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updatePaths([{ title: "Dashboard", path: "/dashboard" }]));
  }, [dispatch]);

  useEffect(() => {
    console.log(organisations, orgId, currentOrg);
    if (organisations && organisations.length > 0) {
      const orgToCheck = currentOrg || organisations[0];
      console.log(orgToCheck);
      if (!orgToCheck.onboardingCompleted) {
        // router.push("/onboarding");
      }
    }
  }, [organisations, currentOrg, router]);

  if (organisations === undefined) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (organisations.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Axis</h1>
          <p className="text-muted-foreground mb-8">
            You haven&apos;t joined any organisations yet. Create one to get
            started with task management and time tracking.
          </p>
          <Button asChild size="lg">
            <Link href="/onboarding">
              <Plus className="mr-2 h-4 w-4" />
              Create Organisation
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentOrg?.onboardingCompleted) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container p-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisation</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentOrg.name}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {currentOrg.subscriptionTier} Plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {currentOrg.myRole}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentOrg.myRole === "owner"
                ? "Full access to organisation settings"
                : "Member access"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📋</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">
              Task management features are in development
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your organisation and team</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {(currentOrg.myRole === "owner" ||
              currentOrg.myRole === "admin") && (
              <Button variant="outline" asChild>
                <Link href="/settings/organization">Organisation Settings</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/settings/departments">Manage Departments</Link>
            </Button>
            {(currentOrg.myRole === "owner" ||
              currentOrg.myRole === "admin") && (
              <Button variant="outline" asChild>
                <Link href="/settings/team">Invite Team Members</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
