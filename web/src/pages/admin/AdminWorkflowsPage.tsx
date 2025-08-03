import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PlusCircle, Edit, Trash2, Play, Clock, CheckCircle2, XCircle, Eye, RefreshCw,
  Workflow, Calendar, User, Activity, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  workflowService, 
  WorkflowDefinition, 
  WorkflowExecution, 
  WorkflowExecutionStatus,
  NodeExecutionStatus
} from '@/utils/services/workflowService';

// Status badge components
const ExecutionStatusBadge: React.FC<{ status: WorkflowExecutionStatus }> = ({ status }) => {
  const statusInfo = {
    running: { icon: <RefreshCw className="mr-1 h-3 w-3 animate-spin" />, text: 'Running', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    completed: { icon: <CheckCircle2 className="mr-1 h-3 w-3" />, text: 'Completed', className: 'bg-green-100 text-green-800 border-green-300' },
    failed: { icon: <XCircle className="mr-1 h-3 w-3" />, text: 'Failed', className: 'bg-red-100 text-red-800 border-red-300' },
    canceled: { icon: <AlertTriangle className="mr-1 h-3 w-3" />, text: 'Canceled', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  };
  const info = statusInfo[status] || { icon: null, text: status, className: 'bg-gray-200' };
  return <Badge variant="outline" className={info.className}>{info.icon}{info.text}</Badge>;
};

// Workflow execution trigger dialog
const TriggerWorkflowDialog: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  workflow: WorkflowDefinition | null;
  onTrigger: (workflowId: string, inputs: Record<string, any>) => Promise<void>;
}> = ({ isOpen, setIsOpen, workflow, onTrigger }) => {
  const [inputs, setInputs] = useState('{}');
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async () => {
    if (!workflow) return;
    
    try {
      const parsedInputs = JSON.parse(inputs);
      setIsTriggering(true);
      await onTrigger(workflow._id, parsedInputs);
      setIsOpen(false);
      setInputs('{}');
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON in inputs');
      } else {
        toast.error('Failed to trigger workflow');
      }
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trigger Workflow: {workflow?.name}</DialogTitle>
          <DialogDescription>Provide initial inputs for the workflow execution (JSON format).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="inputs">Initial Inputs (JSON)</Label>
            <Textarea
              id="inputs"
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              className="font-mono text-xs"
              rows={8}
              placeholder='{"parameter1": "value1", "parameter2": "value2"}'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleTrigger} disabled={isTriggering}>
            {isTriggering ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {isTriggering ? 'Triggering...' : 'Trigger Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete confirmation dialog
const DeleteWorkflowDialog: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  workflow: WorkflowDefinition | null;
  onDelete: (workflowId: string) => Promise<void>;
}> = ({ isOpen, setIsOpen, workflow, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!workflow) return;
    
    try {
      setIsDeleting(true);
      await onDelete(workflow._id);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Workflow</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{workflow?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Workflow definitions tab
const WorkflowDefinitionsTab: React.FC<{
  definitions: WorkflowDefinition[];
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ definitions, onRefresh, isLoading }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerDialog, setTriggerDialog] = useState<{ isOpen: boolean; workflow: WorkflowDefinition | null }>({
    isOpen: false,
    workflow: null
  });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; workflow: WorkflowDefinition | null }>({
    isOpen: false,
    workflow: null
  });

  const filteredDefinitions = definitions.filter(def =>
    def.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    def.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTriggerWorkflow = async (workflowId: string, inputs: Record<string, any>) => {
    try {
      await workflowService.triggerWorkflowExecution(workflowId, inputs);
      toast.success('Workflow triggered successfully');
    } catch (error: any) {
      toast.error('Failed to trigger workflow', { description: error.message });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await workflowService.deleteWorkflowDefinition(workflowId);
      toast.success('Workflow deleted successfully');
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to delete workflow', { description: error.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Workflow className="mr-2 h-5 w-5" />
              Workflow Definitions
            </CardTitle>
            <CardDescription>Create and manage your workflow blueprints</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/admin/workflows/new')} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>
        <div className="pt-2">
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredDefinitions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? 'No workflows match your search.' : 'No workflows created yet.'}</p>
            {!searchTerm && (
              <Button onClick={() => navigate('/admin/workflows/new')} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Workflow
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Nodes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDefinitions.map((definition) => (
                <TableRow key={definition._id}>
                  <TableCell className="font-medium">{definition.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {definition.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{definition.nodes.length} nodes</Badge>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(parseISO(definition.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTriggerDialog({ isOpen: true, workflow: definition })}
                        title="Trigger workflow"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/workflows/edit/${definition._id}`)}
                        title="Edit workflow"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ isOpen: true, workflow: definition })}
                        title="Delete workflow"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <TriggerWorkflowDialog
        isOpen={triggerDialog.isOpen}
        setIsOpen={(isOpen) => setTriggerDialog({ isOpen, workflow: triggerDialog.workflow })}
        workflow={triggerDialog.workflow}
        onTrigger={handleTriggerWorkflow}
      />

      <DeleteWorkflowDialog
        isOpen={deleteDialog.isOpen}
        setIsOpen={(isOpen) => setDeleteDialog({ isOpen, workflow: deleteDialog.workflow })}
        workflow={deleteDialog.workflow}
        onDelete={handleDeleteWorkflow}
      />
    </Card>
  );
};

// Workflow executions tab
const WorkflowExecutionsTab: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  const fetchExecutions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflowExecutions();
      setExecutions(data);
    } catch (error) {
      toast.error('Failed to load workflow executions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const calculateProgress = (execution: WorkflowExecution) => {
    const totalNodes = Object.keys(execution.node_states).length;
    const completedNodes = Object.values(execution.node_states).filter(
      state => state.status === 'completed'
    ).length;
    return totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Workflow Executions
            </CardTitle>
            <CardDescription>Monitor workflow execution history and status</CardDescription>
          </div>
          <Button onClick={fetchExecutions} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workflow executions found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution._id}>
                  <TableCell className="font-medium">{execution.workflow_name}</TableCell>
                  <TableCell>
                    <ExecutionStatusBadge status={execution.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(execution)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {calculateProgress(execution)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(parseISO(execution.started_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    {execution.finished_at
                      ? `${((parseISO(execution.finished_at).getTime() - parseISO(execution.started_at).getTime()) / 1000).toFixed(2)}s`
                      : execution.status === 'running'
                      ? 'Running...'
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedExecution(execution)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Execution details dialog */}
      <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Workflow Execution Details</DialogTitle>
            <DialogDescription>
              {selectedExecution?.workflow_name} - Started {selectedExecution && formatDistanceToNow(parseISO(selectedExecution.started_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {selectedExecution && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Execution Status</h4>
                    <ExecutionStatusBadge status={selectedExecution.status} />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Progress</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(selectedExecution)}%` }}
                        />
                      </div>
                      <span className="text-sm">{calculateProgress(selectedExecution)}%</span>
                    </div>
                  </div>
                </div>

                {selectedExecution.error && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Error</h4>
                    <pre className="bg-red-50 p-3 rounded text-xs text-red-800 whitespace-pre-wrap">
                      {selectedExecution.error}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Initial Inputs</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs">
                    {JSON.stringify(selectedExecution.initial_inputs, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Node States</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedExecution.node_states).map(([nodeId, state]) => (
                      <div key={nodeId} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{nodeId}</span>
                          <Badge variant="outline" className={
                            state.status === 'completed' ? 'bg-green-100 text-green-800' :
                            state.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            state.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {state.status}
                          </Badge>
                        </div>
                        {state.error && (
                          <pre className="bg-red-50 p-2 rounded text-xs text-red-800 mb-2">
                            {state.error}
                          </pre>
                        )}
                        {state.result && (
                          <pre className="bg-gray-50 p-2 rounded text-xs">
                            {JSON.stringify(state.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExecution(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Main component for admin tab
const AdminWorkflowsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('definitions');
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDefinitions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflowDefinitions();
      setDefinitions(data);
    } catch (error) {
      toast.error('Failed to load workflow definitions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflow Management</h2>
          <p className="text-muted-foreground">Create, manage, and monitor your automated workflows</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="definitions">
          <WorkflowDefinitionsTab
            definitions={definitions}
            onRefresh={fetchDefinitions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="executions">
          <WorkflowExecutionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWorkflowsPage;

