import { AuthConfig } from "convex/server";

const issuer = process.env.CONVEX_AUTH_ISSUER;
const jwks = process.env.CONVEX_AUTH_JWKS;
const applicationID = process.env.CONVEX_AUTH_AUDIENCE;

if (!issuer || !jwks || !applicationID) {
  throw new Error(
    "Missing CONVEX_AUTH_ISSUER, CONVEX_AUTH_JWKS, or CONVEX_AUTH_AUDIENCE",
  );
}

const config: AuthConfig = {
  providers: [
    {
      type: "customJwt",
      issuer,
      jwks,
      algorithm: "RS256",
      applicationID,
    },
  ],
};

export default config;
