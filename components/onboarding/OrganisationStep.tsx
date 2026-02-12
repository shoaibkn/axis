"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrganisationStepProps {
  data: {
    name: string;
    description: string;
  };
  onChange: (data: { name: string; description: string }) => void;
}

export function OrganisationStep({ data, onChange }: OrganisationStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">
          Organisation Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="org-name"
          placeholder="Acme Inc."
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-description">Description (Optional)</Label>
        <Textarea
          id="org-description"
          placeholder="Tell us about your organisation..."
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
