import api from '../api';

// Task status constants
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
  FAILED_TO_CANCEL: 'failed_to_cancel'
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Task interfaces
export interface Task {
  _id: string;
  task_name: string;
  function_path: string;
  args: any[];
  kwargs: Record<string, any>;
  status: TaskStatus;
  trigger_type: string;
  created_at: string;
  updated_at: string;
  should_start_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
  result?: any;
  retries: number;
  timeout_seconds: number;
  max_retries: number;
  retry_strategy: string;
  retry_delay_seconds: number;
  trigger_stacktrace?: string;
  cancellation_stacktrace?: string;
  // New fields for external tasks
  task_type: 'internal' | 'external';
  command?: string;
  pid?: number;
}

export interface CodeTaskDefinition {
  id?: string;
  name: string;
  description: string;
  code_snippet: string;
  main_function_name: string;
  input_schema: string;
  output_schema: string;
  created_at?: string;
  updated_at?: string;
}

// New interfaces for separated collections
export interface TaskDefinition {
  _id: string;
  function_path: string;
  description: string;
  input_schema: string;
  output_schema: string;
  task_type: 'internal' | 'external' | 'code';
  default_timeout_seconds: number;
  default_retry_strategy: string;
  default_max_retries: number;
  default_retry_delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface TaskSchedule {
  _id: string;
  task_definition_id: string;
  name: string;
  is_periodic: boolean;
  interval_seconds: number;
  enabled: boolean;
  timeout_seconds?: number;
  retry_strategy?: string;
  max_retries?: number;
  retry_delay_seconds?: number;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from task definition
  function_path?: string;
  description?: string;
}

export interface TaskConfig {
  _id?: string; // Add optional _id field
  function_path: string;
  is_periodic: boolean;
  interval_seconds: number;
  timeout_seconds: number;
  retry_strategy: string;
  retry_coefficient: number;
  max_retries: number;
  retry_delay_seconds: number;
  enabled: boolean;
  description: string;
  last_run_at?: string;
  next_run_at?: string;
  created_at?: string;
  updated_at?: string;
  // New fields for external tasks
  task_type: 'internal' | 'external';
  command?: string;
  // New fields for I/O and mapping
  input_schema?: string;
  output_schema?: string;
  input_mapper_code?: string;
  output_mapper_code?: string;
  // Schedule information (if scheduled)
  schedule_id?: string;
  schedule_name?: string;
}

export interface TaskPagination {
  current_page: number;
  tasks_per_page: number;
  total_tasks: number;
  total_pages: number;
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
  search?: string;
  task_name?: string;
}

export interface GetTasksResponse {
  tasks: Task[];
  pagination: TaskPagination;
}

export interface TriggerTaskPayload {
  function_path: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

export interface FunctionParameter {
  name: string;
  kind: string;
  default: string | null;
  annotation: string | null;
}

export interface FunctionSignature {
  function_path: string;
  parameters: FunctionParameter[];
  return_annotation: string | null;
  docstring: string;
}

export interface TaskLogsResponse {
  task_id: string;
  logs: string;
}

export const taskService = {
  // Discover available tasks
  async discoverTasks(): Promise<string[]> {
    try {
      const response = await api.get<string[]>('/admin/tasks/discover');
      return response.data;
    } catch (error) {
      console.error('Error discovering tasks:', error);
      throw error;
    }
  },

  // Get function signatures
  async getFunctionSignatures(): Promise<Record<string, FunctionSignature>> {
    try {
      const response = await api.get<Record<string, FunctionSignature>>('/admin/tasks/signatures');
      return response.data;
    } catch (error) {
      console.error('Error getting function signatures:', error);
      throw error;
    }
  },

  // Get task configurations
  async getTaskConfigs(): Promise<TaskConfig[]> {
    try {
      const response = await api.get<TaskConfig[]>('/admin/tasks/configs');
      return response.data || [];
    } catch (error) {
      console.error('Error getting task configs:', error);
      throw error;
    }
  },

  // Create task configuration
  async createTaskConfig(config: Partial<TaskConfig>): Promise<TaskConfig> {
    try {
      const response = await api.post<TaskConfig>('/admin/tasks/configs', config);
      return response.data;
    } catch (error) {
      console.error('Error creating task config:', error);
      throw error;
    }
  },

  // Update task configuration
  async updateTaskConfig(id: string, config: Partial<TaskConfig>): Promise<TaskConfig> {
    try {
      const response = await api.put<TaskConfig>(`/admin/tasks/configs/${id}`, config);
      return response.data;
    } catch (error) {
      console.error('Error updating task config:', error);
      throw error;
    }
  },

  // Delete task configuration
  async deleteTaskConfig(id: string): Promise<void> {
    try {
      await api.delete(`/admin/tasks/configs/${id}`);
    } catch (error) {
      console.error('Error deleting task config:', error);
      throw error;
    }
  },

  // Get code task definitions
  async getCodeTaskDefinitions(): Promise<CodeTaskDefinition[]> {
    try {
      const response = await api.get<CodeTaskDefinition[]>('/admin/tasks/code-definitions');
      return response.data || [];
    } catch (error) {
      console.error('Error getting code task definitions:', error);
      throw error;
    }
  },

  // Create code task definition
  async createCodeTaskDefinition(definition: Partial<CodeTaskDefinition>): Promise<CodeTaskDefinition> {
    try {
      const response = await api.post<CodeTaskDefinition>('/admin/tasks/code-definitions', definition);
      return response.data;
    } catch (error) {
      console.error('Error creating code task definition:', error);
      throw error;
    }
  },

  // Update code task definition
  async updateCodeTaskDefinition(id: string, definition: Partial<CodeTaskDefinition>): Promise<CodeTaskDefinition> {
    try {
      const response = await api.put<CodeTaskDefinition>(`/admin/tasks/code-definitions/${id}`, definition);
      return response.data;
    } catch (error) {
      console.error('Error updating code task definition:', error);
      throw error;
    }
  },

  // Delete code task definition
  async deleteCodeTaskDefinition(id: string): Promise<void> {
    try {
      await api.delete(`/admin/tasks/code-definitions/${id}`);
    } catch (error) {
      console.error('Error deleting code task definition:', error);
      throw error;
    }
  },

  // Infer schema from code
  async inferSchemaFromCode(code: string, functionName: string): Promise<{ input_schema: string; output_schema: string }> {
    try {
      const response = await api.post<{ input_schema: string; output_schema: string }>('/admin/tasks/infer-schema-from-code', {
        code_snippet: code,
        main_function_name: functionName
      });
      return response.data;
    } catch (error) {
      console.error('Error inferring schema from code:', error);
      throw error;
    }
  },

  // Get tasks from queue
  async getTasks(page: number = 1, limit: number = 20, search?: string): Promise<{ tasks: Task[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search) params.append('search', search);
      
      const response = await api.get<{ tasks: Task[]; pagination: any }>(`/admin/tasks/queue?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  // Trigger task
  async triggerTask(functionPath: string, kwargs?: Record<string, any>): Promise<Task> {
    try {
      const response = await api.post<Task>('/admin/tasks/trigger', {
        function_path: functionPath,
        kwargs: kwargs || {}
      });
      return response.data;
    } catch (error) {
      console.error('Error triggering task:', error);
      throw error;
    }
  },

  // Get task by ID
  async getTask(id: string): Promise<Task> {
    try {
      const response = await api.get<Task>(`/admin/tasks/queue/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  // Cancel task
  async cancelTask(id: string): Promise<void> {
    try {
      await api.put(`/admin/tasks/queue/${id}/cancel`);
    } catch (error) {
      console.error('Error canceling task:', error);
      throw error;
    }
  },

  // Retry task
  async retryTask(id: string): Promise<Task> {
    try {
      const response = await api.post<Task>(`/admin/tasks/queue/${id}/retry`);
      return response.data;
    } catch (error) {
      console.error('Error retrying task:', error);
      throw error;
    }
  },

  // Get task logs
  async getTaskLogs(id: string): Promise<string> {
    try {
      const response = await api.get<{ logs: string }>(`/admin/tasks/queue/${id}/logs`);
      return response.data.logs;
    } catch (error) {
      console.error('Error getting task logs:', error);
      throw error;
    }
  },

  // New methods for task definitions
  async getTaskDefinitions(): Promise<TaskDefinition[]> {
    try {
      const response = await api.get<TaskDefinition[]>('/admin/task-definitions');
      return response.data || [];
    } catch (error: any) {
      console.error('API Error fetching task definitions:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch task definitions');
    }
  },

  async createTaskDefinition(definition: Partial<TaskDefinition>): Promise<TaskDefinition> {
    try {
      const response = await api.post<TaskDefinition>('/admin/task-definitions', definition);
      return response.data;
    } catch (error: any) {
      console.error('API Error creating task definition:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create task definition');
    }
  },

  async updateTaskDefinition(id: string, definition: Partial<TaskDefinition>): Promise<TaskDefinition> {
    try {
      const response = await api.put<TaskDefinition>(`/admin/task-definitions/${id}`, definition);
      return response.data;
    } catch (error: any) {
      console.error('API Error updating task definition:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update task definition');
    }
  },

  async deleteTaskDefinition(id: string): Promise<void> {
    try {
      await api.delete(`/admin/task-definitions/${id}`);
    } catch (error: any) {
      console.error('API Error deleting task definition:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to delete task definition');
    }
  },

  // New methods for task schedules
  async getTaskSchedules(): Promise<TaskSchedule[]> {
    try {
      const response = await api.get<TaskSchedule[]>('/admin/task-schedules');
      return response.data || [];
    } catch (error: any) {
      console.error('API Error fetching task schedules:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch task schedules');
    }
  },

  async createTaskSchedule(schedule: Partial<TaskSchedule>): Promise<TaskSchedule> {
    try {
      const response = await api.post<TaskSchedule>('/admin/task-schedules', schedule);
      return response.data;
    } catch (error: any) {
      console.error('API Error creating task schedule:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create task schedule');
    }
  },

  async updateTaskSchedule(id: string, schedule: Partial<TaskSchedule>): Promise<TaskSchedule> {
    try {
      const response = await api.put<TaskSchedule>(`/admin/task-schedules/${id}`, schedule);
      return response.data;
    } catch (error: any) {
      console.error('API Error updating task schedule:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update task schedule');
    }
  },

  async deleteTaskSchedule(id: string): Promise<void> {
    try {
      await api.delete(`/admin/task-schedules/${id}`);
    } catch (error: any) {
      console.error('API Error deleting task schedule:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to delete task schedule');
    }
  },

  // Helper method to check if task is in terminal state
  isTaskTerminal(status: TaskStatus): boolean {
    const terminalStatuses: TaskStatus[] = [TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.CANCELED, TASK_STATUS.FAILED_TO_CANCEL];
    return terminalStatuses.includes(status);
  },

  // Helper method to check if task can be canceled
  canCancelTask(status: TaskStatus): boolean {
    return status === TASK_STATUS.PENDING || status === TASK_STATUS.RUNNING;
  },

  // Helper method to check if task can be retried
  canRetryTask(status: TaskStatus): boolean {
    return status === TASK_STATUS.FAILED;
  },

  // Helper method to get status color for UI
  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TASK_STATUS.PENDING:
        return 'text-yellow-600';
      case TASK_STATUS.RUNNING:
        return 'text-blue-600';
      case TASK_STATUS.COMPLETED:
        return 'text-green-600';
      case TASK_STATUS.FAILED:
        return 'text-red-600';
      case TASK_STATUS.CANCELED:
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  },

  // Helper method to format retry strategy for display
  formatRetryStrategy(strategy: string): string {
    switch (strategy) {
      case 'none':
        return 'No Retry';
      case 'fixed_delay':
        return 'Fixed Delay';
      case 'exponential_backoff':
        return 'Exponential Backoff';
      default:
        return strategy;
    }
  }
}; 