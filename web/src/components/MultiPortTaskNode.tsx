import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Terminal, Code, Edit } from 'lucide-react';
import { PortDefinition, PortType, getPortTypeColor } from '@/types/portTypes';
import { getTaskPortDefinitions } from '@/utils/schemaParser';

// Extended node data interface for multi-port nodes
export interface MultiPortTaskNodeData extends Record<string, unknown> {
  function_path: string;
  display_name: string;
  task_type?: 'internal' | 'external' | 'code';
  description?: string;
  input_schema?: string;
  output_schema?: string;
  code_snippet?: string;
  main_function_name?: string;
  input_schema?: string;
  output_schema?: string;
  // Execution state for workflow monitoring
  executionState?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

// Props interface
interface MultiPortTaskNodeProps extends NodeProps {
  data: MultiPortTaskNodeData;
  onEditNode?: (nodeId: string) => void;
}

// Map PortType to the reference PortType for color compatibility
const mapTypeToPortType = (type: PortType): string => {
  switch (type) {
    case PortType.STRING: return 'string';
    case PortType.NUMBER: return 'number';
    case PortType.BOOLEAN: return 'boolean';
    case PortType.ARRAY: return 'array';
    case PortType.OBJECT: return 'object';
    default: return 'any';
  }
};

// Main component
const MultiPortTaskNode: React.FC<MultiPortTaskNodeProps> = memo(({ 
  id, 
  data, 
  selected, 
  onEditNode 
}) => {
  // Type assertion for data
  const nodeData = data as MultiPortTaskNodeData;
  
  // Parse input and output ports from schemas
  const { inputs, outputs } = useMemo(() => {
    return getTaskPortDefinitions({
      input_schema: nodeData.input_schema,
      output_schema: nodeData.output_schema
    });
  }, [nodeData.input_schema, nodeData.output_schema]);

  const isExternalTask = nodeData.task_type === 'external';
  const isCodeTask = nodeData.task_type === 'code';
  
    const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEditNode) {
      onEditNode(id);
    }
  };

  return (
    <div className={`
      bg-slate-800 border border-slate-600 rounded-lg shadow-lg min-w-[200px] relative
      ${selected ? 'ring-2 ring-blue-400 shadow-blue-400/50' : ''}
      ${nodeData.executionState === 'running' ? 'border-blue-400 shadow-blue-400/30' : ''}
      ${nodeData.executionState === 'completed' ? 'border-green-400 shadow-green-400/30' : ''}
      ${nodeData.executionState === 'failed' ? 'border-red-400 shadow-red-400/30' : ''}
    `}>
      {/* Node header with edit button */}
      <div className="bg-slate-700 border-b border-slate-600 p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isExternalTask ? (
            <Terminal className="h-4 w-4 text-orange-400" />
          ) : isCodeTask ? (
            <Code className="h-4 w-4 text-purple-400" />
          ) : (
            <Code className="h-4 w-4 text-blue-400" />
          )}
          <span className="text-white font-medium text-sm">{nodeData.display_name}</span>
        </div>
        {onEditNode && (
          <button 
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-600 transition-colors" 
            onClick={handleEditClick}
            title="Edit node"
          >
            <Edit size={12} />
          </button>
        )}
      </div>
      
      {/* Execution status indicator */}
      <div className={`text-xs px-3 py-1 text-center border-b border-slate-600 ${
        nodeData.executionState === 'completed' ? 'bg-green-900/50 text-green-300' : 
        nodeData.executionState === 'running' ? 'bg-blue-900/50 text-blue-300' :
        nodeData.executionState === 'failed' ? 'bg-red-900/50 text-red-300' :
        'bg-slate-700 text-slate-300'
      }`}>
        {nodeData.executionState === 'completed' ? 'Completed' : 
         nodeData.executionState === 'running' ? 'Running' : 
         nodeData.executionState === 'failed' ? 'Failed' : 'Ready'}
      </div>
      
      {/* Node description */}
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-slate-300 border-b border-slate-600">
          {nodeData.description}
        </div>
      )}
      
      {/* Node content */}
      <div className="p-3">
        {/* Ports container for proper spacing */}
        <div className="space-y-3">
          {/* Input ports */}
          {inputs.map((input, idx) => (
            <div key={`input-${input.id}`} className="relative flex items-center" style={{ marginBottom: 15 }}>
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ 
                  backgroundColor: getPortTypeColor(input.type),
                  border: '2px solid #1e293b',
                  width: '12px',
                  height: '12px',
                  left: -5
                }}
              />
              <div className="flex items-center space-x-2 ml-2">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getPortTypeColor(input.type) }}
                >
                  {mapTypeToPortType(input.type).charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-200 text-sm" title={input.description || input.label}>
                  {input.label}
                  {input.required && <span className="text-red-400 ml-1">*</span>}
                </span>
              </div>
            </div>
          ))}
          
          {/* Output ports */}
          {outputs.map((output, idx) => (
            <div key={`output-${output.id}`} className="relative flex items-center justify-end" style={{ marginBottom: 15 }}>
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-slate-200 text-sm" title={output.description || output.label}>
                  {output.label}
                </span>
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getPortTypeColor(output.type) }}
                >
                  {mapTypeToPortType(output.type).charAt(0).toUpperCase()}
                </div>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{ 
                  backgroundColor: getPortTypeColor(output.type),
                  border: '2px solid #1e293b',
                  width: '12px',
                  height: '12px',
                  right: -5
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Function path display */}
      <div className="text-center text-xs text-slate-400 font-mono p-2 border-t border-slate-600 bg-slate-900/50 rounded-b-lg">
        {nodeData.function_path}
      </div>
    </div>
  );
});

MultiPortTaskNode.displayName = 'MultiPortTaskNode';

export { MultiPortTaskNode }; 