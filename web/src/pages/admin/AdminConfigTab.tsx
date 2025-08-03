import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  X, Plus, Save, Settings, AlertCircle, CheckCircle, MapPin, Database, Info, Edit3, History, Check, RefreshCw, Trash2, Server, BrainCircuit, KeyRound, Star, Edit, Loader2,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  configService, GeographicBiasSettings, TaskDefinition, ApiCacheConfig, LlmSettings, LlmTokenUsage, LlmApiKey, CacheStatsResponse, HealthStatus,
} from '@/utils/services/configService';
import { taskService, TaskDefinition as TaskDefinitionType, TaskSchedule } from '@/utils/services/taskService';
import { TagCategory } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TabContent from '@/components/admin/TabContent';
import { Switch } from '@/components/ui/switch';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import api from '@/utils/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Helper type for interval parts
interface IntervalParts {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

// Interfaces moved from AdminPage
interface RefreshProgress {
  is_processing: boolean;
  total: number;
  processed: number;
  percentage: number;
}

interface RefreshResponse {
    message: string;
    contents_deleted: number;
    preload_status: string;
    in_memory_contents_reloaded: number;
}

interface ErasableCollection {
  id: string;
  name: string;
  collectionName: string;
}

interface ErasableCollectionSelection {
  [collectionId: string]: boolean;
}

// Helper function to convert total seconds to parts
const secondsToParts = (totalSeconds: number): IntervalParts => {
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  totalSeconds %= (24 * 60 * 60);
  const hours = Math.floor(totalSeconds / (60 * 60));
  totalSeconds %= (60 * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    days, hours, minutes, seconds,
  };
};

// Helper function to convert parts to total seconds
const partsToSeconds = (parts: IntervalParts): number => (parts.days * 24 * 60 * 60)
           + (parts.hours * 60 * 60)
           + (parts.minutes * 60)
           + parts.seconds;

function AdminConfigTab() {
  // Tag Categories State
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [initialCategories, setInitialCategories] = useState<TagCategory[]>([]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesSuccessMessage, setCategoriesSuccessMessage] = useState<string | null>(null);

  // Cannot Trend Tag Categories State
  const [cannotTrendCategories, setCannotTrendCategories] = useState<TagCategory[]>([]);
  const [initialCannotTrendCategories, setInitialCannotTrendCategories] = useState<TagCategory[]>([]);
  const [newCannotTrendCategory, setNewCannotTrendCategory] = useState<string>('');
  const [isLoadingCannotTrendCategories, setIsLoadingCannotTrendCategories] = useState(false);
  const [isSavingCannotTrendCategories, setIsSavingCannotTrendCategories] = useState(false);
  const [cannotTrendCategoriesError, setCannotTrendCategoriesError] = useState<string | null>(null);
  const [cannotTrendCategoriesSuccessMessage, setCannotTrendCategoriesSuccessMessage] = useState<string | null>(null);

  // Geographic Bias State
  const [geoBiasSettings, setGeoBiasSettings] = useState<GeographicBiasSettings>({
    enableGeographicBias: true,
    autoDetectLocation: true,
    defaultCountryTag: 'united states',
  });
  const [initialGeoBiasSettings, setInitialGeoBiasSettings] = useState<GeographicBiasSettings>({
    enableGeographicBias: true,
    autoDetectLocation: true,
    defaultCountryTag: 'united states',
  });
  const [isLoadingGeoBias, setIsLoadingGeoBias] = useState(false);
  const [isSavingGeoBias, setIsSavingGeoBias] = useState(false);
  const [geoBiasError, setGeoBiasError] = useState<string | null>(null);
  const [geoBiasSuccessMessage, setGeoBiasSuccessMessage] = useState<string | null>(null);

  // Seed Configuration State
  const [seedConfig, setSeedConfig] = useState<{ autoSeed: boolean; autoSeedDefault: boolean }>({
    autoSeed: false,
    autoSeedDefault: false,
  });
  const [isLoadingSeedConfig, setIsLoadingSeedConfig] = useState(false);

  // Scheduled Task Definitions State
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinitionType[]>([]);
  const [initialTaskDefinitions, setInitialTaskDefinitions] = useState<TaskDefinition[]>([]);
  const [isLoadingTaskDefs, setIsLoadingTaskDefs] = useState(false);
  const [taskSchedules, setTaskSchedules] = useState<TaskSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingTaskDef, setIsSavingTaskDef] = useState<string | null>(null);
  const [editingTaskDef, setEditingTaskDef] = useState<string | null>(null);
  const [currentEditIntervalParts, setCurrentEditIntervalParts] = useState<IntervalParts>({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });
  const [currentEditTimeout, setCurrentEditTimeout] = useState<number>(0);

  const [apiCacheConfig, setApiCacheConfig] = useState<ApiCacheConfig>({ apiCacheEnabled: true });
  const [isLoadingApiCache, setIsLoadingApiCache] = useState(true);

