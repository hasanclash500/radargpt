/* eslint-disable */
/**
 * Generated `api` utility.
 * To regenerate from Convex, run `npx convex codegen`.
 */
import type * as auth from "../auth.js";
import type * as folders from "../folders.js";
import type * as ingest from "../ingest.js";
import type * as integrations from "../integrations.js";
import type * as leads from "../leads.js";
import type * as listings from "../listings.js";
import type * as posts from "../posts.js";
import type * as reminders from "../reminders.js";
import type * as roles from "../roles.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  folders: typeof folders;
  ingest: typeof ingest;
  integrations: typeof integrations;
  leads: typeof leads;
  listings: typeof listings;
  posts: typeof posts;
  reminders: typeof reminders;
  roles: typeof roles;
  users: typeof users;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
export declare const components: {};
