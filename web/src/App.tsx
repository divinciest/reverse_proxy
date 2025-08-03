import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotificationToaster from '@/notifications/NotificationToaster';
import './App.css';
import ChatBubble from '@/components/chatbot/ChatBubble';
import AdminTask from './pages/admin/AdminBackgroundTask';
import AdminWorkflows from './pages/admin/AdminWorkflows';
import WorkflowEditor from './pages/admin/WorkflowEditor';

// Lazy load all pages
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Admin = lazy(() => import('./pages/Admin'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const AboutPremium = lazy(() => import('./pages/AboutPremium'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const TagContentsPage = lazy(() => import('./pages/TagContentsPage'));
const TrendingTagsPage = lazy(() => import('./pages/TrendingTagsPage'));
const ExploreTagsPage = lazy(() => import('./pages/ExploreTagsPage'));
const Browse = lazy(() => import('./pages/Browse'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider delayDuration={300}>
            <Toaster />
            <Sonner />
            <NotificationToaster />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Redirect root to browse page */}
                  <Route path="/" element={<Navigate to="/browse" replace />} />

                  {/* Public routes */}
                  <Route path="/home" element={<Index />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/about-premium" element={<AboutPremium />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/tags/:tag_name" element={<TagContentsPage />} />
                  <Route path="/trending-tags" element={<TrendingTagsPage />} />
                  <Route path="/explore-tags" element={<ExploreTagsPage />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/chat" element={<ChatbotPage />} />
                  <Route path="*" element={<NotFound />} />

                  {/* Protected routes that require authentication */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<div>Profile Page (Coming Soon)</div>} />
                  </Route>

                  {/* Protected routes that require admin privileges */}
                  <Route element={<ProtectedRoute requireAdmin />}>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/*" element={<Admin />} />
                    <Route path="/admin/workflows" element={<AdminWorkflows />} />
                    <Route path="/admin/workflows/new" element={<WorkflowEditor />} />
                    <Route path="/admin/workflows/edit/:workflowId" element={<WorkflowEditor />} />
                  </Route>
                </Routes>
              </Suspense>
              <ChatBubble />
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
