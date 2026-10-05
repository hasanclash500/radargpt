import type { DivosazModule } from "./contract";

/**
 * رجیستری واحد ماژول‌ها.
 * افزودن ماژول جدید فقط در این لایه انجام می‌شود؛ کد هسته نباید provider خاص
 * پیامک، درگاه پرداخت یا سرویس خارجی را import کند.
 */
const installedModules: DivosazModule[] = [];

export function registerDivosazModule(module: DivosazModule) {
  if (installedModules.some((item) => item.id === module.id)) {
    throw new Error("ماژول تکراری است: " + module.id);
  }
  installedModules.push(module);
  return module;
}

export function getInstalledModules() {
  return [...installedModules];
}

export function getEnabledModules(enabledIds: string[]) {
  const enabled = new Set(enabledIds);
  return installedModules.filter((module) => enabled.has(module.id));
}

export const PLANNED_MODULE_IDS = {
  SMS_AUTH: "sms-auth",
  LISTING_PAYMENT: "listing-payment",
} as const;
