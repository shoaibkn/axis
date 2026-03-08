import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { authComponent } from "./auth";

type Ctx = QueryCtx | MutationCtx;

export const isManagerRole = (role: string) =>
  role === "owner" || role === "manager" || role === "admin";

export async function requireMembership(ctx: Ctx) {
  const user = await authComponent.getAuthUser(ctx);
  const userId = String(user._id);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!membership) {
    throw new ConvexError("Organization membership not found.");
  }

  if (membership.isDisabled) {
    throw new ConvexError("Your account is disabled in this organization.");
  }

  const organization = await ctx.db.get(membership.organizationId);
  if (!organization) {
    throw new ConvexError("Organization not found.");
  }

  return { user, userId, membership, organization };
}

export async function requireOwner(ctx: Ctx) {
  const state = await requireMembership(ctx);
  if (state.membership.role !== "owner") {
    throw new ConvexError("Only organization owners can perform this action.");
  }
  return state;
}

export async function requireOwnerOrManager(ctx: Ctx) {
  const state = await requireMembership(ctx);
  if (!isManagerRole(state.membership.role)) {
    throw new ConvexError("Only owners and managers can perform this action.");
  }
  return state;
}
