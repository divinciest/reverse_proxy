// /components/ConstantNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileJson } from 'lucide-react';

export const ConstantNode = ({ data, selected }: { data: any, selected: boolean }) => {
    const isJson = data.dataType === 'json';
    const valueIsObject = isJson && typeof data.value === 'object' && data.value !== null && !Array.isArray(data.value);
    const outputHandles = valueIsObject ? Object.keys(data.value) : ['output'];

    const displayValue = data.value === null || data.value === undefined 
        ? 'null' 
        : typeof data.value === 'object'
        ? JSON.stringify(data.value)
        : String(data.value);

    return (
        <div className={`relative px-4 py-2 rounded-lg border-2 shadow-sm border-gray-400 bg-gray-50 shadow-gray-100 min-w-[180px] ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
            <div className="flex items-center space-x-2">
                <FileJson className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">{data.display_name || 'Constant'}</span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    {data.dataType || 'string'}
                </span>
            </div>
            <code className="block text-xs text-gray-600 mt-2 p-2 bg-white rounded border border-gray-200 truncate" title={displayValue}>
                {displayValue}
            </code>

            {/* Dynamic Output Handles */}
            {outputHandles.map((key, i) => (
                <div key={key} className="absolute right-0" style={{ top: `${(i + 1) * 100 / (outputHandles.length + 1)}%` }}>
                    <Handle type="source" position={Position.Right} id={key} className="w-3 h-3 border-2 bg-gray-500 border-gray-600" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap shadow-sm z-10">
                        {key}
                    </div>
                </div>
            ))}
        </div>
    );
}; 