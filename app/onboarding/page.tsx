"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { OrganisationStep } from "@/components/onboarding/OrganisationStep";
import { SubscriptionStep } from "@/components/onboarding/SubscriptionStep";
import { DepartmentStep } from "@/components/onboarding/DepartmentStep";
import { InviteStep } from "@/components/onboarding/InviteStep";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [organisationId, setOrganisationId] = React.useState<string | null>(null);

  const myOrganisations = useQuery(api.organisations.getMyOrganisations);
  const createOrganisation = useMutation(api.organisations.create);
  const createDepartment = useMutation(api.departments.create);
  const sendInvitation = useMutation(api.invitations.sendInvitation);
  const completeOnboarding = useMutation(api.organisations.completeOnboarding);

  const [orgData, setOrgData] = React.useState({
    name: "",
    description: "",
  });

  const [subscriptionTier, setSubscriptionTier] = React.useState<"free" | "pro" | "enterprise">("free");

  const [departments, setDepartments] = React.useState<{ name: string; description: string }[]>([]);

  const [invites, setInvites] = React.useState<
    { email: string; role: string; departmentId?: string }[]
  >([]);

  React.useEffect(() => {
    if (myOrganisations && myOrganisations.length > 0) {
      const hasIncompleteOrg = myOrganisations.find((org) => !org.onboardingCompleted);
      if (!hasIncompleteOrg) {
        router.push("/dashboard");
      }
    }
  }, [myOrganisations, router]);

  const handleComplete = async () => {
    if (!organisationId) return;
    
    setIsLoading(true);
    try {
      for (const dept of departments) {
        await createDepartment({
          organisationId: organisationId as any,
          name: dept.name,
          description: dept.description,
        });
      }

      for (const invite of invites) {
        await sendInvitation({
          organisationId: organisationId as any,
          departmentId: invite.departmentId as any,
          email: invite.email,
          role: invite.role,
        });
      }

      await completeOnboarding({ id: organisationId as any });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsLoading(false);
    }
  };

  const handleStepChange = async (newStep: number) => {
    if (newStep > currentStep) {
      if (currentStep === 0 && !organisationId) {
        setIsLoading(true);
        try {
          const orgId = await createOrganisation({
            name: orgData.name,
            description: orgData.description || undefined,
            subscriptionTier,
          });
          setOrganisationId(orgId);
          setCurrentStep(newStep);
        } catch (error) {
          console.error("Error creating organisation:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentStep(newStep);
      }
    } else {
      setCurrentStep(newStep);
    }
  };

  const currentOrgCount = myOrganisations?.filter(
    (org) => org.subscriptionTier === "pro" || org.subscriptionTier === "enterprise"
  ).length || 0;

  const steps = [
    {
      title: "Create Your Organisation",
      description: "Start by giving your organisation a name",
      component: (
        <OrganisationStep
          data={orgData}
          onChange={setOrgData}
        />
      ),
    },
    {
      title: "Choose Your Plan",
      description: "Select the plan that fits your needs",
      component: (
        <SubscriptionStep
          value={subscriptionTier}
          onChange={setSubscriptionTier}
          currentOrgCount={currentOrgCount}
        />
      ),
    },
    {
      title: "Add Departments",
      description: "Organise your teams into departments",
      component: (
        <DepartmentStep
          departments={departments}
          onChange={setDepartments}
          maxDepartments={subscriptionTier === "free" ? 1 : subscriptionTier === "pro" ? 20 : 999999}
        />
      ),
    },
    {
      title: "Invite Team Members",
      description: "Invite colleagues to join your organisation",
      component: (
        <InviteStep
          invites={invites}
          onChange={setInvites}
          maxEmployees={subscriptionTier === "free" ? 10 : subscriptionTier === "pro" ? 50 : 999999}
          currentCount={1}
          departments={departments.map((d, i) => ({ _id: `temp-${i}`, name: d.name }))}
        />
      ),
    },
  ];

  if (myOrganisations === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to Axis</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your organisation to get started
          </p>
        </div>

        <OnboardingWizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          onComplete={handleComplete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
