"use client";

import * as React from "react";
import { Check, Users, Building2, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionStepProps {
  value: "free" | "pro" | "enterprise";
  onChange: (value: "free" | "pro" | "enterprise") => void;
  currentOrgCount?: number;
}

const plans = [
  {
    id: "free" as const,
    name: "Free",
    description: "Perfect for small teams getting started",
    price: "$0",
    period: "forever",
    icon: Users,
    features: [
      "Unlimited organisations",
      "1 department per organisation",
      "Up to 10 employees",
      "Basic task management",
      "Email support",
    ],
    limitations: ["Single department only"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    description: "For growing teams that need more power",
    price: "$19",
    period: "/month",
    icon: Building2,
    features: [
      "1 organisation only",
      "Up to 20 departments",
      "Up to 50 employees",
      "Advanced task management",
      "Time tracking",
      "Approval workflows",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "Custom",
    period: "",
    icon: Crown,
    features: [
      "Unlimited organisations",
      "Unlimited departments",
      "Unlimited employees",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export function SubscriptionStep({
  value,
  onChange,
  currentOrgCount = 0,
}: SubscriptionStepProps) {
  const canSelectPro = currentOrgCount === 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isDisabled = plan.id === "pro" && !canSelectPro;
        const isSelected = value === plan.id;

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative cursor-pointer transition-all hover:shadow-lg",
              isSelected && "border-primary ring-1 ring-primary",
              isDisabled && "opacity-60 cursor-not-allowed hover:shadow-none"
            )}
            onClick={() => !isDisabled && onChange(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isDisabled && (
                <p className="text-xs text-muted-foreground mt-2">
                  You can only have one Pro/Enterprise organisation. Please
                  downgrade your existing one first.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
