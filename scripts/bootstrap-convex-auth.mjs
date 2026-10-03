import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

function runConvex(args, input) {
  const result = spawnSync("npx", ["convex", ...args], {
    env: process.env,
    encoding: "utf8",
    input,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(message || `convex ${args.join(" ")} failed`);
  }

  return (result.stdout || "").trim();
}

function setEnv(name, value) {
  runConvex(["env", "set", name], `${value}\n`);
  console.log(`✓ Convex env ${name} configured`);
}

let names;
try {
  names = new Set(
    runConvex(["env", "list", "--names-only"])
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
} catch (error) {
  console.error(
    "Unable to inspect Convex environment variables. " +
      "The CONVEX_DEPLOY_KEY must include deployment:env:view and deployment:env:write permissions.",
  );
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const siteUrl =
  process.env.MEKA_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://radargpt.vercel.app");

if (!names.has("SITE_URL")) {
  setEnv("SITE_URL", siteUrl);
}

if (!names.has("AUTH_SECRET")) {
  setEnv("AUTH_SECRET", randomBytes(32).toString("base64url"));
}

const hasPrivateKey = names.has("JWT_PRIVATE_KEY");
const hasJwks = names.has("JWKS");

if (!hasPrivateKey || !hasJwks) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const privatePem = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
    .trimEnd()
    .replace(/\n/g, " ");

  const publicJwk = publicKey.export({ format: "jwk" });
  const jwks = JSON.stringify({
    keys: [{ use: "sig", alg: "RS256", ...publicJwk }],
  });

  // Always replace both together so they are guaranteed to match.
  setEnv("JWT_PRIVATE_KEY", privatePem);
  setEnv("JWKS", jwks);
}

console.log("✓ Convex Auth bootstrap complete");
