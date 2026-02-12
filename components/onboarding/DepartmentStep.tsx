"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DepartmentStepProps {
  departments: { name: string; description: string }[];
  onChange: (departments: { name: string; description: string }[]) => void;
  maxDepartments: number;
  organisationId?: string;
}

export function DepartmentStep({
  departments,
  onChange,
  maxDepartments,
}: DepartmentStepProps) {
  const [newDept, setNewDept] = React.useState({ name: "", description: "" });
  const canAddMore = departments.length < maxDepartments;

  const handleAdd = () => {
    if (newDept.name.trim() && canAddMore) {
      onChange([...departments, { ...newDept }]);
      setNewDept({ name: "", description: "" });
    }
  };

  const handleRemove = (index: number) => {
    onChange(departments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Departments</h4>
          <p className="text-sm text-muted-foreground">
            Add departments or teams to your organisation
          </p>
        </div>
        <Badge variant="secondary">
          {departments.length} / {maxDepartments}
        </Badge>
      </div>

      {departments.length > 0 && (
        <div className="space-y-2">
          {departments.map((dept, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
            >
              <div>
                <p className="font-medium">{dept.name}</p>
                {dept.description && (
                  <p className="text-sm text-muted-foreground">
                    {dept.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {canAddMore ? (
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department Name</Label>
            <Input
              id="dept-name"
              placeholder="e.g., Engineering"
              value={newDept.name}
              onChange={(e) =>
                setNewDept({ ...newDept, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description (Optional)</Label>
            <Textarea
              id="dept-desc"
              placeholder="What does this department do?"
              value={newDept.description}
              onChange={(e) =>
                setNewDept({ ...newDept, description: e.target.value })
              }
              rows={2}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!newDept.name.trim()}
          >
            Add Department
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          You've reached the maximum number of departments for your plan.
        </p>
      )}
    </div>
  );
}
