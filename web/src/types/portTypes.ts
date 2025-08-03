// Port type definitions for workflow nodes
export enum PortType {
  STRING = 'string',
  NUMBER = 'number', 
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  ANY = 'any'
}

// Type colors for visual representation (blueprint style)
export const portTypeColors = {
  [PortType.STRING]: '#3498db',  // blue
  [PortType.NUMBER]: '#2ecc71',  // green
  [PortType.BOOLEAN]: '#e74c3c', // red
  [PortType.ARRAY]: '#9b59b6',   // purple
  [PortType.OBJECT]: '#f39c12',  // orange
  [PortType.ANY]: '#95a5a6'      // gray
};

// Port definition interface
export interface PortDefinition {
  id: string;
  label: string;
  type: PortType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

// Helper function to map JSON schema types to PortType enum
export const mapJsonTypeToPortType = (type: string): PortType => {
  switch (type?.toLowerCase()) {
    case 'string': return PortType.STRING;
    case 'number': 
    case 'integer': return PortType.NUMBER;
    case 'boolean': return PortType.BOOLEAN;
    case 'array': return PortType.ARRAY;
    case 'object': return PortType.OBJECT;
    default: return PortType.ANY;
  }
};

// Helper function to get port type color
export const getPortTypeColor = (type: PortType): string => {
  return portTypeColors[type] || portTypeColors[PortType.ANY];
}; 