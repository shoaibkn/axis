import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { createOrgImageUploadUrl, uploadRemoteImageToR2 } from "./r2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiAny = api as any;

const ORG_IMAGE_PRESETS = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
];

export const createOrganizationImageUploadUrl = action({
  args: {
    fileName: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const orgState = await ctx.runQuery(apiAny.organizations.getMyOrganization, {});
    if (!orgState || orgState.membership.role !== "owner") {
      throw new ConvexError("Only owners can update organization image.");
    }

    const extension = args.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const key = `organizations/${orgState.organization._id}/images/${crypto.randomUUID()}.${extension}`;

    return createOrgImageUploadUrl({
      key,
      contentType: args.contentType,
    });
  },
});

export const applyOrganizationImagePreset = action({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const orgState = await ctx.runQuery(apiAny.organizations.getMyOrganization, {});
    if (!orgState || orgState.membership.role !== "owner") {
      throw new ConvexError("Only owners can update organization image.");
    }

    if (!ORG_IMAGE_PRESETS.includes(args.imageUrl)) {
      throw new ConvexError("Invalid preset image selection.");
    }

    const key = `organizations/${orgState.organization._id}/images/preset-${crypto.randomUUID()}.jpg`;
    const uploaded = await uploadRemoteImageToR2({
      key,
      imageUrl: args.imageUrl,
      contentType: "image/jpeg",
    });

    await ctx.runMutation(apiAny.organizations.saveOrganizationImage, {
      imageKey: uploaded.key,
      imageUrl: uploaded.publicUrl,
    });

    return uploaded;
  },
});
