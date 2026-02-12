"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [isAccepting, setIsAccepting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validation = useQuery(api.invitations.validateToken, { token });
  const acceptInvitation = useMutation(api.invitations.accept);

  const { data: session } = authClient.useSession();

  const handleAccept = async () => {
    if (!session) {
      router.push(`/auth?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    setIsAccepting(true);
    try {
      const result = await acceptInvitation({ token });
      if (result.success) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
      setIsAccepting(false);
    }
  };

  const handleSignIn = () => {
    router.push(`/auth?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  };

  if (validation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {validation.reason === "expired" && "This invitation has expired."}
              {validation.reason === "already_used" && "This invitation has already been used."}
              {validation.reason === "invitation_not_found" && "We couldn't find this invitation."}
              {validation.reason === "organisation_not_found" && "The organisation no longer exists."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = validation.invitation;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation.organisationName}</strong>
            {invitation.departmentName && (
              <> as part of the <strong>{invitation.departmentName}</strong> department</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {session ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You're signed in as <strong>{session.user.email}</strong>
              </p>
              <Button 
                onClick={handleAccept} 
                className="w-full" 
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or create an account to accept this invitation
              </p>
              <Button onClick={handleSignIn} className="w-full">
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
