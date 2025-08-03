import { PortDefinition, PortType, mapJsonTypeToPortType } from '@/types/portTypes';
import { Node } from '@xyflow/react';

// Interface for JSON Schema properties
interface JsonSchemaProperty {
  type?: string;
  description?: string;
  default?: any;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
}

// Interface for JSON Schema
interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  description?: string;
}

// Add a simple type mapping
const schemaTypeToJsType = (schemaType: string | undefined): string => {
  if (!schemaType) return 'any';
  switch (schemaType.toLowerCase()) {
    case 'string': return 'string';
    case 'number': 
    case 'integer': return 'number';
    case 'boolean': return 'boolean';
    case 'object': return 'object';
    case 'array': return 'array';
    default: return 'any';
  }
};

export const getPortType = (node: Node, handleId: string, isSource: boolean): string => {
  if (!node) return 'any';

  switch (node.type) {
    case 'constantNode': {
      const { dataType, value } = node.data;
      if (dataType === 'json') {
        if (isSource && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const propertyValue = value[handleId];
          if (Array.isArray(propertyValue)) return 'array';
          return typeof propertyValue; // 'string', 'number', 'boolean', 'object', 'undefined'
        }
        return 'object'; // The whole JSON object itself
      }
      return dataType; // 'string' or 'number'
    }

    case 'taskNode': {
      const { inputs, outputs } = getTaskPortDefinitions(node.data);
      const ports = isSource ? outputs : inputs;
      const port = ports.find(p => p.id === handleId);
      return schemaTypeToJsType(port?.type);
    }

    case 'loopNode': {
      if (isSource) {
        // The 'loop' output provides a single item, which could be of any type.
        // The 'done' output provides an array of the results.
        return handleId === 'loop' ? 'any' : 'array';
      }
      // Both 'input' and 'continue' handles accept arrays or single items respectively.
      return 'any';
    }

    // Default for ifNode, mergeNode, etc.
    default:
      return 'any';
  }
};

/**
 * Converts a JSON Schema string to an array of port definitions
 * @param schemaString - JSON Schema as a string
 * @param portPrefix - Prefix for port IDs (e.g., 'input' or 'output')
 * @returns Array of PortDefinition objects
 */
export function parseSchemaToPortDefinitions(
  schemaString: string,
  portPrefix: string = ''
): PortDefinition[] {
  if (!schemaString || schemaString.trim() === '') {
    return [];
  }

  try {
    const schema: JsonSchema = JSON.parse(schemaString);
    
    // Handle non-object schemas by creating a single port
    if (schema.type && schema.type !== 'object') {
      return [{
        id: portPrefix || 'value',
        label: schema.description || (portPrefix || 'Value'),
        type: mapJsonTypeToPortType(schema.type),
        description: schema.description,
        required: true
      }];
    }

    // Handle object schemas with properties
    if (!schema.properties) {
      // If no properties defined, create a generic object port
      return [{
        id: portPrefix || 'data',
        label: schema.description || (portPrefix || 'Data'),
        type: PortType.OBJECT,
        description: schema.description || 'Generic data object',
        required: false
      }];
    }

    const requiredFields = schema.required || [];
    const ports: PortDefinition[] = [];

    Object.entries(schema.properties).forEach(([key, property]) => {
      const port: PortDefinition = {
        id: key,
        label: formatPropertyName(key),
        type: mapJsonTypeToPortType(property.type || 'any'),
        description: property.description,
        required: requiredFields.includes(key),
        defaultValue: property.default
      };

      ports.push(port);
    });

    return ports;
  } catch (error) {
    console.warn('Failed to parse JSON schema:', error);
    // Return a fallback port for invalid schemas
    return [{
      id: portPrefix || 'data',
      label: 'Data',
      type: PortType.ANY,
      description: 'Invalid schema - generic data port',
      required: false
    }];
  }
}

/**
 * Formats a property name for display
 * Converts snake_case and camelCase to Title Case
 */
function formatPropertyName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Creates default input ports when no schema is available
 */
export function createDefaultInputPorts(): PortDefinition[] {
  return [{
    id: 'input',
    label: 'Input',
    type: PortType.ANY,
    description: 'Generic input data',
    required: false
  }];
}

/**
 * Creates default output ports when no schema is available
 */
export function createDefaultOutputPorts(): PortDefinition[] {
  return [{
    id: 'result',
    label: 'Result',
    type: PortType.ANY,
    description: 'Task execution result',
    required: false
  }];
}

/**
 * Gets input and output port definitions from task configuration
 */
export function getTaskPortDefinitions(taskConfig: {
  input_schema?: string;
  output_schema?: string;
}): {
  inputs: PortDefinition[];
  outputs: PortDefinition[];
} {
  const inputs = taskConfig.input_schema 
    ? parseSchemaToPortDefinitions(taskConfig.input_schema, 'input')
    : createDefaultInputPorts();
    
  const outputs = taskConfig.output_schema
    ? parseSchemaToPortDefinitions(taskConfig.output_schema, 'output') 
    : createDefaultOutputPorts();

  return { inputs, outputs };
} 