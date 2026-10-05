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

export type ModuleAuthEntry = {
  id: string;
  label: string;
  description?: string;
  component: ComponentType<{
    mode: "signIn" | "signUp";
    returnTo: string;
  }>;
};

export type ListingSubmissionDraft = {
  phone: string;
  city: string;
  propertyType: string;
  dealType: string;
  area?: number;
  priceMillion?: number;
  depositMillion?: number;
  rentMillion?: number;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  imageCount: number;
};

export type ListingSubmissionGateResult =
  | { allowed: true; metadata?: Record<string, unknown> }
  | { allowed: false; message: string };

export type ModuleListingSubmissionHook = {
  id: string;
  /** قبل از ثبت نهایی اجرا می‌شود؛ برای پرداخت، سهمیه یا قوانین تجاری. */
  beforeSubmit?: (
    draft: ListingSubmissionDraft,
  ) => Promise<ListingSubmissionGateResult>;
  /** بعد از ثبت موفق؛ مثلاً ثبت رسید یا اعلان provider. */
  afterSubmit?: (context: {
    key: string;
    trackingCode: string;
    draft: ListingSubmissionDraft;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
};

export type DivosazModule = {
  id: string;
  label: string;
  version: string;
  capabilities: ModuleCapability[];
  routes?: ModuleRoute[];
  adminPanels?: ModuleAdminPanel[];
  authEntries?: ModuleAuthEntry[];
  listingSubmission?: ModuleListingSubmissionHook;
};

/**
 * قرارداد ثابت ماژول‌های دیوساز.
 *
 * ورود پیامکی، پرداخت، سرویس اعلان یا هر قابلیت آینده باید در
 * src/modules/<module-name> پیاده‌سازی و از همین قرارداد نصب شود.
 * هسته نباید SDK سرویس‌دهنده را مستقیماً import کند.
 */
export function defineDivosazModule(module: DivosazModule) {
  return module;
}
