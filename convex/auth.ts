import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";
import { SignJWT, importPKCS8, type KeyLike } from "jose";

const ISSUER = process.env.CONVEX_AUTH_ISSUER;
const AUDIENCE = process.env.CONVEX_AUTH_AUDIENCE;
const PRIVATE_KEY = process.env.CONVEX_AUTH_PRIVATE_KEY;
const KEY_ID = process.env.CONVEX_AUTH_KID ?? "convex-auth-key";

let cachedKey: KeyLike | null = null;

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

async function getPrivateKey() {
  const rawKey = requireEnv(PRIVATE_KEY, "CONVEX_AUTH_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  if (!cachedKey) {
    cachedKey = await importPKCS8(rawKey, "RS256");
  }
  return cachedKey;
}

async function signToken(authUserId: string) {
  const issuer = requireEnv(ISSUER, "CONVEX_AUTH_ISSUER");
  const audience = requireEnv(AUDIENCE, "CONVEX_AUTH_AUDIENCE");
  const key = await getPrivateKey();

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: KEY_ID })
    .setSubject(authUserId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export const signup = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { name, email, password }) => {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Name is required.");
    }

    const authUserId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await ctx.runMutation(internal.users.create, {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      authUserId,
    });

    if (!user) {
      throw new Error("Unable to create account.");
    }

    const token = await signToken(authUserId);

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

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new Error("Invalid email or password.");
    }

    const user = await ctx.runQuery(internal.users.getByEmail, {
      email: normalizedEmail,
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    const token = await signToken(user.authUserId);

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
