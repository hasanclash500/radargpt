import '@vly-ai/integrations';
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/convex/_generated/api";
import { getModuleRoutes } from "@/modules";
import { RequireAuth } from "@/components/RequireAuth";
import FloatingSiteChat from "@/components/chat/FloatingSiteChat";
import PendingFavoriteSync from "@/components/listings/PendingFavoriteSync";
import SiteThemeSync from "@/components/SiteThemeSync";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, useQuery } from "convex/react";
import { ThemeProvider } from "next-themes";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Homepage = lazy(() => import("./pages/Homepage.tsx"));
const SitePage = lazy(() => import("./pages/SitePage.tsx"));
const PageBuilder = lazy(() => import("./pages/PageBuilder.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const DashboardHome = lazy(() => import("./pages/DashboardHome.tsx"));
const DashboardLeads = lazy(() => import("./pages/DashboardLeads.tsx"));
const DashboardReminders = lazy(() => import("./pages/DashboardReminders.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogArticle = lazy(() => import("./pages/BlogArticle.tsx"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin.tsx"));
const PublicListings = lazy(() => import("./pages/PublicListings.tsx"));
const PublicListing = lazy(() => import("./pages/PublicListing.tsx"));
const SavedListings = lazy(() => import("./pages/SavedListings.tsx"));
const AssistantPage = lazy(() => import("./pages/Assistant.tsx"));
const SmartMatches = lazy(() => import("./pages/SmartMatches.tsx"));
const PropertyRequest = lazy(() => import("./pages/PropertyRequest.tsx"));
const SubmitListing = lazy(() => import("./pages/SubmitListing.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const AdvisorProfile = lazy(() => import("./pages/AdvisorProfile.tsx"));
const AdvisorProfileEditor = lazy(() => import("./pages/AdvisorProfileEditor.tsx"));
const StoryManager = lazy(() => import("./pages/StoryManager.tsx"));
const AdvisorChat = lazy(() => import("./pages/AdvisorChat.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
function OptionalModuleRoutes() {
  const settings = useQuery(api.folders.getSettings, {});
  const routes = getModuleRoutes(settings?.enabledModules ?? []);
  if (routes.length === 0) return null;

  return (
    <Routes>
      {routes.map((route) => {
        const Component = route.component;
        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.requiresAuth ? (
                <RequireAuth>
                  <Component />
                </RequireAuth>
              ) : (
                <Component />
              )
            }
          />
        );
      })}
    </Routes>
  );
}


/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ConvexAuthProvider client={convex}>
        <SiteThemeSync />
        <BrowserRouter>
          <RouteSyncer />
          <PendingFavoriteSync />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/p/:slug" element={<SitePage />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/listings" element={<PublicListings />} />
              <Route path="/listings/:slug" element={<PublicListing />} />
              <Route
                path="/saved"
                element={
                  <RequireAuth
                    title="ورود به آگهی‌های ذخیره‌شده"
                    description="برای ذخیره و مشاهده آگهی‌های موردعلاقه، ابتدا وارد حساب دیوساز شوید."
                    redirectImmediately
                  >
                    <SavedListings />
                  </RequireAuth>
                }
              />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/request" element={<PropertyRequest />} />
              <Route path="/submit-listing" element={<SubmitListing />} />
              <Route path="/about" element={<About />} />
              <Route path="/consultants/:slug" element={<AdvisorProfile />} />
              <Route
                path="/dashboard/assistant"
                element={
                  <RequireAuth>
                    <AssistantPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route
                path="/dashboard/listings"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/leads"
                element={
                  <RequireAuth
                    title="ورود به متقاضی‌ها"
                    description="این بخش برای مدیر، ادمین و مشاوران است."
                  >
                    <DashboardLeads />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/reminders"
                element={
                  <RequireAuth
                    title="ورود به یادآوری‌ها"
                    description="این بخش برای تیم داخلی دیوساز است."
                  >
                    <DashboardReminders />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/matches"
                element={
                  <RequireAuth
                    title="ورود به تطبیق فایل و متقاضی"
                    description="این بخش برای مدیر و ادمین در دسترس است."
                  >
                    <SmartMatches />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <RequireAuth
                    title="ورود به پروفایل مشاور"
                    description="مدیریت صفحه عمومی مشاور دیوساز"
                  >
                    <AdvisorProfileEditor />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/chat"
                element={
                  <RequireAuth
                    title="ورود به چت دیوساز"
                    description="گفت‌وگوی خصوصی با مدیر و مشاوران دیوساز"
                  >
                    <AdvisorChat />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/stories"
                element={
                  <RequireAuth
                    title="ورود به مدیریت استوری"
                    description="ایجاد و مدیریت استوری مشاوران دیوساز"
                  >
                    <StoryManager />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/pages"
                element={
                  <RequireAuth
                    title="ورود به صفحه‌ساز"
                    description="مدیریت لندینگ‌ها و برگه‌های سایت دیوساز"
                  >
                    <PageBuilder />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/blog"
                element={
                  <RequireAuth
                    title="ورود به استودیوی محتوا"
                    description="برای نوشتن و مدیریت مقاله‌های دیوساز وارد حساب کاربری شوید."
                  >
                    <BlogAdmin />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth
                    title="ورود به مدیریت"
                    description="این صفحه مخصوص مدیر و ادمین آگهی است."
                  >
                    <Admin />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/matches"
                element={
                  <RequireAuth
                    title="ورود به مچ هوشمند"
                    description="این صفحه مخصوص مدیر و ادمین آگهی است."
                  >
                    <SmartMatches />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <OptionalModuleRoutes />
          </Suspense>
          <FloatingSiteChat />
        </BrowserRouter>
          <Toaster />
        </ConvexAuthProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
