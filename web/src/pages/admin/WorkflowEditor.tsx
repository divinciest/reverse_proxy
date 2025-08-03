/**
 * WorkflowEditor.tsx
 *
 * This component provides a visual, drag-and-drop interface for building
 * and editing workflows. It is the core of the workflow creation experience,
 * allowing users to arrange tasks as nodes and connect them to define the
 * flow of execution.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ReactFlow,
  MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
  Node,
  NodeTypes,
  ConnectionMode,
  MarkerType,
  Panel,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save, Play, ArrowLeft, Settings, Code, Terminal, Plus, Search, 
  ChevronDown, ChevronRight, FileJson, Download, Upload, RotateCw, GitBranch, Merge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  workflowService, 
  WorkflowDefinition, 
  WorkflowNode, 
  WorkflowEdge 
} from '@/utils/services/workflowService';
import { taskService, TaskConfig, CodeTaskDefinition } from '@/utils/services/taskService';
import CodeTaskEditorDialog from '@/components/CodeTaskEditorDialog';
import { MultiPortTaskNode, MultiPortTaskNodeData } from '@/components/MultiPortTaskNode';
import { getTaskPortDefinitions, getPortType } from '@/utils/schemaParser';
import { ConstantNode } from '@/components/ConstantNode';

// Enhanced ControlFlowNode component with better handle design and spacing
const ControlFlowNode: React.FC<any> = ({ data, selected }) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'if': return 'border-blue-400 bg-blue-50 shadow-blue-100';
      case 'loop': return 'border-green-400 bg-green-50 shadow-green-100';
      case 'merge': return 'border-orange-400 bg-orange-50 shadow-orange-100';
      default: return 'border-gray-400 bg-gray-50 shadow-gray-100';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'if': return 'text-blue-800';
      case 'loop': return 'text-green-800';
      case 'merge': return 'text-orange-800';
      default: return 'text-gray-800';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'if': return <GitBranch className="h-4 w-4 text-blue-600" />;
      case 'loop': return <RotateCw className="h-4 w-4 text-green-600" />;
      case 'merge': return <Merge className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const getHandleColor = (type: string) => {
    switch (type) {
      case 'if': return 'bg-blue-500 border-blue-600';
      case 'loop': return 'bg-green-500 border-green-600';
      case 'merge': return 'bg-orange-500 border-orange-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getLabelColor = (type: string) => {
    switch (type) {
      case 'if': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'loop': return 'bg-green-100 text-green-700 border-green-200';
      case 'merge': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Define port configurations with better spacing
  const portConfig = {
    if: { 
      inputs: [{label: 'Input', id: 'input'}], 
      outputs: [{label: 'True', id: 'true'}, {label: 'False', id: 'false'}] 
    },
    loop: { 
      inputs: [
        {label: 'Input Array', id: 'input'},
        {label: 'Next Item', id: 'continue'}
      ], 
      outputs: [{label: 'Loop Body', id: 'loop'}, {label: 'Done', id: 'done'}] 
    },
    merge: { 
      inputs: [{label: 'Input 1', id: 'input1'}, {label: 'Input 2', id: 'input2'}], 
      outputs: [{label: 'Output', id: 'output'}] 
    },
    default: { 
      inputs: [{label: 'Input', id: 'input'}], 
      outputs: [{label: 'Output', id: 'output'}] 
    },
  };

  const { inputs, outputs } = portConfig[data?.type as keyof typeof portConfig] || portConfig.default;
  const nodeType = data?.type || 'default';

  return (
    <div className={`relative px-4 py-3 rounded-lg border-2 shadow-sm ${getNodeColor(nodeType)} ${
      selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
    } min-w-[160px] min-h-[80px]`}>
      {/* Node content with proper spacing from handles */}
      <div className="flex items-center space-x-2 mb-2" style={{ 
        marginLeft: inputs.length > 0 ? '60px' : '0px',
        marginRight: outputs.length > 0 ? '60px' : '0px'
      }}>
        {getNodeIcon(nodeType)}
        <span className={`text-sm font-semibold ${getTextColor(nodeType)}`}>
          {data?.display_name || 'Unknown Node'}
        </span>
      </div>
      
      {/* Input handles with improved spacing */}
      {inputs.map((port, i) => (
        <div key={`input-${i}`} className="absolute left-0" style={{ top: `${(i + 1) * 100 / (inputs.length + 1)}%` }}>
          <Handle
            type="target"
            position={Position.Left}
            id={port.id}
            className={`w-3 h-3 border-2 ${getHandleColor(nodeType)} hover:scale-125 transition-transform duration-200`}
            style={{ 
              left: '-6px',
              top: '-6px'
            }}
          />
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium border ${getLabelColor(nodeType)} whitespace-nowrap shadow-sm z-10`}>
            {port.label}
          </div>
        </div>
      ))}
      
      {/* Output handles with improved spacing */}
      {outputs.map((port, i) => (
        <div key={`output-${i}`} className="absolute right-0" style={{ top: `${(i + 1) * 100 / (outputs.length + 1)}%` }}>
          <Handle
            type="source"
            position={Position.Right}
            id={port.id}
            className={`w-3 h-3 border-2 ${getHandleColor(nodeType)} hover:scale-125 transition-transform duration-200`}
            style={{ 
              right: '-6px',
              top: '-6px'
            }}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium border ${getLabelColor(nodeType)} whitespace-nowrap shadow-sm z-10`}>
            {port.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const createNodeTypes = () => ({
    taskNode: (props: any) => <MultiPortTaskNode {...props} onEditNode={() => {}} />,
    ifNode: (props: any) => <ControlFlowNode {...props} />,
    loopNode: (props: any) => <ControlFlowNode {...props} />,
    mergeNode: (props: any) => <ControlFlowNode {...props} />,
    constantNode: (props: any) => <ConstantNode {...props} />,
  });

// Task palette sidebar
const TaskPalette: React.FC<{
  taskConfigs: TaskConfig[];
  localCodeTasks: CodeTaskDefinition[];
  onDragStart: (event: React.DragEvent, task: TaskConfig | CodeTaskDefinition) => void;
  onCreateLocalCodeTask: () => void;
  onRefreshTaskConfigs: () => void;
}> = ({ taskConfigs, localCodeTasks, onDragStart, onCreateLocalCodeTask, onRefreshTaskConfigs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['internal', 'external', 'local_code']));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshTaskConfigs();
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const allTasks = useMemo(() => {
    const globalTasks = (taskConfigs || []).map(task => ({ ...task, isLocal: false }));
    const localTasks = (localCodeTasks || []).map(task => ({
      ...task,
      function_path: `local://${task.id}`,
      task_type: 'code',
      isLocal: true,
      input_schema: task.input_schema,
      output_schema: task.output_schema,
      description: task.description,
    }));
    return [...globalTasks, ...localTasks];
  }, [taskConfigs, localCodeTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const functionPath = 'function_path' in task ? task.function_path : `local://${task.id}`;
      const description = task.description || '';
      const name = 'name' in task ? task.name : '';
      
      return functionPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [allTasks, searchTerm]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, (TaskConfig | CodeTaskDefinition)[]> = {};
    filteredTasks.forEach(task => {
      let category = task.task_type || 'unknown';
      if (task.isLocal) {
        category = 'local_code';
      }
      if (!groups[category]) groups[category] = [];
      groups[category].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'internal': return 'Internal Tasks';
      case 'external': return 'External Tasks';
      case 'local_code': return 'Local Code Tasks';
      default: return category;
    }
  };

  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Task Palette</CardTitle>
        <CardDescription className="text-xs">Drag tasks onto the canvas</CardDescription>
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex space-x-2 mt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onCreateLocalCodeTask}>
              <Plus className="h-4 w-4 mr-2" /> Create Local Code Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              title="Refresh task definitions"
            >
              <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {/* New Control Flow Nodes */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-3 bg-purple-50">
            <div className="text-sm font-semibold text-purple-800 mb-2">Control Flow</div>
            
            {/* If Node */}
            <div
              className="cursor-grab hover:bg-blue-100 active:cursor-grabbing p-2 rounded border border-blue-200 mb-2"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ 
                  type: 'ifNode',
                  display_name: 'If Condition',
                  conditions: []
                }));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">If Condition</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                    ? → T/F
                  </span>
                </div>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Branch workflow based on conditions
              </div>
            </div>

            {/* Constant Node */}
            <div
              className="cursor-grab hover:bg-gray-100 active:cursor-grabbing p-2 rounded border border-gray-200 mb-2"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ 
                  type: 'constantNode',
                  display_name: 'Constant Value',
                  value: "default value"
                }));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center space-x-2">
                <FileJson className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Constant</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Provide a fixed value as input
              </div>
            </div>

            {/* Loop Node */}
            <div
              className="cursor-grab hover:bg-green-100 active:cursor-grabbing p-2 rounded border border-green-200 mb-2"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ 
                  type: 'loopNode',
                  display_name: 'Loop Over Items',
                  input_array_handle: 'items'
                }));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RotateCw className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Loop Over Items</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                    ↻ → →
                  </span>
                </div>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Run nodes for each item in an array
              </div>
            </div>

            {/* Merge Node */}
            <div
              className="cursor-grab hover:bg-orange-100 active:cursor-grabbing p-2 rounded border border-orange-200"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ 
                  type: 'mergeNode',
                  display_name: 'Merge Paths',
                }));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Merge className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Merge Paths</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                    ⇒ → →
                  </span>
                </div>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Combine multiple execution paths
              </div>
            </div>
          </div>

          {Object.entries(groupedTasks).map(([category, tasks]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <div className="flex items-center space-x-2">
                    {category === 'external' ? (
                      <Terminal className="h-4 w-4 text-orange-500" />
                    ) : category === 'local_code' ? (
                      <Code className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Code className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium capitalize">{getCategoryDisplayName(category)}</span>
                    <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {tasks.map((task) => {
                  let inputSchema: string;
                  let outputSchema: string;
                  
                  if ('input_schema' in task) {
                    inputSchema = task.input_schema || '{}';
                    outputSchema = task.output_schema || '{}';
                  } else {
                    inputSchema = task.input_schema || '{}';
                    outputSchema = task.output_schema || '{}';
                  }
                  
                  const { inputs, outputs } = getTaskPortDefinitions({
                    input_schema: inputSchema,
                    output_schema: outputSchema
                  });
                  
                  const functionPath = 'function_path' in task ? task.function_path : `local://${task.id}`;
                  
                  return (
                    <div
                      key={functionPath}
                      className="p-2 border rounded-md cursor-grab hover:bg-gray-50 active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate flex-1">{functionPath}</div>
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                            ⚇ {inputs.length}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                            ⚈ {outputs.length}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-500 truncate mt-1">{task.description}</div>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Properties panel for selected nodes
const PropertiesPanel: React.FC<{
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
}> = ({ selectedNode, onUpdateNode }) => {
  const [displayName, setDisplayName] = useState('');
  const [constantValue, setConstantValue] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  useEffect(() => {
    console.log('PropertiesPanel: selectedNode changed:', selectedNode);
    if (selectedNode) {
      console.log('PropertiesPanel: selectedNode.data:', selectedNode.data);
      setDisplayName((selectedNode.data as any).display_name || '');
      if (selectedNode.type === 'constantNode') {
        const value = (selectedNode.data as any).value;
        const dataType = (selectedNode.data as any).dataType || 'string';
        
        if (dataType === 'json') {
          setConstantValue(
            typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '{}')
          );
        } else if (dataType === 'number') {
          setConstantValue(String(value || 0));
        } else {
          setConstantValue(String(value || ''));
        }
      }
    }
  }, [selectedNode]);

  const handleConstantValueChange = (value: string) => {
    setConstantValue(value);
    if (selectedNode?.type === 'constantNode' && (selectedNode.data as any).dataType === 'json') {
      try {
        JSON.parse(value);
        setIsJsonValid(true);
      } catch (e) {
        setIsJsonValid(false);
      }
    }
  };

  const handleSave = () => {
    if (!selectedNode) return;

    // Start with a copy of the existing data
    const newData = { ...selectedNode.data, display_name: displayName };

    // Handle constant node value validation and parsing
    if (selectedNode.type === 'constantNode') {
      const constantData = newData as any;
      const dataType = constantData.dataType || 'string';
      
      if (dataType === 'json') {
        try {
          constantData.value = JSON.parse(constantValue);
        } catch (err) {
          toast.error("Cannot save: Invalid JSON in value field.");
          return; // Abort save
        }
      } else if (dataType === 'number') {
        if (constantValue.trim() === '' || isNaN(Number(constantValue))) {
          toast.error("Cannot save: Invalid number format.");
          return; // Abort save
        }
        constantData.value = Number(constantValue);
      } else {
        constantData.value = constantValue;
      }
      
      // Ensure dataType is set
      constantData.dataType = dataType;
    }

    // If all validation passes, call onUpdateNode once with the complete new data object
    onUpdateNode(selectedNode.id, { data: newData });
    toast.success("Node properties saved.");
  };

  if (!selectedNode) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="text-base">Properties</CardTitle>
          <CardDescription className="text-xs">Select a node to edit its properties</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          <Settings className="h-8 w-8 mb-2" />
          <p className="text-sm">No node selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full">
      <CardHeader>
        <CardTitle className="text-base">Properties</CardTitle>
        <CardDescription className="text-xs">Configure the selected node</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="display-name" className="text-xs">Display Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="text-xs"
            placeholder="Enter display name..."
          />
        </div>

        {selectedNode.type === 'constantNode' && (
          <>
            <div>
              <Label htmlFor="constant-type" className="text-xs">Data Type</Label>
              <select
                id="constant-type"
                value={(selectedNode.data as any).dataType || 'string'}
                onChange={(e) => {
                  const newDataType = e.target.value as 'string' | 'number' | 'json';
                  onUpdateNode(selectedNode.id, { 
                    data: { 
                      ...selectedNode.data, 
                      dataType: newDataType,
                      // Reset value when changing type
                      value: newDataType === 'number' ? 0 : newDataType === 'json' ? {} : ''
                    } 
                  });
                  // Update local state
                  if (newDataType === 'number') {
                    setConstantValue('0');
                  } else if (newDataType === 'json') {
                    setConstantValue('{}');
                  } else {
                    setConstantValue('');
                  }
                }}
                className="w-full p-2 border rounded mt-1 text-xs bg-white text-black"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <Label htmlFor="constant-value" className="text-xs">Value</Label>
              <Textarea
                id="constant-value"
                value={constantValue}
                onChange={(e) => handleConstantValueChange(e.target.value)}
                className={`text-xs font-mono h-24 ${!isJsonValid ? 'border-red-500' : ''}`}
                placeholder={(selectedNode.data as any).dataType === 'json' ? 'Enter JSON object...' : 'Enter value...'}
              />
              {!isJsonValid && (
                <p className="text-xs text-red-500 mt-1">Invalid JSON format.</p>
              )}
            </div>
          </>
        )}

        {selectedNode.type === 'taskNode' && (
          <>
            <div>
              <Label htmlFor="function-path" className="text-xs">Function Path</Label>
              <Input
                id="function-path"
                value={(selectedNode.data as MultiPortTaskNodeData).function_path}
                readOnly
                className="text-xs font-mono bg-gray-50"
          />
        </div>

        {(selectedNode.data as MultiPortTaskNodeData).task_type && (
          <div>
            <Label className="text-xs">Task Type</Label>
            <Badge variant="secondary" className="text-xs">
              {(selectedNode.data as MultiPortTaskNodeData).task_type === 'external' ? (
                <>
                  <Terminal className="h-3 w-3 mr-1" />
                  External
                </>
              ) : (
                <>
                  <Code className="h-3 w-3 mr-1" />
                  Internal
                </>
              )}
            </Badge>
          </div>
        )}

        {(selectedNode.data as MultiPortTaskNodeData).description && (
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={(selectedNode.data as MultiPortTaskNodeData).description || ''}
              readOnly
              className="text-xs bg-gray-50 h-20"
            />
          </div>
        )}

        {/* Port Information */}
        <div>
          <Label className="text-xs">Ports</Label>
          <div className="space-y-2 mt-1">
            {(() => {
              const nodeData = selectedNode.data as MultiPortTaskNodeData;
              const { inputs, outputs } = getTaskPortDefinitions({
                input_schema: nodeData.input_schema,
                output_schema: nodeData.output_schema
              });
              
              return (
                <>
                  <div className="text-xs">
                    <div className="font-medium text-blue-700 mb-1">
                      ⚇ Inputs ({inputs.length})
                    </div>
                    {inputs.length > 0 ? (
                      <div className="space-y-1 pl-2">
                        {inputs.map((port) => (
                          <div key={port.id} className="flex items-center justify-between">
                            <span className="truncate">{port.label}</span>
                            <div className="flex items-center space-x-1">
                              {port.required && <span className="text-red-500">*</span>}
                              <span className="text-gray-500">({port.type})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs pl-2">No input ports</div>
                    )}
                  </div>
                  
                  <div className="text-xs">
                    <div className="font-medium text-green-700 mb-1">
                      ⚈ Outputs ({outputs.length})
                    </div>
                    {outputs.length > 0 ? (
                      <div className="space-y-1 pl-2">
                        {outputs.map((port) => (
                          <div key={port.id} className="flex items-center justify-between">
                            <span className="truncate">{port.label}</span>
                            <span className="text-gray-500">({port.type})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs pl-2">No output ports</div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
          </>
        )}

        {/* JSON Inspector */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">JSON Inspector</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="h-6 px-2 text-xs"
            >
              {showJsonInspector ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showJsonInspector && selectedNode && (
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Raw Node Data</Label>
              <div className="bg-gray-50 border rounded p-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-mono whitespace-pre-wrap text-black">
                  {(() => {
                    console.log('JSON Inspector: selectedNode:', selectedNode);
                    
                    // Create a safe copy of the node data, excluding React Flow internals
                    const safeNodeData = {
                      id: selectedNode.id,
                      type: selectedNode.type,
                      position: selectedNode.position,
                      data: selectedNode.data,
                      // Include other safe properties
                      ...(selectedNode.draggable !== undefined && { draggable: selectedNode.draggable }),
                      ...(selectedNode.selectable !== undefined && { selectable: selectedNode.selectable }),
                      ...(selectedNode.connectable !== undefined && { connectable: selectedNode.connectable }),
                      ...(selectedNode.deletable !== undefined && { deletable: selectedNode.deletable }),
                      ...(selectedNode.hidden !== undefined && { hidden: selectedNode.hidden }),
                      ...(selectedNode.selected !== undefined && { selected: selectedNode.selected }),
                      ...(selectedNode.dragging !== undefined && { dragging: selectedNode.dragging }),
                      ...(selectedNode.width !== undefined && { width: selectedNode.width }),
                      ...(selectedNode.height !== undefined && { height: selectedNode.height }),
                      ...(selectedNode.parentId !== undefined && { parentId: selectedNode.parentId }),
                      ...(selectedNode.zIndex !== undefined && { zIndex: selectedNode.zIndex }),
                      ...(selectedNode.sourcePosition !== undefined && { sourcePosition: selectedNode.sourcePosition }),
                      ...(selectedNode.targetPosition !== undefined && { targetPosition: selectedNode.targetPosition }),
                      ...(selectedNode.dragHandle !== undefined && { dragHandle: selectedNode.dragHandle }),
                      ...(selectedNode.extent !== undefined && { extent: selectedNode.extent }),
                      ...(selectedNode.expandParent !== undefined && { expandParent: selectedNode.expandParent }),
                      ...(selectedNode.ariaLabel !== undefined && { ariaLabel: selectedNode.ariaLabel }),
                      ...(selectedNode.origin !== undefined && { origin: selectedNode.origin }),
                      ...(selectedNode.handles !== undefined && { handles: selectedNode.handles }),
                      ...(selectedNode.style !== undefined && { style: selectedNode.style }),
                      ...(selectedNode.className !== undefined && { className: selectedNode.className }),
                      ...(selectedNode.ariaRole !== undefined && { ariaRole: selectedNode.ariaRole }),
                      ...(selectedNode.domAttributes !== undefined && { domAttributes: selectedNode.domAttributes }),
                    };
                    
                    console.log('JSON Inspector: safeNodeData:', safeNodeData);
                    const jsonResult = JSON.stringify(safeNodeData, null, 2);
                    console.log('JSON Inspector: JSON.stringify result:', jsonResult);
                    return jsonResult || 'No data available';
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} size="sm" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Save workflow dialog
const SaveWorkflowDialog: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (name: string, description: string) => Promise<void>;
  currentName?: string;
  currentDescription?: string;
}> = ({ isOpen, setIsOpen, onSave, currentName = '', currentDescription = '' }) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentName);
    setDescription(currentDescription);
  }, [currentName, currentDescription, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(name.trim(), description.trim());
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Workflow</DialogTitle>
          <DialogDescription>Enter the details for your workflow</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name..."
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter workflow description..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main workflow editor component
const WorkflowEditor: React.FC = () => {
    const { workflowId } = useParams<{ workflowId: string }>();
    const navigate = useNavigate();
  const isEditMode = !!workflowId;

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Application state
  const [taskConfigs, setTaskConfigs] = useState<TaskConfig[]>([]);
  const [localCodeTasks, setLocalCodeTasks] = useState<CodeTaskDefinition[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isLocalCodeTaskDialogOpen, setIsLocalCodeTaskDialogOpen] = useState(false);
  const [selectedLocalCodeTask, setSelectedLocalCodeTask] = useState<Partial<CodeTaskDefinition> | null>(null);

  const { screenToFlowPosition } = useReactFlow();

  // Load initial data
    useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load task configurations
        const configs = await taskService.getTaskConfigs();
        setTaskConfigs(configs);

        // Load workflow if editing
        if (isEditMode && workflowId) {
          const workflowData = await workflowService.getWorkflowDefinitionById(workflowId);
          setWorkflow(workflowData);
          setLocalCodeTasks(workflowData.local_task_definitions || []);
          
          // Convert workflow data to React Flow format
          const flowNodes = workflowData.nodes.map(node => ({
            ...node,
            // Determine React Flow type based on backend type - updated for new node types
            type: node.type || 'taskNode', // Use the type directly or default to taskNode
            data: {
              ...node.data,
              // Ensure backend type field exists for backward compatibility
              type: node.data.type || (() => {
                switch(node.type) {
                  case 'ifNode': return 'if';
                  case 'mergeNode': return 'merge';
                  case 'codeTaskNode': return 'code';
                  default: return 'task';
                }
              })()
            }
          }));
          const flowEdges = workflowData.edges.map(edge => ({
            ...edge,
            markerEnd: { type: MarkerType.ArrowClosed },
          }));
          
          setNodes(flowNodes);
          setEdges(flowEdges);
        }
        } catch (error) {
        toast.error('Failed to load workflow data');
        console.error('Error loading workflow data:', error);
        } finally {
        setIsLoading(false);
        }
    };

    loadData();
  }, [workflowId, isEditMode, setNodes, setEdges]);

  // Handle drag and drop from task palette
  const onDragStart = useCallback((event: React.DragEvent, task: TaskConfig | CodeTaskDefinition) => {
    event.dataTransfer.setData('application/json', JSON.stringify(task));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

  const onCreateLocalCodeTask = () => {
    setSelectedLocalCodeTask({
      id: `local-${Date.now()}`,
      name: '',
      description: '',
      code_snippet: '',
      main_function_name: '',
      input_schema: '{}',
      output_schema: '{}',
    });
    setIsLocalCodeTaskDialogOpen(true);
  };

  const refreshTaskConfigs = async () => {
    try {
      const configs = await taskService.getTaskConfigs();
      setTaskConfigs(configs);
      toast.success('Task definitions refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh task definitions');
      console.error('Error refreshing task configs:', error);
    }
  };

  const onSaveLocalCodeTask = (task: CodeTaskDefinition) => {
    setLocalCodeTasks(prev => {
      const existingIndex = prev.findIndex(t => t.id === task.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = task;
        return updated;
      } else {
        return [...prev, task];
      }
    });
    toast.success(`Local code task "${task.name}" saved.`);
  };

    const onDrop = useCallback(
    (event: React.DragEvent) => {
            event.preventDefault();

      const dragData = JSON.parse(event.dataTransfer.getData('application/json'));

      // check if the dropped element is valid
      if (!dragData) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNode: Node;

      if (dragData.type === 'ifNode') {
        // Create If node
        console.log('Creating If node with data:', dragData);
        newNode = {
          id: `if-${Date.now()}`,
          type: 'ifNode',
          position,
          data: {
            display_name: dragData.display_name,
            conditions: dragData.conditions || [],
            type: 'if', // Backend type field
          },
        };
        console.log('Created If node:', newNode);
      } else if (dragData.type === 'mergeNode') {
        // Create Merge node
        console.log('Creating Merge node with data:', dragData);
        newNode = {
          id: `merge-${Date.now()}`,
          type: 'mergeNode',
          position,
          data: {
            display_name: dragData.display_name,
            type: 'merge', // Backend type field
          },
        };
        console.log('Created Merge node:', newNode);
      } else if (dragData.type === 'loopNode') {
        // Create Loop node
        console.log('Creating Loop node with data:', dragData);
        newNode = {
          id: `loop-${Date.now()}`,
          type: 'loopNode',
          position,
          data: {
            display_name: dragData.display_name,
            input_array_handle: dragData.input_array_handle,
            type: 'loop', // Backend type field
          },
        };
        console.log('Created Loop node:', newNode);
      } else if (dragData.type === 'constantNode') {
        // Create Constant node
        console.log('Creating Constant node with data:', dragData);
        newNode = {
          id: `constant-${Date.now()}`,
          type: 'constantNode',
          position,
          data: {
            display_name: dragData.display_name || 'Constant',
            value: dragData.value || '',
            dataType: 'string' as const, // Default to string
            type: 'constant', // Backend type field
          },
        };
        console.log('Created Constant node:', newNode);
      } else if (dragData.task_type === 'code' && dragData.isLocal) {
        // Create local code task node
        console.log('Creating local code task node with data:', dragData);
        newNode = {
          id: dragData.id, // Use the UUID generated for local tasks
          type: 'taskNode', // Still a taskNode in React Flow, but with code-specific data
          position,
          data: {
            function_path: dragData.function_path,
            display_name: dragData.name,
            task_type: 'code',
            description: dragData.description,
            code_snippet: dragData.code_snippet,
            main_function_name: dragData.main_function_name,
            input_schema: dragData.input_schema,
            output_schema: dragData.output_schema,
            type: 'code', // Backend type field
          },
        };
        console.log('Created Local Code Task node:', newNode);
      } else {
        // Create task node (existing logic)
        const taskData = dragData as TaskConfig;
        newNode = {
          id: `${taskData.function_path}-${Date.now()}`,
          type: 'taskNode',
          position,
          data: {
            function_path: taskData.function_path,
            display_name: taskData.function_path.split('.').pop() || taskData.function_path,
            task_type: taskData.task_type,
            description: taskData.description,
            input_schema: taskData.input_schema,
            output_schema: taskData.output_schema,
            type: 'task', // Backend type field
          },
        };
      }

      console.log('Final newNode to be added:', newNode);
      setNodes((nds) => nds.concat(newNode));
        },
    [screenToFlowPosition, setNodes]
    );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode || !params.sourceHandle || !params.targetHandle) return;

      const sourceType = getPortType(sourceNode, params.sourceHandle, true);
      const targetType = getPortType(targetNode, params.targetHandle, false);

      // Type Compatibility Rules
      const isCompatible = sourceType === 'any' || targetType === 'any' || sourceType === targetType;

      if (!isCompatible) {
        toast.error("Connection not allowed", {
          description: `Cannot connect type '${sourceType}' to '${targetType}'.`,
        });
        return; // Block the connection
      }

      const edge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${params.sourceHandle}-${params.targetHandle}`,
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          mappings: [
            {
              source_handle: params.sourceHandle || 'result',
              target_handle: params.targetHandle || 'input',
            },
          ],
        },
      } as Edge;
      
      setEdges((eds) => addEdge(edge, eds));
    },
    [nodes, setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node properties
  const onUpdateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      );
    },
    [setNodes]
  );

  // Save workflow
  const handleSaveWorkflow = async (name: string, description: string) => {
        try {
            const workflowData = {
        name,
        description,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type || 'taskNode',
          position: node.position,
          data: node.data,
        })) as WorkflowNode[],
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || 'result',
          targetHandle: edge.targetHandle || 'input',
          data: edge.data,
        })) as WorkflowEdge[],
        local_task_definitions: localCodeTasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          code_snippet: task.code_snippet,
          main_function_name: task.main_function_name,
          input_schema: task.input_schema,
          output_schema: task.output_schema,
        })),
            };

      if (isEditMode && workflowId) {
                await workflowService.updateWorkflowDefinition(workflowId, workflowData);
        toast.success('Workflow updated successfully');
            } else {
        const createdWorkflow = await workflowService.createWorkflowDefinition(workflowData);
        toast.success('Workflow created successfully');
        navigate(`/admin/workflows/edit/${createdWorkflow._id}`, { replace: true });
      }
    } catch (error: any) {
      toast.error('Failed to save workflow', {
        description: error.message || 'Please try again',
      });
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  // Trigger workflow execution
  const handleTriggerWorkflow = async () => {
    if (!workflow && !isEditMode) {
      toast.error('Please save the workflow before triggering execution');
      return;
    }

    try {
      const workflowIdToUse = workflowId || workflow?._id;
      if (!workflowIdToUse) return;

      await workflowService.triggerWorkflowExecution(workflowIdToUse, {});
      toast.success('Workflow execution triggered successfully');
    } catch (error: any) {
      toast.error('Failed to trigger workflow execution', {
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workflow editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {isEditMode ? `Edit: ${workflow?.name || 'Loading...'}` : 'Create New Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Modify your existing workflow' : 'Design a new automated workflow'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerWorkflow}
            disabled={!isEditMode && !workflow}
                            >
            <Play className="h-4 w-4 mr-2" />
            Test Run
          </Button>
          <Button
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </div>
                            </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Task Palette */}
                <div className="border-r bg-gray-50">
          <TaskPalette 
            taskConfigs={taskConfigs} 
            localCodeTasks={localCodeTasks}
            onDragStart={onDragStart} 
            onCreateLocalCodeTask={onCreateLocalCodeTask}
            onRefreshTaskConfigs={refreshTaskConfigs}
          />
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
                        nodeTypes={createNodeTypes()}
            connectionMode={ConnectionMode.Loose}
                        fitView
            className="bg-gray-50"
                    >
                        <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-right" className="bg-white p-2 rounded shadow">
              <div className="text-xs text-muted-foreground">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </Panel>
                    </ReactFlow>
        </div>

        {/* Properties Panel */}
        <div className="border-l bg-gray-50">
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={onUpdateNode}
                    />
                </div>
      </div>

      {/* Save Dialog */}
      <SaveWorkflowDialog
        isOpen={saveDialogOpen}
        setIsOpen={setSaveDialogOpen}
        onSave={handleSaveWorkflow}
        currentName={workflow?.name}
        currentDescription={workflow?.description}
      />

      {selectedLocalCodeTask && (
        <CodeTaskEditorDialog
          open={isLocalCodeTaskDialogOpen}
          onClose={() => {
            setIsLocalCodeTaskDialogOpen(false);
            setSelectedLocalCodeTask(null);
          }}
          onSave={(task) => {
            onSaveLocalCodeTask(task);
            setIsLocalCodeTaskDialogOpen(false);
            setSelectedLocalCodeTask(null);
          }}
          initialTask={selectedLocalCodeTask as CodeTaskDefinition}
          isLocal={true}
        />
      )}
        </div>
    );
};

const WorkflowEditorWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
};

export default WorkflowEditorWrapper; 