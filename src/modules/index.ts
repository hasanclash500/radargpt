import type { DivosazModule, ModuleRoute } from "./contract";
import { getInstalledModules, registerDivosazModule } from "./registry";

/**
 * تنها نقطه نصب ماژول‌های اختیاری.
 * ماژول‌های آینده در پوشه مستقل خودشان export می‌شوند و در این فایل register
 * می‌شوند؛ فایل main، داشبورد و هسته آگهی‌ها نیازی به تغییر ندارند.
 */
export function installOptionalModule(module: DivosazModule) {
  return registerDivosazModule(module);
}

export function getModuleRoutes(enabledIds: string[]): ModuleRoute[] {
  const enabled = new Set(enabledIds);
  return getInstalledModules()
    .filter((module) => enabled.has(module.id))
    .flatMap((module) => module.routes ?? []);
}

export { getInstalledModules };
