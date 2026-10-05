import type { ComponentType } from "react";

export type ModuleCapability =
  | "auth-provider"
  | "listing-payment"
  | "notification-channel"
  | "dashboard-widget"
  | "admin-panel"
  | "public-route";

export type ModuleRoute = {
  path: string;
  component: ComponentType;
  requiresAuth?: boolean;
};

export type ModuleAdminPanel = {
  id: string;
  label: string;
  component: ComponentType;
};

export type DivosazModule = {
  id: string;
  label: string;
  version: string;
  capabilities: ModuleCapability[];
  routes?: ModuleRoute[];
  adminPanels?: ModuleAdminPanel[];
};

/**
 * قرارداد ثابت ماژول‌های دیوساز.
 *
 * قابلیت‌های آینده مثل ورود پیامکی یا پرداخت ثبت آگهی باید در پوشه مستقل
 * src/modules/<module-name> پیاده‌سازی شوند و فقط از این قرارداد استفاده کنند.
 * هسته آگهی‌ها، نقش‌ها و داشبورد نباید مستقیماً به SDK سرویس‌دهنده وابسته شود.
 */
export function defineDivosazModule(module: DivosazModule) {
  return module;
}
