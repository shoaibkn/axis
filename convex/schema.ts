import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    authUserId: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_auth_id", ["authUserId"]),
});
