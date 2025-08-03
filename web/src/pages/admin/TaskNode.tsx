/**
 * TaskNode.tsx
 *
 * This component is a custom node for the React Flow canvas. It is designed to
 * visually represent a single task from the backend. It dynamically renders
 * input and output handles based on the task's function signature, allowing
 * it to be connected to other tasks in the workflow.
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FunctionSignature } from '@/utils/services/taskService';

// Define the data structure for the TaskNode
export interface TaskNodeData {
    function_path: string;
    signature: FunctionSignature;
}

// Custom styling for the node
const nodeStyles = {
    base: 'rounded-md border bg-card text-card-foreground shadow-sm p-3 w-[250px]',
    header: 'font-semibold mb-2',
    portSection: 'text-xs font-medium mt-2',
    portList: 'space-y-1',
    port: 'flex items-center text-xs justify-between',
    portLabel: 'mr-2',
};

export const TaskNode = memo(({ data }: NodeProps<TaskNodeData>) => {
    const { signature } = data;

    // Filter out the 'context' parameter from the inputs
    const inputs = signature.parameters.filter(p => p.name !== 'context');

    return (
        <div className={nodeStyles.base}>
            <div className={nodeStyles.header}>{signature.function_path.split('.').pop()}</div>
            
            {/* Input ports */}
            {inputs.length > 0 && (
                <div>
                    <div className={nodeStyles.portSection}>Inputs</div>
                    <div className={nodeStyles.portList}>
                        {inputs.map((input) => (
                            <div key={input.name} className={nodeStyles.port}>
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={input.name}
                                    style={{ background: '#555' }}
                                />
                                <span className={nodeStyles.portLabel}>{input.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Output port */}
            <div>
                <div className={nodeStyles.portSection}>Output</div>
                <div className={nodeStyles.portList}>
                    <div className={nodeStyles.port}>
                        <span className={nodeStyles.portLabel}>result</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="result"
                            style={{ background: '#555' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}); 