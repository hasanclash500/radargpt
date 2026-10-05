import type {
  DivosazModule,
  ListingSubmissionDraft,
  ListingSubmissionGateResult,
  ModuleAdminPanel,
  ModuleAuthEntry,
  ModuleRoute,
} from "./contract";
import { getInstalledModules, registerDivosazModule } from "./registry";

/**
 * تنها نقطه نصب ماژول‌های اختیاری.
 * ماژول‌های آینده در پوشه مستقل خودشان export و در این فایل register می‌شوند.
 */
export function installOptionalModule(module: DivosazModule) {
  return registerDivosazModule(module);
}

function enabledModules(enabledIds: string[]) {
  const enabled = new Set(enabledIds);
  return getInstalledModules().filter((module) => enabled.has(module.id));
}

export function getModuleRoutes(enabledIds: string[]): ModuleRoute[] {
  return enabledModules(enabledIds).flatMap((module) => module.routes ?? []);
}

export function getModuleAdminPanels(
  enabledIds: string[],
): Array<ModuleAdminPanel & { moduleId: string; moduleLabel: string }> {
  return enabledModules(enabledIds).flatMap((module) =>
    (module.adminPanels ?? []).map((panel) => ({
      ...panel,
      moduleId: module.id,
      moduleLabel: module.label,
    })),
  );
}

export function getModuleAuthEntries(
  enabledIds: string[],
): Array<ModuleAuthEntry & { moduleId: string }> {
  return enabledModules(enabledIds).flatMap((module) =>
    (module.authEntries ?? []).map((entry) => ({
      ...entry,
      moduleId: module.id,
    })),
  );
}

export async function runBeforeListingSubmit(
  enabledIds: string[],
  draft: ListingSubmissionDraft,
): Promise<{
  allowed: boolean;
  message?: string;
  metadata: Record<string, Record<string, unknown> | undefined>;
}> {
  const metadata: Record<string, Record<string, unknown> | undefined> = {};

  for (const module of enabledModules(enabledIds)) {
    const hook = module.listingSubmission?.beforeSubmit;
    if (!hook) continue;

    const result: ListingSubmissionGateResult = await hook(draft);
    if (!result.allowed) {
      return {
        allowed: false,
        message: result.message,
        metadata,
      };
    }
    metadata[module.id] = result.metadata;
  }

  return { allowed: true, metadata };
}

export async function runAfterListingSubmit(
  enabledIds: string[],
  context: {
    key: string;
    trackingCode: string;
    draft: ListingSubmissionDraft;
    metadata: Record<string, Record<string, unknown> | undefined>;
  },
) {
  for (const module of enabledModules(enabledIds)) {
    const hook = module.listingSubmission?.afterSubmit;
    if (!hook) continue;
    await hook({
      key: context.key,
      trackingCode: context.trackingCode,
      draft: context.draft,
      metadata: context.metadata[module.id],
    });
  }
}

export { getInstalledModules };
export type {
  DivosazModule,
  ListingSubmissionDraft,
  ModuleAdminPanel,
  ModuleAuthEntry,
  ModuleRoute,
};
