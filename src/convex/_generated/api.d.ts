/* eslint-disable */
/**
 * Generated `api` utility.
 * To regenerate from Convex, run `npx convex codegen`.
 */
import type * as assistant from "../assistant.js";
import type * as advisorChat from "../advisorChat.js";
import type * as advisors from "../advisors.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as folders from "../folders.js";
import type * as ingest from "../ingest.js";
import type * as integrations from "../integrations.js";
import type * as leads from "../leads.js";
import type * as listings from "../listings.js";
import type * as matches from "../matches.js";
import type * as pages from "../pages.js";
import type * as posts from "../posts.js";
import type * as reminders from "../reminders.js";
import type * as roles from "../roles.js";
import type * as stories from "../stories.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assistant: typeof assistant;
  advisorChat: typeof advisorChat;
  advisors: typeof advisors;
  auth: typeof auth;
  backup: typeof backup;
  folders: typeof folders;
  ingest: typeof ingest;
  integrations: typeof integrations;
  leads: typeof leads;
  listings: typeof listings;
  matches: typeof matches;
  pages: typeof pages;
  posts: typeof posts;
  reminders: typeof reminders;
  roles: typeof roles;
  stories: typeof stories;
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
