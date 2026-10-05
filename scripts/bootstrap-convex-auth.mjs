import { generateKeyPairSync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

  return (result.stdout || "").trimEnd();
}

function setEnv(name, value) {
  runConvex(["env", "set", name], `${value}\n`);
  console.log(`✓ Convex env ${name} configured`);
}

function setEnvFromFile(name, value) {
  const dir = mkdtempSync(join(tmpdir(), "meka-convex-auth-"));
  const file = join(dir, "value.txt");
  try {
    writeFileSync(file, value, { encoding: "utf8", mode: 0o600 });
    runConvex(["env", "set", name, "--from-file", file]);
    console.log(`✓ Convex env ${name} configured`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function getEnv(name) {
  try {
    return runConvex(["env", "get", name]);
  } catch {
    return "";
  }
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
    : "https://divsaz.ir");

if (!names.has("SITE_URL") || getEnv("SITE_URL").trim() !== siteUrl) {
  setEnv("SITE_URL", siteUrl);
}

if (!names.has("AUTH_SECRET")) {
  setEnv("AUTH_SECRET", randomBytes(32).toString("base64url"));
}

const currentPrivateKey = getEnv("JWT_PRIVATE_KEY");
const currentJwks = getEnv("JWKS");

let privateKeyLooksValid =
  currentPrivateKey.includes("-----BEGIN PRIVATE KEY-----") &&
  currentPrivateKey.includes("-----END PRIVATE KEY-----") &&
  currentPrivateKey.includes("\n");

let jwksLooksValid = false;
try {
  const parsed = JSON.parse(currentJwks);
  jwksLooksValid =
    Array.isArray(parsed?.keys) &&
    parsed.keys.length > 0 &&
    parsed.keys[0]?.kty === "RSA";
} catch {
  jwksLooksValid = false;
}

if (!privateKeyLooksValid || !jwksLooksValid) {
  console.log("• Regenerating Convex Auth signing keys");

  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const privatePem = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
    .trimEnd();

  const publicJwk = publicKey.export({ format: "jwk" });
  const jwks = JSON.stringify({
    keys: [{ use: "sig", alg: "RS256", ...publicJwk }],
  });

  // Keep the PEM newlines intact. Convex Auth requires a valid PKCS#8 PEM.
  setEnvFromFile("JWT_PRIVATE_KEY", privatePem);
  setEnv("JWKS", jwks);
}

console.log("✓ Convex Auth bootstrap complete");
