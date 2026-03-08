import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { isManagerRole } from "./access";
import { createOrgImageUploadUrl } from "./r2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiAny = api as any;

export const createTaskAttachmentUploadUrl = action({
  args: {
    fileName: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const orgState = await ctx.runQuery(apiAny.organizations.getMyOrganization, {});
    if (!orgState) {
      throw new ConvexError("Organization membership not found.");
    }

    if (!isManagerRole(orgState.membership.role)) {
      throw new ConvexError("Only owners and managers can upload task attachments.");
    }

    const extension = args.fileName.split(".").pop()?.toLowerCase() || "bin";
    const key = `organizations/${orgState.organization._id}/tasks/attachments/${crypto.randomUUID()}.${extension}`;

    return createOrgImageUploadUrl({
      key,
      contentType: args.contentType,
    });
  },
});
