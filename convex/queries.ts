import { query } from "./_generated/server";
import { v } from "convex/values";

// Edge-compatible base64 encoding/decoding
const base64Encode = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  // Fallback for Node.js environments
  return Buffer.from(str).toString('base64');
};

const base64Decode = (str: string): string => {
  if (typeof atob !== 'undefined') {
    return atob(str);
  }
  // Fallback for Node.js environments
  return Buffer.from(str, 'base64').toString();
};

// Token verification function
const verifyToken = (token: string): { userId: string } | null => {
  try {
    const payload = JSON.parse(base64Decode(token));
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return { userId: payload.userId };
  } catch (error) {
    return null;
  }
};

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Return user without password
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

export const verifyTokenQuery = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const payload = verifyToken(args.token);
    
    if (!payload) {
      return null;
    }
    
    // Use the userId as a string and let Convex handle the type conversion
    // We need to query by the ID directly
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), payload.userId))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Return user without password
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});