  // LLM State
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null);
  const [initialLlmSettings, setInitialLlmSettings] = useState<LlmSettings | null>(null);
  const [llmUsage, setLlmUsage] = useState<LlmTokenUsage[]>([]);
  const [isLoadingLlm, setIsLoadingLlm] = useState(true);
  const [isSavingLlm, setIsSavingLlm] = useState(false);
  const [llmApiKeys, setLlmApiKeys] = useState<LlmApiKey[]>([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKeyData, setNewApiKeyData] = useState({ provider: 'anthropic', name: '', key: '' });

  // State moved from AdminPage.tsx
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccessMessage, setRefreshSuccessMessage] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [showEraseDialog, setShowEraseDialog] = useState(false);
  const [erasableCollections, setErasableCollections] = useState<ErasableCollection[]>([
    { id: 'contents', name: 'Contents', collectionName: 'contents' },
    { id: 'feeds', name: 'Feeds', collectionName: 'feed_sources' },
    { id: 'companies', name: 'Companies', collectionName: 'companies' },
    { id: 'tags', name: 'Tags', collectionName: 'tags' },
    { id: 'events', name: 'Events', collectionName: 'events' },
    { id: 'persons', name: 'Persons', collectionName: 'persons' },
    { id: 'firms', name: 'Firms', collectionName: 'firms' },
  ]);
  const [selectedEraseCollections, setSelectedEraseCollections] = useState<ErasableCollectionSelection>({});
  const [eraseProgress, setEraseProgress] = useState<RefreshProgress | null>(null);

  const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
  const [isLoadingCacheStats, setIsLoadingCacheStats] = useState(false);

  // Health Status State
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [isLoadingHealthStatus, setIsLoadingHealthStatus] = useState(false);
  const [healthStatusError, setHealthStatusError] = useState<string | null>(null);
  const [selectedHealthDay, setSelectedHealthDay] = useState(new Date().toISOString().split('T')[0]);

  // Bug Reports State
  const [bugReports, setBugReports] = useState<string[]>([]);
  const [isLoadingBugReports, setIsLoadingBugReports] = useState(false);
  const [bugReportsError, setBugReportsError] = useState<string | null>(null);
  const [showBugReports, setShowBugReports] = useState(false);
  const [bugReportStartDate, setBugReportStartDate] = useState('');
  const [bugReportEndDate, setBugReportEndDate] = useState('');
  const [isDeletingBugReport, setIsDeletingBugReport] = useState<string | null>(null);
  const [isDeletingAllBugReports, setIsDeletingAllBugReports] = useState(false);

  // Computed values
  const isAllEraseSelected = erasableCollections.length > 0 && erasableCollections.every((coll) => selectedEraseCollections[coll.id]);
  const isSomeEraseSelected = Object.values(selectedEraseCollections).some(Boolean);

  const [showTaskDefinitionDialog, setShowTaskDefinitionDialog] = useState(false);
  const [showTaskScheduleDialog, setShowTaskScheduleDialog] = useState(false);
  const [selectedTaskDefinition, setSelectedTaskDefinition] = useState<TaskDefinitionType | null>(null);
  const [selectedTaskSchedule, setSelectedTaskSchedule] = useState<TaskSchedule | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoriesError(null);
    setCategoriesSuccessMessage(null);
    try {
      const fetchedCategories = await configService.getAllowedTagCategories();
      const sortedCategories = fetchedCategories.sort();
      setCategories(sortedCategories);
      setInitialCategories(sortedCategories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategoriesError(err.message || 'Failed to load categories.');
      toast.error(err.message || 'Failed to load categories.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchCannotTrendCategories = useCallback(async () => {
    setIsLoadingCannotTrendCategories(true);
    setCannotTrendCategoriesError(null);
    setCannotTrendCategoriesSuccessMessage(null);
    try {
      const fetchedCategories = await configService.getCannotTrendTagCategories();
      const sortedCategories = fetchedCategories.sort();
      setCannotTrendCategories(sortedCategories);
      setInitialCannotTrendCategories(sortedCategories);
    } catch (err: any) {
      console.error('Error fetching cannot trend categories:', err);
      setCannotTrendCategoriesError(err.message || 'Failed to load cannot trend categories.');
      toast.error(err.message || 'Failed to load cannot trend categories.');
    } finally {
      setIsLoadingCannotTrendCategories(false);
    }
  }, []);

  const fetchGeoBiasSettings = useCallback(async () => {
    setIsLoadingGeoBias(true);
    setGeoBiasError(null);
    setGeoBiasSuccessMessage(null);
    try {
      const fetchedSettings = await configService.getGeographicBiasSettings();
      setGeoBiasSettings(fetchedSettings);
      setInitialGeoBiasSettings(fetchedSettings);
    } catch (err: any) {
      console.error('Error fetching geographic bias settings:', err);
      setGeoBiasError(err.message || 'Failed to load geographic bias settings.');
      toast.error(err.message || 'Failed to load geographic bias settings.');
    } finally {
      setIsLoadingGeoBias(false);
    }
  }, []);

  const fetchSeedConfig = useCallback(async () => {
    setIsLoadingSeedConfig(true);
    try {
      const config = await configService.getSeedConfig();
      setSeedConfig(config);
    } catch (err) {
      toast.error('Failed to load seed configuration');
    } finally {
      setIsLoadingSeedConfig(false);
    }
  }, []);

  // Fetch Task Definitions
  const fetchTaskDefinitions = useCallback(async () => {
    setIsLoadingTaskDefs(true);
    try {
      const fetchedDefs = await configService.getTaskDefinitions();
      console.log('Fetched task definitions in component:', fetchedDefs);
      // Sort by function_path for consistent display
      const sortedDefs = fetchedDefs.sort((a, b) => (a.function_path || '').localeCompare(b.function_path || ''));
      setTaskDefinitions(sortedDefs);
      setInitialTaskDefinitions(JSON.parse(JSON.stringify(sortedDefs))); // Deep copy for change detection
    } catch (err: any) {
      toast.error(err.message || 'Failed to load task definitions.');
    } finally {
      setIsLoadingTaskDefs(false);
    }
  }, []);

  const fetchApiCacheConfig = useCallback(async () => {
    setIsLoadingApiCache(true);
    try {
      const config = await configService.getApiCacheConfig();
      setApiCacheConfig(config);
    } catch (err) {
      toast.error('Failed to load API Cache configuration');
    } finally {
      setIsLoadingApiCache(false);
    }
  }, []);

  const fetchHealthStatus = useCallback(async (day: string) => {
    setIsLoadingHealthStatus(true);
    setHealthStatusError(null);
    try {
      const status = await configService.getHealthStatus(day);
      setHealthStatus(status);
    } catch (err: any) {
      setHealthStatusError(err.message || 'Failed to load health status.');
      toast.error(err.message || 'Failed to load health status.');
    } finally {
      setIsLoadingHealthStatus(false);
    }
  }, []);

  const fetchBugReports = useCallback(async () => {
    setIsLoadingBugReports(true);
    setBugReportsError(null);
    try {
      const reports = await configService.getBugReports(bugReportStartDate, bugReportEndDate);
      setBugReports(reports);
    } catch (err: any) {
      setBugReportsError(err.message || 'Failed to load bug reports.');
      toast.error(err.message || 'Failed to load bug reports.');
    } finally {
      setIsLoadingBugReports(false);
    }
  }, [bugReportStartDate, bugReportEndDate]);

  // LLM Fetch Functions
  const fetchLlmSettings = useCallback(async () => {
    setIsLoadingLlm(true);
    try {
      const settings = await configService.getLlmSettings();
      setLlmSettings(settings);
      setInitialLlmSettings(JSON.parse(JSON.stringify(settings))); // Deep copy for change detection
    } catch (err) {
      toast.error('Failed to load LLM settings');
    } finally {
      setIsLoadingLlm(false);
    }
  }, []);

  const fetchLlmUsage = useCallback(async () => {
    try {
      const usage = await configService.getLlmTokenUsage();
      setLlmUsage(usage);
    } catch (err) {
      toast.error('Failed to load LLM usage data');
    }
  }, []);

  const fetchLlmApiKeys = useCallback(async () => {
    try {
      const keys = await configService.getLlmApiKeys();
      setLlmApiKeys(keys);
    } catch (err) {
      toast.error('Failed to load LLM API keys');
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await api.get<string[]>('/admin/collections');
      const collectionNames = response.data;
      const protectedCollections = ['users', 'config', 'backups', 'app_config', 'sessions', 'tasks_log', 'system.indexes'];
      const toTitleCase = (str: string) => str.replace(/[_-]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
      const collections = collectionNames
        .filter((name) => !protectedCollections.includes(name))
        .map((name) => ({ id: name, collectionName: name, name: toTitleCase(name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setErasableCollections(collections);
      setSelectedEraseCollections(collections.reduce((acc, coll) => {
        acc[coll.id] = true;
        return acc;
      }, {} as ErasableCollectionSelection));
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Failed to load list of collections for erasure.');
    }
  }, []);

  const fetchCacheStats = useCallback(async () => {
    setIsLoadingCacheStats(true);
    try {
      const stats = await configService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      toast.error('Failed to load cache statistics');
    } finally {
      setIsLoadingCacheStats(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCannotTrendCategories();
    fetchGeoBiasSettings();
    fetchTaskDefinitions();
    fetchLlmSettings();
    fetchLlmApiKeys();
    fetchHealthStatus(selectedHealthDay);
    fetchCacheStats();
  }, [fetchCategories, fetchCannotTrendCategories, fetchGeoBiasSettings, fetchTaskDefinitions, fetchLlmSettings, fetchLlmApiKeys, fetchHealthStatus, fetchCacheStats, selectedHealthDay]);

  // Load task definitions and schedules
  const loadTaskData = async () => {
    try {
      setIsLoadingTaskDefs(true);
      
      const [definitions, schedules] = await Promise.all([
        taskService.getTaskDefinitions(),
        taskService.getTaskSchedules()
      ]);
      
      setTaskDefinitions(definitions);
      setTaskSchedules(schedules);
    } catch (error) {
      toast.error('Failed to load task data');
      console.error('Error loading task data:', error);
    } finally {
      setIsLoadingTaskDefs(false);
    }
  };

  useEffect(() => {
    loadTaskData();
  }, []);

  // Tag Category Handlers
  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim().toLowerCase();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCategories([...categories, trimmedCategory].sort());
      setNewCategory('');
      setCategoriesSuccessMessage(null);
      setCategoriesError(null);
    } else if (categories.includes(trimmedCategory)) {
      toast.warning(`Category "${trimmedCategory}" already exists.`);
    } else if (!trimmedCategory) {
      toast.warning('Category name cannot be empty.');
    }
  };

  const handleRemoveCategory = (categoryToRemove: TagCategory) => {
    if (categories.length <= 1) {
      toast.error('Cannot remove the last category. At least one category must remain.');
      return;
    }
    setCategories(categories.filter((cat) => cat !== categoryToRemove).sort());
    setCategoriesSuccessMessage(null);
    setCategoriesError(null);
  };

  const handleSaveCategories = async () => {
    setIsSavingCategories(true);
    setCategoriesError(null);
    setCategoriesSuccessMessage(null);
    try {
      const savedCategories = await configService.updateAllowedTagCategories(categories);
      setCategories(savedCategories.sort());
      setInitialCategories(savedCategories.sort());
      setCategoriesSuccessMessage('Categories updated successfully!');
      toast.success('Tag categories updated successfully!');
    } catch (err: any) {
      console.error('Error saving categories:', err);
      setCategoriesError(err.message || 'Failed to save categories.');
      toast.error(err.message || 'Failed to save categories.');
    } finally {
      setIsSavingCategories(false);
    }
  };
  const hasCategoryChanges = JSON.stringify(categories) !== JSON.stringify(initialCategories);

  // Cannot Trend Tag Category Handlers
  const handleAddCannotTrendCategory = () => {
    const trimmedCategory = newCannotTrendCategory.trim().toLowerCase();
    if (trimmedCategory && !cannotTrendCategories.includes(trimmedCategory)) {
      // Check if the category exists in allowed categories
      if (!categories.includes(trimmedCategory)) {
        toast.error(`Category "${trimmedCategory}" must first be added to allowed categories.`);
        return;
      }
      setCannotTrendCategories([...cannotTrendCategories, trimmedCategory].sort());
      setNewCannotTrendCategory('');
      setCannotTrendCategoriesSuccessMessage(null);
      setCannotTrendCategoriesError(null);
    } else if (cannotTrendCategories.includes(trimmedCategory)) {
      toast.warning(`Category "${trimmedCategory}" is already in the cannot trend list.`);
    } else if (!trimmedCategory) {
      toast.warning('Category name cannot be empty.');
    }
  };

  const handleRemoveCannotTrendCategory = (categoryToRemove: TagCategory) => {
    setCannotTrendCategories(cannotTrendCategories.filter((cat) => cat !== categoryToRemove).sort());
    setCannotTrendCategoriesSuccessMessage(null);
    setCannotTrendCategoriesError(null);
  };

  const handleSaveCannotTrendCategories = async () => {
    setIsSavingCannotTrendCategories(true);
    setCannotTrendCategoriesError(null);
    setCannotTrendCategoriesSuccessMessage(null);
    try {
      const savedCategories = await configService.updateCannotTrendTagCategories(cannotTrendCategories);
      setCannotTrendCategories(savedCategories.sort());
      setInitialCannotTrendCategories(savedCategories.sort());
      setCannotTrendCategoriesSuccessMessage('Cannot trend categories updated successfully!');
      toast.success('Cannot trend categories updated successfully!');
    } catch (err: any) {
      console.error('Error saving cannot trend categories:', err);
      setCannotTrendCategoriesError(err.message || 'Failed to save cannot trend categories.');
      toast.error(err.message || 'Failed to save cannot trend categories.');
    } finally {
      setIsSavingCannotTrendCategories(false);
    }
  };
  const hasCannotTrendCategoryChanges = JSON.stringify(cannotTrendCategories) !== JSON.stringify(initialCannotTrendCategories);

  // Geographic Bias Handlers
  const handleGeoBiasChange = (field: keyof GeographicBiasSettings, value: any) => {
    setGeoBiasSettings((prev) => ({ ...prev, [field]: value }));
    setGeoBiasSuccessMessage(null);
    setGeoBiasError(null);
  };

  const handleSaveGeoBias = async () => {
    if (!geoBiasSettings.defaultCountryTag.trim()) {
      setGeoBiasError('Default Country Tag cannot be empty.');
      toast.error('Default Country Tag cannot be empty.');
      return;
    }
    setIsSavingGeoBias(true);
    setGeoBiasError(null);
    setGeoBiasSuccessMessage(null);
    try {
      // Ensure defaultCountryTag is lowercase before sending
      const settingsToSave = {
        ...geoBiasSettings,
        defaultCountryTag: geoBiasSettings.defaultCountryTag.trim().toLowerCase(),
      };
      const updatedSettings = await configService.updateGeographicBiasSettings(settingsToSave);
      setGeoBiasSettings(updatedSettings);
      setInitialGeoBiasSettings(updatedSettings);
      setGeoBiasSuccessMessage('Geographic bias settings updated successfully!');
      toast.success('Geographic bias settings updated successfully!');
    } catch (err: any) {
      console.error('Error saving geographic bias settings:', err);
      setGeoBiasError(err.message || 'Failed to save geographic bias settings.');
      toast.error(err.message || 'Failed to save geographic bias settings.');
    } finally {
      setIsSavingGeoBias(false);
    }
  };
  const hasGeoBiasChanges = JSON.stringify(geoBiasSettings) !== JSON.stringify(initialGeoBiasSettings);

  // Scheduled Task Definition Handlers
  const handleTaskDefEnabledChange = async (taskName: string, newEnabledState: boolean) => {
    setIsSavingTaskDef(taskName);
    try {
      const updatedDef = await configService.updateTaskDefinition(taskName, { enabled: newEnabledState });
      setTaskDefinitions((prevDefs) => prevDefs.map((def) => (def.function_path === taskName ? { ...def, ...updatedDef } : def)));
      setInitialTaskDefinitions((prevDefs) => prevDefs.map((def) => (def.function_path === taskName ? { ...def, ...updatedDef } : def)));
      toast.success(`Task definition "${taskName}" ${newEnabledState ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      toast.error(err.message || `Failed to update "${taskName}".`);
      // Revert UI change on error
      setTaskDefinitions((prevDefs) => prevDefs.map((def) => (def.function_path === taskName ? { ...def, enabled: !newEnabledState } : def)));
    } finally {
      setIsSavingTaskDef(null);
    }
  };

  const handleSaveTaskDefChanges = async (taskName: string) => {
    const newIntervalNum = partsToSeconds(currentEditIntervalParts);
    const newTimeoutNum = Number(currentEditTimeout); // Ensure it's a number

    if (isNaN(newIntervalNum) || newIntervalNum <= 0) {
      toast.error('Interval must result in a positive number of total seconds.');
      return;
    }
    if (Object.values(currentEditIntervalParts).some((val) => val < 0)) {
      toast.error('Days, hours, minutes, and seconds cannot be negative.');
      return;
    }
    if (isNaN(newTimeoutNum) || newTimeoutNum < 0) {
      toast.error('Timeout must be a non-negative number (0 to disable).');
      return;
    }

    setIsSavingTaskDef(taskName);
    try {
      const payload: Partial<Pick<TaskDefinition, 'interval_seconds' | 'timeout_seconds'>> = {
        interval_seconds: newIntervalNum,
        timeout_seconds: newTimeoutNum,
      };

      const updatedDef = await configService.updateTaskDefinition(taskName, payload);
      setTaskDefinitions((prevDefs) => prevDefs.map((def) => (def.function_path === taskName ? { ...def, ...updatedDef } : def)));
      setInitialTaskDefinitions((prevDefs) => // Also update initial state for change detection
        prevDefs.map((def) => (def.function_path === taskName ? { ...def, ...updatedDef } : def)));
      toast.success(`Settings for "${taskName}" updated.`);
      setEditingTaskDef(null);
      setCurrentEditIntervalParts({
        days: 0, hours: 0, minutes: 0, seconds: 0,
      });
      setCurrentEditTimeout(0);
    } catch (err: any) {
      toast.error(err.message || `Failed to update settings for "${taskName}".`);
    } finally {
      setIsSavingTaskDef(null);
    }
  };

  const handleIntervalPartChange = (part: keyof IntervalParts, value: string) => {
    const numValue = parseInt(value, 10);
    setCurrentEditIntervalParts((prev) => ({
      ...prev,
      [part]: isNaN(numValue) ? 0 : Math.max(0, numValue), // Ensure non-negative, default to 0 if NaN
    }));
  };

  const formatDateTimeDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Reset Config Handler
  const handleResetConfig = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to reset ALL configuration settings to their default values? This action is irreversible and will affect Tag Categories, Geographic Bias, and Scheduled Tasks.',
    );

    if (isConfirmed) {
      const promise = configService.resetConfigToDefault();
      toast.promise(promise, {
        loading: 'Resetting configuration...',
        success: (data) => {
          // Refetch all data to update the UI
          fetchCategories();
          fetchCannotTrendCategories();
          fetchGeoBiasSettings();
          fetchSeedConfig();
          fetchTaskDefinitions();
          return data.message || 'Configuration reset successfully!';
        },
        error: (err: any) => err.message || 'Failed to reset configuration.',
      });
    }
  };

  // Handlers for Refresh and Erase
  const handleRefreshContent = async () => {
    if (!window.confirm('Are you sure you want to refresh all content? This will re-fetch contents from all feed sources.')) {
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccessMessage(null);

    try {
      const response = await api.post<RefreshResponse>('/refetch_content');
      const result = response.data;
      setRefreshSuccessMessage(result.message || 'Content refresh initiated successfully. Monitoring progress...');
    } catch (error: any) {
      console.error('Error refreshing content:', error);
      const errorMsg = error.response?.data?.error || error.message || 'An unexpected error occurred during refresh.';
      setRefreshError(errorMsg);
      setIsRefreshing(false);
    }
  };

  const handleEraseContent = async () => {
    if (!window.confirm('DANGER: This will PERMANENTLY DELETE ALL CONTENT from the selected collections!\n\n'
          + 'Backups will remain intact.\n\n'
          + 'Are you absolutely sure?')) return;

    setIsErasing(true);
    const collectionsToErase = erasableCollections.filter((coll) => selectedEraseCollections[coll.id])
      .map((coll) => coll.collectionName);

    if (collectionsToErase.length === 0) {
      toast.info('No collections selected for erasure.');
      setIsErasing(false);
      setShowEraseDialog(false);
      return;
    }

    try {
      const response = await api.post<{ message: string, summary: any }>('/admin/erase_content', { collections_to_erase: collectionsToErase });
      toast.success(response.data.message || 'Content erased successfully.');
      console.log('Erase summary:', response.data.summary);
      setShowEraseDialog(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Content erase failed';
      if (error.response?.status === 403) {
        toast.error('Your admin privileges have changed - please re-login');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsErasing(false);
    }
  };

  const toggleSelectAllErase = (checked: boolean) => {
    setSelectedEraseCollections(
      erasableCollections.reduce((acc, coll) => {
        acc[coll.id] = checked;
        return acc;
      }, {} as ErasableCollectionSelection),
    );
  };

  // LLM Handlers
  const handleSaveLlmSettings = async () => {
    if (!llmSettings) return;
    setIsSavingLlm(true);
    const promise = configService.updateLlmSettings({
      defaultModel: llmSettings.defaultModel,
      operationModels: llmSettings.operationModels,
    });
    toast.promise(promise, {
      loading: 'Saving LLM settings...',
      success: (updatedSettings) => {
        setLlmSettings(updatedSettings);
        setInitialLlmSettings(JSON.parse(JSON.stringify(updatedSettings)));
        setIsSavingLlm(false);
        return 'LLM settings updated successfully!';
      },
      error: (err: any) => {
        setIsSavingLlm(false);
        return err.message || 'Failed to save LLM settings.';
      },
    });
  };

  const handleDefaultModelChange = (modelIdentifier: string) => {
    if (!llmSettings) return;
    const [provider, model_name] = modelIdentifier.split('::');
    setLlmSettings((prev) => (prev ? { ...prev, defaultModel: { provider, model_name } } : null));
  };

  const handleOperationModelChange = (operation: string, modelIdentifier: string) => {
    if (!llmSettings) return;
    const [provider, model_name] = modelIdentifier.split('::');
    setLlmSettings((prev) => {
      if (!prev) return null;
      const newOperationModels = { ...prev.operationModels, [operation]: { provider, model_name } };
      return { ...prev, operationModels: newOperationModels };
    });
  };

  const hasLlmSettingsChanges = JSON.stringify(llmSettings) !== JSON.stringify(initialLlmSettings);

  const titleCase = (str: string) => str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  const handleAddNewApiKey = () => {
    if (!newApiKeyData.name.trim() || !newApiKeyData.key.trim()) {
      toast.error('Key Name and API Key fields cannot be empty.');
      return;
    }
    const promise = configService.addLlmApiKey(newApiKeyData);
    toast.promise(promise, {
      loading: 'Adding API Key...',
      success: (updatedKeys) => {
        setLlmApiKeys(updatedKeys);
        setShowApiKeyDialog(false);
        setNewApiKeyData({ provider: 'anthropic', name: '', key: '' });
        return 'API Key added successfully!';
      },
      error: (err: any) => err.message || 'Failed to add API Key.',
    });
  };

  const handleSetDefaultApiKey = (keyId: string) => {
    const promise = configService.setLlmApiKeyAsDefault(keyId);
    toast.promise(promise, {
      loading: 'Setting default key...',
      success: (updatedKeys) => {
        setLlmApiKeys(updatedKeys);
        return 'Default key updated successfully!';
      },
      error: (err: any) => err.message || 'Failed to set default key.',
    });
  };

  const handleDeleteApiKey = (keyId: string, keyName: string) => {
    if (window.confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      const promise = configService.deleteLlmApiKey(keyId);
      toast.promise(promise, {
        loading: 'Deleting API Key...',
        success: (updatedKeys) => {
          setLlmApiKeys(updatedKeys);
          return 'API Key deleted successfully!';
        },
        error: (err: any) => err.message || 'Failed to delete API Key.',
      });
    }
  };

  const handleHealthDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedHealthDay(e.target.value);
    fetchHealthStatus(e.target.value);
  };

  const handleDownloadBugReport = (filename: string) => {
    try {
      const url = configService.getBugReportDownloadUrl(filename);
      const token = localStorage.getItem('token');

      // Use fetch to get the file with auth headers
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok.');
          }
          return response.blob();
        })
        .then((blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
          toast.success(`Downloading ${filename}...`);
        })
        .catch((err) => {
          console.error('Download error:', err);
          toast.error('Failed to download bug report.');
        });
    } catch (error) {
      console.error('Error initiating download:', error);
      toast.error('Failed to download bug report.');
    }
  };

  const handleDeleteBugReport = async (filename: string) => {
    setIsDeletingBugReport(filename);
    try {
      await configService.deleteBugReport(filename);
      toast.success(`Bug report ${filename} deleted.`);
      fetchBugReports(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || `Failed to delete ${filename}.`);
    } finally {
      setIsDeletingBugReport(null);
    }
  };

  const handleDeleteAllBugReports = async () => {
    setIsDeletingAllBugReports(true);
    try {
      await configService.deleteAllBugReports(bugReportStartDate, bugReportEndDate);
      toast.success('Bug reports deleted.');
      fetchBugReports(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bug reports.');
    } finally {
      setIsDeletingAllBugReports(false);
    }
  };

  const renderHealthTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let statusText = 'Unknown';
      switch (data.status) {
        case 2: statusText = 'Healthy'; break;
        case 1: statusText = 'Assumed Healthy'; break;
        case 0: statusText = 'Unhealthy'; break;
      }
      return (
        <div className="bg-background border p-2 rounded shadow-lg">
          <p className="font-bold">{label}</p>
          <p>
            Status:
            {statusText}
          </p>
          {data.details && (
          <p className="text-xs text-muted-foreground max-w-xs break-words">
            Details:
            {data.details}
          </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleClearApiCache = async () => {
    if (window.confirm('Are you sure you want to clear the entire API cache? This may temporarily slow down the application for all users.')) {
      const promise = configService.clearApiCache();
      toast.promise(promise, {
        loading: 'Clearing API cache...',
        success: (data) => {
          fetchCacheStats(); // Re-fetch stats after clearing
          return data.message || 'API Cache cleared successfully!';
        },
        error: (err: any) => err.message || 'Failed to clear API cache.',
      });
    }
  };

  const formattedHealthData = healthStatus.map((s) => {
    let numericStatus;
    switch (s.status) {
      case 'HEALTHY':
        numericStatus = 2;
        break;
      case 'ASSUMED_HEALTHY':
        numericStatus = 1;
        break;
      case 'UNHEALTHY':
        numericStatus = 0;
        break;
      default:
        numericStatus = -1;
    }
    return {
      time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: numericStatus,
      details: s.details,
    };
  });

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await taskService.updateTaskSchedule(id, { enabled });
      loadTaskData();
    } catch (error) {
      toast.error('Failed to toggle schedule');
    }
  };

  // Task Definitions handlers
  const handleCreateTaskDefinition = () => {
    setSelectedTaskDefinition(null);
    setShowTaskDefinitionDialog(true);
  };

  const handleEditTaskDefinition = (definition: TaskDefinitionType) => {
    setSelectedTaskDefinition(definition);
    setShowTaskDefinitionDialog(true);
  };

  const handleDeleteTaskDefinition = async (id: string) => {
    try {
      await taskService.deleteTaskDefinition(id);
      toast.success('Task definition deleted successfully');
      loadTaskData();
    } catch (error) {
      toast.error('Failed to delete task definition');
    }
  };

  const handleSaveTaskDefinition = async (definition: Partial<TaskDefinitionType>) => {
    try {
      if (selectedTaskDefinition) {
        await taskService.updateTaskDefinition(selectedTaskDefinition._id, definition);
        toast.success('Task definition updated successfully');
      } else {
        await taskService.createTaskDefinition(definition);
        toast.success('Task definition created successfully');
      }
      setShowTaskDefinitionDialog(false);
      loadTaskData();
    } catch (error) {
      toast.error('Failed to save task definition');
    }
  };

  // Task Schedules handlers
  const handleCreateTaskSchedule = () => {
    setSelectedTaskSchedule(null);
    setShowTaskScheduleDialog(true);
  };

  const handleEditTaskSchedule = (schedule: TaskSchedule) => {
    setSelectedTaskSchedule(schedule);
    setShowTaskScheduleDialog(true);
  };

  const handleDeleteTaskSchedule = async (id: string) => {
    try {
      await taskService.deleteTaskSchedule(id);
      toast.success('Task schedule deleted successfully');
      loadTaskData();
    } catch (error) {
      toast.error('Failed to delete task schedule');
    }
  };

  const handleSaveTaskSchedule = async (schedule: Partial<TaskSchedule>) => {
    try {
      if (selectedTaskSchedule) {
        await taskService.updateTaskSchedule(selectedTaskSchedule._id, schedule);
        toast.success('Task schedule updated successfully');
      } else {
        await taskService.createTaskSchedule(schedule);
        toast.success('Task schedule created successfully');
      }
      setShowTaskScheduleDialog(false);
      loadTaskData();
    } catch (error) {
      toast.error('Failed to save task schedule');
    }
  };

  return (
    <TabContent
      title="System Configuration"
      description="Manage system settings, categories, and configurations."
      icon={<Settings className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-6">
        {/* --- ADDED: Danger Zone Section --- */}
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400/80">
              Destructive actions that will revert settings or clear data. Use with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={handleResetConfig}
            >
              Reset All Config to Default
            </Button>
            <Button
              onClick={handleRefreshContent}
              disabled={isRefreshing}
              variant="destructive"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                                </>
              ) : (
                <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Content
                              </>
              )}
            </Button>
            <Button
              onClick={() => setShowEraseDialog(true)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Erase Content
            </Button>
          </CardContent>
        </Card>

        {refreshError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{refreshError}</AlertDescription>
        </Alert>
        )}

        {refreshSuccessMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{refreshSuccessMessage}</AlertDescription>
        </Alert>
        )}

        {/* Tag Categories Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              Allowed Tag Categories
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure which tag categories are allowed in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriesError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{categoriesError}</AlertDescription>
            </Alert>
            )}

            {categoriesSuccessMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{categoriesSuccessMessage}</AlertDescription>
            </Alert>
            )}

            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                className="border-border bg-background"
                onKeyDown={(e) => { if (e.key === 'Enter') { handleAddCategory(); e.preventDefault(); } }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || isSavingCategories}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="secondary" className="bg-muted text-foreground">
                  {category}
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                </Badge>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveCategories}
                disabled={isSavingCategories || !hasCategoryChanges}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSavingCategories ? (
                  <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cannot Trend Tag Categories Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Star className="h-5 w-5 mr-2 text-primary" />
              Cannot Trend Tag Categories
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure which tag categories should be ignored by the trending mechanism.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cannotTrendCategoriesError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{cannotTrendCategoriesError}</AlertDescription>
            </Alert>
            )}

            {cannotTrendCategoriesSuccessMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{cannotTrendCategoriesSuccessMessage}</AlertDescription>
            </Alert>
            )}

            <div className="flex gap-2">
              <Input
                value={newCannotTrendCategory}
                onChange={(e) => setNewCannotTrendCategory(e.target.value)}
                placeholder="Enter category to exclude from trends"
                className="border-border bg-background"
                onKeyDown={(e) => { if (e.key === 'Enter') { handleAddCannotTrendCategory(); e.preventDefault(); } }}
              />
              <Button
                onClick={handleAddCannotTrendCategory}
                disabled={!newCannotTrendCategory.trim() || isSavingCannotTrendCategories}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {cannotTrendCategories.map((category) => (
                <Badge key={category} variant="secondary" className="bg-muted text-foreground">
                  {category}
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCannotTrendCategory(category)}
                      className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                </Badge>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveCannotTrendCategories}
                disabled={isSavingCannotTrendCategories || !hasCannotTrendCategoryChanges}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSavingCannotTrendCategories ? (
                  <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Bias Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Geographic Bias Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure geographic bias for content recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {geoBiasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{geoBiasError}</AlertDescription>
            </Alert>
            )}

            {geoBiasSuccessMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{geoBiasSuccessMessage}</AlertDescription>
            </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="geo-bias-enabled" className="text-sm font-medium text-foreground">
                  Enable Geographic Bias
                                </Label>
                <Switch
                  id="geo-bias-enabled"
                  checked={geoBiasSettings.enableGeographicBias}
                  onCheckedChange={(checked) => handleGeoBiasChange('enableGeographicBias', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detect" className="text-sm font-medium text-foreground">
                  Auto-detect Location
                                </Label>
                <Switch
                  id="auto-detect"
                  checked={geoBiasSettings.autoDetectLocation}
                  onCheckedChange={(checked) => handleGeoBiasChange('autoDetectLocation', checked)}
                  disabled={!geoBiasSettings.enableGeographicBias}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-country" className="text-sm font-medium text-foreground">
                  Default Country Tag
                                </Label>
                <Input
                  id="default-country"
                  value={geoBiasSettings.defaultCountryTag}
                  onChange={(e) => handleGeoBiasChange('defaultCountryTag', e.target.value)}
                  className="border-border bg-background"
                  disabled={!geoBiasSettings.enableGeographicBias}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveGeoBias}
                disabled={isSavingGeoBias || !hasGeoBiasChanges}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSavingGeoBias ? (
                  <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Seed Configuration Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Database Seed Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure database seeding behavior for development and staging environments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSeedConfig ? (
              <div className="flex justify-center items-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seed-at-startup" className="text-sm font-medium text-foreground">
                    Seed Database at Startup
                  </Label>
                  <Switch
                    id="seed-at-startup"
                    checked={seedConfig.autoSeed}
                    onCheckedChange={async (checked) => {
                      try {
                        const updated = await configService.updateSeedConfig(checked);
                        setSeedConfig(updated);
                        toast.success('Seed configuration updated');
                      } catch (err) {
                        toast.error('Failed to update seed configuration');
                      }
                    }}
                    disabled={isLoadingSeedConfig}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Default seed behavior: {seedConfig.autoSeedDefault ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Seeding will reset default content. Use only in development/staging environments.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Cache Configuration Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              API Cache Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage API response caching to improve performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingApiCache ? (
              <p>Loading cache settings...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="api-cache-enabled" className="text-sm font-medium text-foreground">
                        Enable API Caching
                              </Label>
                    <Switch
                        id="api-cache-enabled"
                        checked={apiCacheConfig.apiCacheEnabled}
                        onCheckedChange={async (checked) => {
                            try {
                              setApiCacheConfig({ apiCacheEnabled: checked }); // Optimistic update
                              const updated = await configService.updateApiCacheConfig(checked);
                              setApiCacheConfig(updated);
                              toast.success(`API Caching ${checked ? 'enabled' : 'disabled'}`);
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to update API cache configuration');
                              setApiCacheConfig({ apiCacheEnabled: !checked }); // Revert on error
                            }
                          }}
                      />
                  </div>
                <Button
                    variant="outline"
                    onClick={handleClearApiCache}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear API Cache Now
                            </Button>

                <div className="mt-6">
                    <h4 className="text-md font-medium mb-2">Cache Performance (Last 24 Hours)</h4>
                    {isLoadingCacheStats ? (
                        <div className="flex justify-center items-center py-4">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                      ) : cacheStats ? (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Cache Hits</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">
                                            {cacheStats.overall_stats.reduce((sum, stat) => sum + (stat.cache_hits || 0), 0).toLocaleString()}
                                          </div>
                                      </CardContent>
                                    </Card>
                                  <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Cache Misses</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">
                                            {cacheStats.overall_stats.reduce((sum, stat) => sum + (stat.cache_misses || 0), 0).toLocaleString()}
                                          </div>
                                      </CardContent>
                                    </Card>
                                </div>
                              <div className="h-[200px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={cacheStats.overall_stats}>
                                        <XAxis
                                            dataKey="hour"
                                            tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            labelFormatter={(value) => new Date(value).toLocaleString()}
                                            formatter={(value: number) => [value.toLocaleString(), '']}
                                          />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="cache_hits"
                                            stroke="#22c55e"
                                            name="Cache Hits"
                                            strokeWidth={2}
                                          />
                                        <Line
                                            type="monotone"
                                            dataKey="cache_misses"
                                            stroke="#ef4444"
                                            name="Cache Misses"
                                            strokeWidth={2}
                                          />
                                      </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                      ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                              No cache statistics available.
                                </p>
                      )}
                  </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LLM Configuration Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
              AI Model Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure AI model settings and API keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingLlm ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : llmSettings ? (
              <>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="default-model" className="text-sm font-medium text-foreground">
                            Default Model
                                </Label>
                        <Select
                            value={llmSettings?.defaultModel ? `${llmSettings.defaultModel.provider}::${llmSettings.defaultModel.model_name}` : ''}
                            onValueChange={handleDefaultModelChange}
                          >
                            <SelectTrigger id="default-model" className="border-border bg-background">
                                <SelectValue placeholder="Select default model" />
                              </SelectTrigger>
                            <SelectContent>
                                {llmSettings?.availableModels?.map((model) => (
                                    <SelectItem key={`${model.provider}-${model.model_name}`} value={`${model.provider}::${model.model_name}`}>
                                        {model.displayName}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>

                    <div className="space-y-4">
                        <h4 className="text-md font-medium">Operation-Specific Models</h4>
                        <div className="border rounded-lg p-4 space-y-4">
                            {Object.entries(llmSettings.operationModels).map(([operation, model]) => (
                                <div key={operation} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                                    <Label htmlFor={`op-select-${operation}`}>{titleCase(operation)}</Label>
                                    <Select
                                        value={`${model.provider}::${model.model_name}`}
                                        onValueChange={(newValue) => handleOperationModelChange(operation, newValue)}
                                      >
                                        <SelectTrigger id={`op-select-${operation}`}>
                                          <SelectValue placeholder="Select a model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {llmSettings.availableModels.map((m) => (
                                              <SelectItem key={`${m.provider}-${m.model_name}`} value={`${m.provider}::${m.model_name}`}>
                                                  {m.displayName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSaveLlmSettings}
                        disabled={isSavingLlm || !hasLlmSettingsChanges}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isSavingLlm ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                                  </>
                          ) : (
                              <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                  </>
                          )}
                      </Button>
                  </div>
              </>
            ) : <p className="text-destructive">Could not load LLM settings.</p>}
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <KeyRound className="h-5 w-5 mr-2 text-primary" />
              API Keys
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage API keys for AI model providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-sm font-medium text-foreground">Provider</TableHead>
                  <TableHead className="text-sm font-medium text-foreground">Name</TableHead>
                  <TableHead className="text-sm font-medium text-foreground">Key</TableHead>
                  <TableHead className="text-sm font-medium text-foreground">Status</TableHead>
                  <TableHead className="text-sm font-medium text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {llmApiKeys.length > 0 ? (
                  llmApiKeys.map((key) => (
                      <TableRow key={key.id} className="border-border">
                          <TableCell className="capitalize text-foreground">{key.provider}</TableCell>
                          <TableCell className="font-medium text-foreground">{key.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{key.key}</TableCell>
                          <TableCell>
                              {key.isDefault && (
                                <Badge variant="default" className="bg-primary hover:bg-primary/90">
                                      <Check size={14} className="mr-1" />
                                      Default
                                    </Badge>
                                )}
                            </TableCell>
                          <TableCell className="text-right space-x-1">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSetDefaultApiKey(key.id)}
                                  disabled={key.isDefault}
                                  className="border-border bg-background hover:bg-muted"
                                >
                                                  Set as Default
                                </Button>
                              <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteApiKey(key.id, key.name)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  <Trash2 size={16} />
                                </Button>
                            </TableCell>
                        </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No API keys configured. Add one to get started.
                                    </TableCell>
                      </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowApiKeyDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus size={16} className="mr-2" />
                Add New API Key
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Today's AI Model Usage
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Token usage statistics for all models for the current day (UTC).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {llmUsage.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                      <TableHead className="text-sm font-medium text-foreground">Model</TableHead>
                      <TableHead className="text-sm font-medium text-foreground">Provider</TableHead>
                      <TableHead className="text-sm font-medium text-foreground">API Key</TableHead>
                      <TableHead className="text-sm font-medium text-foreground text-right">Input Tokens</TableHead>
                      <TableHead className="text-sm font-medium text-foreground text-right">Output Tokens</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {llmUsage.map((usage) => {
                      const apiKeyName = llmApiKeys.find((k) => k.id === usage.api_key_id)?.name || 'Unknown/Default';
                      return (
                          <TableRow key={`${usage.provider}-${usage.model_name}-${usage.api_key_id}`} className="border-border">
                              <TableCell className="font-medium text-foreground">{usage.displayName}</TableCell>
                              <TableCell className="capitalize text-foreground">{usage.provider}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{apiKeyName}</TableCell>
                              <TableCell className="text-right text-foreground">{usage.input_tokens.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-foreground">{usage.output_tokens.toLocaleString()}</TableCell>
                            </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No token usage recorded for today yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Health Status Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
              <Server className="mr-2" />
              {' '}
              Backend Health Status
            </CardTitle>
            <CardDescription>
              Monitor the backend server health over time. Data is collected periodically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Label htmlFor="health-day">Select Day:</Label>
              <Input
                type="date"
                id="health-day"
                value={selectedHealthDay}
                onChange={handleHealthDayChange}
                className="w-auto"
              />
            </div>
            {isLoadingHealthStatus ? (
              <p>Loading health status...</p>
            ) : healthStatusError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{healthStatusError}</AlertDescription>
              </Alert>
            ) : healthStatus.length === 0 ? (
              <p>No health data available for this day.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedHealthData}>
                    <XAxis dataKey="time" />
                    <YAxis
                        domain={[-1, 2]}
                        ticks={[0, 1, 2]}
                        tickFormatter={(value) => {
                            if (value === 0) return 'Unhealthy';
                            if (value === 1) return 'Assumed Healthy';
                            if (value === 2) return 'Healthy';
                            return '';
                          }}
                      />
                    <Tooltip content={renderHealthTooltip} />
                    <Legend />
                    <Line type="step" dataKey="status" stroke="#8884d8" name="Health" dot={false} />
                  </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bug Reports Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <History className="mr-2" />
                <CardTitle>Bug Reports</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowBugReports(!showBugReports)}>
                {showBugReports ? 'Hide' : 'Show'}
              </Button>
            </div>
            <CardDescription>
              View and manage bug reports generated by the system.
            </CardDescription>
          </CardHeader>
          {showBugReports && (
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={bugReportStartDate}
                    onChange={(e) => setBugReportStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={bugReportEndDate}
                    onChange={(e) => setBugReportEndDate(e.target.value)}
                  />
                </div>
                <Button onClick={fetchBugReports} className="self-end" disabled={isLoadingBugReports}>
                  {isLoadingBugReports ? 'Loading...' : 'Filter'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="self-end" disabled={isDeletingAllBugReports || bugReports.length === 0}>
                          {isDeletingAllBugReports ? 'Deleting...' : 'Delete All'}
                        </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all
                                {bugReportStartDate || bugReportEndDate ? ' filtered' : ''}
                            {' '}
                            bug reports.
                              </AlertDialogDescription>
                        </AlertDialogHeader>
                    <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAllBugReports}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {isLoadingBugReports ? (
                <p>Loading bug reports...</p>
              ) : bugReportsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{bugReportsError}</AlertDescription>
                </Alert>
              ) : bugReports.length > 0 ? (
                <Table>
                  <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                  <TableBody>
                        {bugReports.map((report) => (
                          <TableRow key={report}>
                                <TableCell className="font-medium">{report}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" onClick={() => handleDownloadBugReport(report)} className="mr-2">
                                          Download
                                        </Button>
                                  <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={isDeletingBugReport === report}>
                                              {isDeletingBugReport === report ? 'Deleting...' : 'Delete'}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete the bug report: <strong>{report}</strong>
                                                  .
</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteBugReport(report)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                </TableCell>
                              </TableRow>
                        ))}
                      </TableBody>
                </Table>
              ) : (
                <p>No bug reports found.</p>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Task Definitions Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Task Definitions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage task definitions that define what tasks are available in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTaskDefs ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Available Task Definitions</h3>
                <Button
                  onClick={handleCreateTaskDefinition}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task Definition
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function Path</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Timeout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskDefinitions.length > 0 ? (
                    taskDefinitions.map((definition) => (
                      <TableRow key={definition._id || definition.function_path}>
                        <TableCell className="font-medium">{definition.function_path}</TableCell>
                        <TableCell>{definition.description}</TableCell>
                        <TableCell>
                          <Badge variant={definition.task_type === 'internal' ? 'default' : 'secondary'}>
                            {definition.task_type || 'internal'}
                          </Badge>
                        </TableCell>
                        <TableCell>{definition.timeout_seconds}s</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTaskDefinition(definition as any)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task Definition</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the task definition "{definition.function_path}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTaskDefinition(definition._id || '')}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No task definitions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Schedules Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-display font-bold text-foreground flex items-center">
            <History className="h-5 w-5 mr-2 text-primary" />
            Task Schedules
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage when and how often tasks should run automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Scheduled Tasks</h3>
                <Button
                  onClick={handleCreateTaskSchedule}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskSchedules.length > 0 ? (
                    taskSchedules.map((schedule) => (
                      <TableRow key={schedule._id}>
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>{schedule.function_path || 'Unknown'}</TableCell>
                        <TableCell>
                          {schedule.is_periodic ? `${schedule.interval_seconds}s` : 'One-time'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={schedule.enabled}
                              onCheckedChange={(enabled) => handleToggleSchedule(schedule._id, enabled)}
                            />
                            <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                              {schedule.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {schedule.next_run_at ? formatDateTimeDisplay(schedule.next_run_at) : 'Not scheduled'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTaskSchedule(schedule)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task Schedule</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the schedule "{schedule.name}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTaskSchedule(schedule._id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No task schedules found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Enter the details for the new API key. The key will be stored securely on the server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-provider" className="text-sm font-medium text-foreground">Provider</Label>
              <Select
                value={newApiKeyData.provider}
                onValueChange={(value) => setNewApiKeyData((prev) => ({ ...prev, provider: value }))}
              >
                <SelectTrigger id="key-provider" className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="awan_llm">AwanLLM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-name" className="text-sm font-medium text-foreground">Descriptive Name</Label>
              <Input
                id="key-name"
                value={newApiKeyData.name}
                onChange={(e) => setNewApiKeyData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Project Main Key"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-value" className="text-sm font-medium text-foreground">API Key</Label>
              <Input
                id="key-value"
                value={newApiKeyData.key}
                onChange={(e) => setNewApiKeyData((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="sk-..."
                className="border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-border bg-background hover:bg-muted">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddNewApiKey}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEraseDialog} onOpenChange={setShowEraseDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Erase Content from Collections</DialogTitle>
            <DialogDescription>
              Select the collections you want to permanently erase content from. This action cannot be undone.
              System critical collections like users, config, and backups are protected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2 mb-2 p-2 border-b border-border">
              <Checkbox
                id="select-all-erase"
                checked={isAllEraseSelected}
                onCheckedChange={(checked) => toggleSelectAllErase(Boolean(checked))}
                className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              />
              <Label htmlFor="select-all-erase" className="font-medium text-foreground">
                {isAllEraseSelected ? 'Deselect All' : 'Select All'}
              </Label>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {erasableCollections.map((coll) => (
                <div key={coll.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                      id={`erase-${coll.id}`}
                      checked={!!selectedEraseCollections[coll.id]}
                      onCheckedChange={(checked) => {
                          setSelectedEraseCollections((prev) => ({ ...prev, [coll.id]: Boolean(checked) }));
                        }}
                      className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                  <Label htmlFor={`erase-${coll.id}`} className="flex-1 cursor-pointer text-foreground">
                      {coll.name}
                      {' '}
                      <span className="text-xs text-muted-foreground">
                          ({coll.collectionName}
                          )
</span>
                    </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isErasing} className="border-border bg-background hover:bg-muted">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleEraseContent}
              disabled={isErasing || !isSomeEraseSelected}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isErasing ? 'Erasing...' : 'Erase Selected Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Definition Dialog */}
      <Dialog open={showTaskDefinitionDialog} onOpenChange={setShowTaskDefinitionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTaskDefinition ? 'Edit Task Definition' : 'Create Task Definition'}
            </DialogTitle>
            <DialogDescription>
              Define a new task that can be executed by the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="function-path" className="text-sm font-medium">Function Path</Label>
              <Input
                id="function-path"
                value={selectedTaskDefinition?.function_path || ''}
                onChange={(e) => setSelectedTaskDefinition(prev => prev ? {...prev, function_path: e.target.value} : null)}
                placeholder="e.g., backups.create_backup_as_admin_user"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={selectedTaskDefinition?.description || ''}
                onChange={(e) => setSelectedTaskDefinition(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="Describe what this task does"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-type" className="text-sm font-medium">Task Type</Label>
              <Select
                value={selectedTaskDefinition?.task_type || 'internal'}
                onValueChange={(value) => setSelectedTaskDefinition(prev => prev ? {...prev, task_type: value as any} : null)}
              >
                <SelectTrigger id="task-type" className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-sm font-medium">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={selectedTaskDefinition?.timeout_seconds || 300}
                onChange={(e) => setSelectedTaskDefinition(prev => prev ? {...prev, timeout_seconds: parseInt(e.target.value)} : null)}
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retry-strategy" className="text-sm font-medium">Retry Strategy</Label>
              <Select
                value={selectedTaskDefinition?.retry_strategy || 'none'}
                onValueChange={(value) => setSelectedTaskDefinition(prev => prev ? {...prev, retry_strategy: value} : null)}
              >
                <SelectTrigger id="retry-strategy" className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-retries" className="text-sm font-medium">Max Retries</Label>
              <Input
                id="max-retries"
                type="number"
                value={selectedTaskDefinition?.max_retries || 0}
                onChange={(e) => setSelectedTaskDefinition(prev => prev ? {...prev, max_retries: parseInt(e.target.value)} : null)}
                className="border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-border bg-background hover:bg-muted">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleSaveTaskDefinition(selectedTaskDefinition || {})}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {selectedTaskDefinition ? 'Update' : 'Create'} Task Definition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Schedule Dialog */}
      <Dialog open={showTaskScheduleDialog} onOpenChange={setShowTaskScheduleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTaskSchedule ? 'Edit Task Schedule' : 'Create Task Schedule'}
            </DialogTitle>
            <DialogDescription>
              Schedule when and how often a task should run automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-name" className="text-sm font-medium">Schedule Name</Label>
              <Input
                id="schedule-name"
                value={selectedTaskSchedule?.name || ''}
                onChange={(e) => setSelectedTaskSchedule(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="e.g., Daily Backup Schedule"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-definition" className="text-sm font-medium">Task Definition</Label>
              <Select
                value={selectedTaskSchedule?.task_definition_id || ''}
                onValueChange={(value) => setSelectedTaskSchedule(prev => prev ? {...prev, task_definition_id: value} : null)}
              >
                <SelectTrigger id="task-definition" className="border-border bg-background">
                  <SelectValue placeholder="Select a task definition" />
                </SelectTrigger>
                <SelectContent>
                  {taskDefinitions.map((def) => (
                    <SelectItem key={def._id} value={def._id}>
                      {def.function_path} - {def.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is-periodic" className="text-sm font-medium">Periodic</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-periodic"
                  checked={selectedTaskSchedule?.is_periodic || false}
                  onCheckedChange={(checked) => setSelectedTaskSchedule(prev => prev ? {...prev, is_periodic: checked} : null)}
                />
                <Label htmlFor="is-periodic">Run periodically</Label>
              </div>
            </div>
            {selectedTaskSchedule?.is_periodic && (
              <div className="space-y-2">
                <Label htmlFor="interval" className="text-sm font-medium">Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  value={selectedTaskSchedule?.interval_seconds || 3600}
                  onChange={(e) => setSelectedTaskSchedule(prev => prev ? {...prev, interval_seconds: parseInt(e.target.value)} : null)}
                  className="border-border bg-background"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="enabled" className="text-sm font-medium">Enabled</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={selectedTaskSchedule?.enabled || true}
                  onCheckedChange={(checked) => setSelectedTaskSchedule(prev => prev ? {...prev, enabled: checked} : null)}
                />
                <Label htmlFor="enabled">Enable this schedule</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-border bg-background hover:bg-muted">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => handleSaveTaskSchedule(selectedTaskSchedule || {})}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {selectedTaskSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabContent>
  );
}

export default AdminConfigTab;
