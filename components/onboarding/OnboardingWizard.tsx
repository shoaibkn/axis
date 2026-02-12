"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingWizardProps {
  steps: {
    title: string;
    description: string;
    component: React.ReactNode;
  }[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function OnboardingWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isLoading,
}: OnboardingWizardProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <span
              key={index}
              className={
                index <= currentStep ? "text-primary font-medium" : ""
              }
            >
              Step {index + 1}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentStepData.component}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
              >
                Back
              </Button>
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading
                  ? "Loading..."
                  : isLastStep
                  ? "Complete Setup"
                  : "Next"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
