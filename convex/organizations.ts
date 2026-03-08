import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { requireMembership, requireOwner } from "./access";

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const now = () => Date.now();

const planRank = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

const ORG_IMAGE_PRESETS = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
];

export const getOrganizationImagePresets = query({
  args: {},
  handler: async () => ORG_IMAGE_PRESETS,
});

export const getMyOrganization = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    const userId = String(user._id);

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!membership) {
      return null;
    }

    const organization = await ctx.db.get(membership.organizationId);
    if (!organization) {
      return null;
    }

    return {
      organization,
      membership,
    };
  },
});

export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const userId = String(user._id);

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingMembership) {
      throw new ConvexError("User already belongs to an organization.");
    }

    const slug = normalizeSlug(args.slug || args.name);
    if (!slug) {
      throw new ConvexError("Organization slug is invalid.");
    }

    const slugTaken = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (slugTaken) {
      throw new ConvexError("Organization slug is already in use.");
    }

    const createdAt = now();
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name.trim(),
      slug,
      plan: args.plan,
      ownerUserId: userId,
      createdAt,
    });

    await ctx.db.insert("memberships", {
      organizationId,
      userId,
      role: "owner",
      createdAt,
      joinedAt: createdAt,
      isDisabled: false,
    });

    return organizationId;
  },
});

export const updatePlan = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const { membership, organization } = await requireOwner(ctx);

    const currentRank = planRank[organization.plan];
    const targetRank = planRank[args.plan];

    if (targetRank < currentRank) {
      throw new ConvexError("Plan downgrade is not allowed from organization settings.");
    }

    if (targetRank === currentRank) {
      return;
    }

    await ctx.db.patch(membership.organizationId, {
      plan: args.plan,
    });
  },
});

export const updateOrganizationDetails = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOwner(ctx);
    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new ConvexError("Organization name is required.");
    }

    await ctx.db.patch(membership.organizationId, {
      name: trimmedName,
    });
  },
});

export const saveOrganizationImage = mutation({
  args: {
    imageUrl: v.string(),
    imageKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOwner(ctx);

    await ctx.db.patch(membership.organizationId, {
      imageUrl: args.imageUrl,
      imageKey: args.imageKey,
    });
  },
});

export const markOnboardingComplete = mutation({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);

    await ctx.db.patch(membership.organizationId, {
      onboardingCompletedAt: now(),
    });
  },
});
