import type { AuthConfig } from "convex/server";

/**
 * Convex Auth for this deployment.
 *
 * Authentication tokens issued by @convex-dev/auth use this deployment's
 * Convex site URL as their issuer. The previous Freebuff/VLY custom JWT
 * provider was specific to the original template and is intentionally not
 * required by the standalone MEKA production deployment.
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
