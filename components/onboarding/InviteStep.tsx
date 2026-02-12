"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Mail } from "lucide-react";

interface Invite {
  email: string;
  role: string;
  departmentId?: string;
}

interface InviteStepProps {
  invites: Invite[];
  onChange: (invites: Invite[]) => void;
  maxEmployees: number;
  currentCount: number;
  departments?: { _id: string; name: string }[];
}

const ROLES = [
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export function InviteStep({
  invites,
  onChange,
  maxEmployees,
  currentCount,
  departments = [],
}: InviteStepProps) {
  const [newInvite, setNewInvite] = React.useState<Invite>({
    email: "",
    role: "member",
  });

  const totalAfterInvites = currentCount + invites.length;
  const canAddMore = totalAfterInvites < maxEmployees;
  const remaining = maxEmployees - totalAfterInvites;

  const handleAdd = () => {
    if (newInvite.email.trim() && canAddMore) {
      onChange([...invites, { ...newInvite }]);
      setNewInvite({ email: "", role: "member" });
    }
  };

  const handleRemove = (index: number) => {
    onChange(invites.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Invite Team Members</h4>
          <p className="text-sm text-muted-foreground">
            Invite colleagues to join your organisation
          </p>
        </div>
        <Badge variant="secondary">
          {totalAfterInvites} / {maxEmployees}
        </Badge>
      </div>

      {invites.length > 0 && (
        <div className="space-y-2">
          {invites.map((invite, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLES.find((r) => r.value === invite.role)?.label} {
                      invite.departmentId && departments.find(d => d._id === invite.departmentId) 
                        ? `• ${departments.find(d => d._id === invite.departmentId)?.name}`
                        : ""
                    }
                  </p>
                </div>
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
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={newInvite.email}
              onChange={(e) =>
                setNewInvite({ ...newInvite, email: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newInvite.role}
                onValueChange={(value) =>
                  setNewInvite({ ...newInvite, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {departments.length > 0 && (
              <div className="space-y-2">
                <Label>Department (Optional)</Label>
                <Select
                  value={newInvite.departmentId || "none"}
                  onValueChange={(value) =>
                    setNewInvite({
                      ...newInvite,
                      departmentId: value === "none" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!newInvite.email.trim()}
          >
            Add Invitation
          </Button>
          <p className="text-xs text-muted-foreground">
            {remaining} invitation{remaining !== 1 ? "s" : ""} remaining
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          You've reached the maximum number of employees for your plan.
        </p>
      )}
    </div>
  );
}
