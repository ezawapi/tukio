import { useState, useCallback, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import Index from "./pages/Index.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

const Events = lazy(() => import("./pages/Events.tsx"));
const EventDetail = lazy(() => import("./pages/EventDetail.tsx"));
const CreateEvent = lazy(() => import("./pages/CreateEvent.tsx"));
const EditEvent = lazy(() => import("./pages/EditEvent.tsx"));
const Categories = lazy(() => import("./pages/Categories.tsx"));
const Favorites = lazy(() => import("./pages/Favorites.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const MapExplore = lazy(() => import("./pages/MapExplore.tsx"));
const Agenda = lazy(() => import("./pages/Agenda.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const History = lazy(() => import("./pages/History.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));
const MyEvents = lazy(() => import("./pages/MyEvents.tsx"));
const InvitePage = lazy(() => import("./pages/InvitePage.tsx"));
const InvitationDetail = lazy(() => import("./pages/InvitationDetail.tsx"));
const AdminRoles = lazy(() => import("./pages/AdminRoles.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(isStandalone);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <AuthProvider>
      <TooltipProvider>
        {showSplash && <SplashScreen onFinish={hideSplash} />}
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/create" element={<CreateEvent />} />
              <Route path="/events/:id/edit" element={<EditEvent />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/explorer" element={<MapExplore />} />
              <Route path="/map" element={<MapExplore />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/u/:userId" element={<PublicProfile />} />
              <Route path="/o/:slug" element={<PublicProfile />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/history" element={<History />} />
              <Route path="/my-events" element={<MyEvents />} />
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route path="/my-invitations/:id" element={<InvitationDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
