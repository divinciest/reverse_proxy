/**
 * workflowService.ts
 * 
 * This service provides functions for interacting with the backend's workflow engine API.
 * It handles all HTTP requests for creating, reading, updating, deleting, and executing workflows.
 * The interfaces defined here ensure type safety between the frontend and the backend data models.
 */
import api from '../api';

// --- Interfaces ---

// Define the data for each node type
interface TaskNodeData {
  function_path: string;
  display_name: string;
  task_type?: 'internal' | 'external';
  description?: string;
  input_schema?: string;
  output_schema?: string;
  type: 'task'; // Backend type field
}

interface IfNodeData {
  display_name: string;
  conditions: Array<{
    input_handle: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }>;
  type: 'if'; // Backend type field
}

interface LoopNodeData {
  display_name: string;
  input_array_handle: string;
  type: 'loop'; // Backend type field
}

interface ConstantNodeData {
  display_name: string;
  value: any;
  dataType: 'string' | 'number' | 'json';
  type: 'constant'; // Backend type field
}

interface MergeNodeData {
  display_name: string;
  type: 'merge'; // Backend type field
}

/**
 * Represents a single node in the workflow graph, conforming to the React Flow structure.
 * Uses discriminated union for type safety between different node types.
 */
export interface WorkflowNode {
  id: string;
  position: { x: number; y: number };
  // The 'type' property determines the shape of 'data' (React Flow type)
  type: 'taskNode' | 'ifNode' | 'loopNode' | 'mergeNode' | 'constantNode';
  data: TaskNodeData | IfNodeData | LoopNodeData | ConstantNodeData | MergeNodeData;
}

/**
 * Represents a connection between two nodes in the workflow graph.
 * The 'data' property can hold mapping information between task outputs and inputs.
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  data?: {
    mappings?: Array<{ source_handle: string; target_handle: string }>;
  };
}

/**
 * Defines the structure of a complete workflow definition, including its nodes and edges.
 * This is the primary object for creating and updating workflows.
 */
export interface WorkflowDefinition {
  _id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
}

/**
 * Represents the status of a workflow execution.
 */
export type WorkflowExecutionStatus = 'running' | 'completed' | 'failed' | 'canceled';

/**
 * Represents the status of an individual node within a workflow execution.
 */
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Represents the state of a single node within a workflow execution.
 */
export interface NodeExecutionState {
  status: NodeExecutionStatus;
  task_instance_id: string | null;
  result: any;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

/**
 * Represents a complete workflow execution instance with all node states.
 */
export interface WorkflowExecution {
  _id: string;
  workflow_definition_id: string;
  workflow_name: string;
  status: WorkflowExecutionStatus;
  initial_inputs: Record<string, any>;
  node_states: Record<string, NodeExecutionState>;
  created_at: string;
  updated_at: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

// --- API Service Functions ---

export const workflowService = {
  /**
   * Fetches all workflow definitions from the backend.
   * @returns A promise that resolves to an array of workflow definitions.
   */
  async getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    try {
      const response = await api.get<WorkflowDefinition[]>('/admin/workflows/definitions');
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow definitions:', error);
      throw error;
    }
  },

  /**
   * Creates a new workflow definition.
   * @param workflowData - The data for the new workflow, excluding the _id.
   * @returns A promise that resolves to the newly created workflow definition.
   */
  async createWorkflowDefinition(workflowData: Omit<WorkflowDefinition, '_id' | 'created_at' | 'updated_at'>): Promise<WorkflowDefinition> {
    try {
      const response = await api.post<WorkflowDefinition>('/admin/workflows/definitions', workflowData);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow definition:', error);
      throw error;
    }
  },

  /**
   * Fetches a single workflow definition by its ID.
   * @param workflowId - The ID of the workflow to fetch.
   * @returns A promise that resolves to the workflow definition.
   */
  async getWorkflowDefinitionById(workflowId: string): Promise<WorkflowDefinition> {
    try {
      const response = await api.get<WorkflowDefinition>(`/admin/workflows/definitions/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow definition ${workflowId}:`, error);
      throw error;
    }
  },

  /**
   * Updates an existing workflow definition.
   * @param workflowId - The ID of the workflow to update.
   * @param workflowData - The updated workflow data.
   * @returns A promise that resolves when the update is successful.
   */
  async updateWorkflowDefinition(workflowId: string, workflowData: Partial<WorkflowDefinition>): Promise<void> {
    try {
      await api.put(`/admin/workflows/definitions/${workflowId}`, workflowData);
    } catch (error) {
      console.error(`Error updating workflow definition ${workflowId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a workflow definition by its ID.
   * @param workflowId - The ID of the workflow to delete.
   * @returns A promise that resolves when the deletion is successful.
   */
  async deleteWorkflowDefinition(workflowId: string): Promise<void> {
    try {
      await api.delete(`/admin/workflows/definitions/${workflowId}`);
    } catch (error) {
      console.error(`Error deleting workflow definition ${workflowId}:`, error);
      throw error;
    }
  },

  /**
   * Triggers a new execution of a workflow definition.
   * @param workflowId - The ID of the workflow definition to execute.
   * @param initialInputs - Optional initial inputs for the workflow execution.
   * @returns A promise that resolves to the newly created workflow execution.
   */
  async triggerWorkflowExecution(workflowId: string, initialInputs?: Record<string, any>): Promise<WorkflowExecution> {
    try {
      const response = await api.post<WorkflowExecution>(`/admin/workflows/definitions/${workflowId}/trigger`, initialInputs || {});
      return response.data;
    } catch (error) {
      console.error(`Error triggering workflow execution for ${workflowId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches all workflow executions with optional pagination.
   * @param page - The page number for pagination (default: 1).
   * @param limit - The number of items per page (default: 20).
   * @returns A promise that resolves to an array of workflow executions.
   */
  async getWorkflowExecutions(page: number = 1, limit: number = 20): Promise<WorkflowExecution[]> {
    try {
      const response = await api.get<WorkflowExecution[]>('/admin/workflows/executions', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      throw error;
    }
  },

  /**
   * Fetches a single workflow execution by its ID.
   * @param executionId - The ID of the workflow execution to fetch.
   * @returns A promise that resolves to the workflow execution.
   */
  async getWorkflowExecutionById(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await api.get<WorkflowExecution>(`/admin/workflows/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow execution ${executionId}:`, error);
      throw error;
    }
  },
}; 