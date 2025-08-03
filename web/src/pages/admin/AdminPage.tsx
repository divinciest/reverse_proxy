import React, { useState, lazy, Suspense } from 'react';
import {
  ArrowLeft, Newspaper, Briefcase, Tag, Settings, FileText, ScrollText, Database, Users, History, Link as LinkIcon, Server, Calendar, BarChart, Moon, Sun, Loader2,
  Loader2 as LucideLoader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth } from '@/hooks/useAuthHook';

// Lazy load all admin tabs
const AdminFeedsTab = lazy(() => import('./AdminFeedsTab'));
const AdminCompaniesTab = lazy(() => import('./AdminCompaniesTab'));
const AdminTopicsTab = lazy(() => import('./AdminTopicsTab'));
const AdminContentsTab = lazy(() => import('./AdminContentsTab').then((module) => ({ default: module.AdminContentsTab })));
const AdminConfigTab = lazy(() => import('./AdminConfigTab'));
const AdminLogsTab = lazy(() => import('./AdminLogsTab'));
const AdminBackupsTab = lazy(() => import('./AdminBackupsTab'));
const AdminUsersTab = lazy(() => import('./AdminUsersTab'));
const AdminPersonsTab = lazy(() => import('./AdminPersonsTab'));
const AdminBackgroundTaskTab = lazy(() => import('./AdminBackgroundTask'));
const AdminTagLinkTypeTab = lazy(() => import('./AdminTagLinkTypeTab'));
const AdminEventsTab = lazy(() => import('./AdminEventsTab'));
const AdminStatisticsTab = lazy(() => import('./AdminStatisticsTab'));
const AdminWorkflowsPage = lazy(() => import('./AdminWorkflowsPage'));

// Loading component for tabs
function TabLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <LucideLoader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}

function AdminPage() {
  const { isDarkMode, toggleDarkMode, isInitialized } = useDarkMode();
  const [activeTab, setActiveTab] = useState('feeds');
  const { token } = useAuth();

  return (
    <div className={`min-h-screen bg-background ${isDarkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-border bg-background hover:bg-muted"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="flex items-center gap-2 border-border bg-background hover:bg-muted"
              disabled={!isInitialized}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light' : 'Dark'}
              {' '}
              Mode
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="flex w-full min-w-max mb-4 bg-muted border border-border">
              <TabsTrigger value="feeds" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Feeds</TabsTrigger>
              <TabsTrigger value="companies" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Companies</TabsTrigger>
              <TabsTrigger value="topics" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Topics</TabsTrigger>
              <TabsTrigger value="contents" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Contents</TabsTrigger>
              <TabsTrigger value="events" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Events</TabsTrigger>
              <TabsTrigger value="config" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Config</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Logs</TabsTrigger>
              <TabsTrigger value="backups" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Backups</TabsTrigger>
              <TabsTrigger value="users" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Users</TabsTrigger>
              <TabsTrigger value="persons" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Persons</TabsTrigger>
              <TabsTrigger value="background_tasks" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Background Tasks</TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Workflows</TabsTrigger>
              <TabsTrigger value="tag_link_types" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Tag Link Types</TabsTrigger>
              <TabsTrigger value="statistics" className="text-xs whitespace-nowrap px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Statistics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feeds">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminFeedsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="companies">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminCompaniesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="topics">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminTopicsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="contents">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminContentsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="events">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminEventsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="config">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminConfigTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="logs">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminLogsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="backups">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminBackupsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminUsersTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="persons">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminPersonsTab />
            </Suspense>
          </TabsContent>

   

          <TabsContent value="background_tasks">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminBackgroundTaskTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="workflows">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminWorkflowsPage />
            </Suspense>
          </TabsContent>

          <TabsContent value="tag_link_types">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminTagLinkTypeTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="statistics">
            <Suspense fallback={<TabLoadingSpinner />}>
              <AdminStatisticsTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;
