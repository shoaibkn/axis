import { mutation } from "./_generated/server";
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

// Simple token generation using base64 encoding (Edge-compatible)
const generateToken = (userId: any): string => {
  // Convert Convex Id to string for token storage
  const userIdStr = typeof userId === 'string' ? userId : JSON.stringify(userId);
  const payload = { userId: userIdStr, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
  return base64Encode(JSON.stringify(payload));
};

// Edge-compatible password hashing using simple salt
const hashPassword = async (password: string): Promise<string> => {
  const salt = "edge-compatible-salt";
  const combined = password + salt;
  return base64Encode(combined);
};

const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const salt = "edge-compatible-salt";
  const combined = password + salt;
  const expectedHash = base64Encode(combined);
  return hashedPassword === expectedHash;
};

export const signUp = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Generate token
    const token = generateToken(userId);

    return {
      token,
      user: {
        _id: userId,
        name: args.name,
        email: args.email,
      },
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await comparePassword(args.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = generateToken(user._id);

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  },
});