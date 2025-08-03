import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TaskConfig } from '@/utils/services/taskService';
import { MultiPortTaskNode, MultiPortTaskNodeData } from '@/components/MultiPortTaskNode';

interface ChildWorkflow {
  nodes: Node[];
  edges: Edge[];
}

interface ChildWorkflowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (childWorkflow: ChildWorkflow) => void;
  initialWorkflow: ChildWorkflow;
  taskConfigs: TaskConfig[];
}

// Node types for the child workflow editor
const childNodeTypes = {
  taskNode: MultiPortTaskNode,
};

const ChildWorkflowEditorModal: React.FC<ChildWorkflowEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWorkflow,
  taskConfigs
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow.edges);
  const [selectedTaskConfig, setSelectedTaskConfig] = useState<TaskConfig | null>(null);

  // Reset the editor when the modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
    }
  }, [isOpen, initialWorkflow, setNodes, setEdges]);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const edge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      } as Edge;
      
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Handle drag and drop from task palette
  const onDragStart = useCallback((event: React.DragEvent, task: TaskConfig) => {
    event.dataTransfer.setData('application/json', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const taskData = JSON.parse(event.dataTransfer.getData('application/json')) as TaskConfig;

      if (!taskData) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100, // Adjust for modal position
        y: event.clientY - reactFlowBounds.top - 100,
      };

      const newNode: Node<MultiPortTaskNodeData> = {
        id: `child_${taskData.function_path}-${Date.now()}`,
        type: 'taskNode',
        position,
        data: {
          function_path: taskData.function_path,
          display_name: taskData.function_path.split('.').pop() || taskData.function_path,
          task_type: taskData.task_type,
          description: taskData.description,
          input_schema: taskData.input_schema,
          output_schema: taskData.output_schema,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Add input/output helper nodes
  const addInputNode = () => {
    const newNode: Node = {
      id: `input-${Date.now()}`,
      type: 'input',
      position: { x: 50, y: 100 },
      data: { 
        label: 'Loop Input',
        description: 'Current item and index from foreach loop'
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addOutputNode = () => {
    const newNode: Node = {
      id: `output-${Date.now()}`,
      type: 'output',
      position: { x: 400, y: 100 },
      data: { 
        label: 'Loop Output',
        description: 'Result for this iteration'
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSave = () => {
    const childWorkflow = {
      nodes,
      edges,
    };
    onSave(childWorkflow);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial state
    setNodes(initialWorkflow.nodes);
    setEdges(initialWorkflow.edges);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <span>Edit ForEach Loop Logic</span>
            <Badge variant="secondary">Child Workflow</Badge>
          </DialogTitle>
          <DialogDescription>
            Design the workflow that will execute for each item in the array. 
            Each iteration will receive 'item' and 'index' as inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Task Palette */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Loop Helpers</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addInputNode}
                    className="w-full justify-start"
                  >
                    <Plus size={14} className="mr-2" />
                    Input Node
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOutputNode}
                    className="w-full justify-start"
                  >
                    <Plus size={14} className="mr-2" />
                    Output Node
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Available Tasks</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {taskConfigs.map((task) => (
                    <Card
                      key={task.function_path}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                    >
                      <CardContent className="p-3">
                        <div className="text-sm font-medium truncate">
                          {task.function_path.split('.').pop()}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {task.function_path}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
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
              nodeTypes={childNodeTypes}
              fitView
              className="bg-gray-50"
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} />
            </ReactFlow>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            <X size={14} className="mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save size={14} className="mr-2" />
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChildWorkflowEditorModal; 