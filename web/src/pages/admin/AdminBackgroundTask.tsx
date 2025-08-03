// /components/admin/AdminBackgroundTask.tsx
// A complete, unified frontend for managing the new task system.
// Supports both internal (Python thread) and external (shell process) tasks.
// Updated to support JSON Schemas and Python Mappers.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
    Activity, Ban, CheckCircle2, Clock, Copy, Edit, Eye, HardHat, Hourglass, PlusCircle, RefreshCw,
    Repeat, Rocket, Save, Search, Settings, Terminal, Trash2, Wand2, XCircle, AlertTriangle, Code, ChevronDown,
    FileJson, FunctionSquare
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { taskService, Task, TaskConfig, TaskPagination, GetTasksParams, TriggerTaskPayload, TaskStatus, TASK_STATUS, FunctionSignature, CodeTaskDefinition, TaskDefinition, TaskSchedule } from '@/utils/services/taskService';
import CodeTaskEditorDialog from '@/components/CodeTaskEditorDialog';
import { useDebounce } from '@/hooks/useDebounce'; 

// --- Utility Components ---

const FormattedStackTrace: React.FC<{ error: string }> = ({ error }) => {
    const [message, stack] = React.useMemo(() => {
        const stackTraceHeaders = [ 'Traceback (most recent call last):' ];
        let mainMessage = error;
        let stackTrace: string | null = null;
        for (const header of stackTraceHeaders) {
            if (error.includes(header)) {
                const parts = error.split(header);
                mainMessage = parts[0].trim();
                stackTrace = parts.slice(1).join(header).trim();
                break;
            }
        }
        return [mainMessage, stackTrace ? stackTrace.trim() : null];
    }, [error]);

    const renderStackLine = (line: string, index: number) => {
        const fileLineRegex = /File "([^"]+)", line (\d+), in (.*)/;
        const match = line.match(fileLineRegex);
        if (match) {
            const [, filePath, lineNumber, functionName] = match;
            const fileName = filePath.split('/').pop();
            return (
                <div key={index} className="flex items-start">
                    <span className="w-8 text-right pr-4 text-gray-500 select-none">{index + 1}</span>
                    <div className="flex-1">
                        <span className="text-gray-400">File: </span><span className="text-blue-400" title={filePath}>"{fileName}"</span>
                        <span className="text-gray-400">, line </span><span className="text-green-400 font-semibold">{lineNumber}</span>
                        <span className="text-gray-400">, in </span><span className="text-yellow-400">{functionName.trim()}</span>
                    </div>
                </div>
            );
        }
        return (
            <div key={index} className="flex items-start">
                <span className="w-8 text-right pr-4 text-gray-500 select-none">{index + 1}</span>
                <code className="flex-1 pl-4 opacity-80 whitespace-pre-wrap">{line.trim()}</code>
            </div>
        );
    };

    return (
        <div>
            <p className="font-bold text-red-600 dark:text-red-400">Error Details:</p>
            <div className="mt-2 bg-red-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                <p className="text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">{message}</p>
                {stack && (
                    <div className="mt-3 pt-3 border-t border-red-200/50 dark:border-gray-700">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Stack Trace:</p>
                        <div className="bg-gray-900 text-white p-4 rounded-md text-xs font-mono break-all overflow-x-auto">
                            {stack.split('\n').map(renderStackLine)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
    const statusInfo = {
        [TASK_STATUS.PENDING]: { icon: <Hourglass className="mr-1 h-3 w-3" />, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        [TASK_STATUS.RUNNING]: { icon: <RefreshCw className="mr-1 h-3 w-3 animate-spin" />, text: 'Running', className: 'bg-blue-100 text-blue-800 border-blue-300' },
        [TASK_STATUS.COMPLETED]: { icon: <CheckCircle2 className="mr-1 h-3 w-3" />, text: 'Completed', className: 'bg-green-100 text-green-800 border-green-300' },
        [TASK_STATUS.FAILED]: { icon: <XCircle className="mr-1 h-3 w-3" />, text: 'Failed', className: 'bg-red-100 text-red-800 border-red-300' },
        [TASK_STATUS.CANCELED]: { icon: <Ban className="mr-1 h-3 w-3" />, text: 'Canceled', className: 'bg-gray-100 text-gray-800 border-gray-300' },
        [TASK_STATUS.FAILED_TO_CANCEL]: { icon: <AlertTriangle className="mr-1 h-3 w-3" />, text: 'Cancellation Failed', className: 'bg-orange-600 text-white border-orange-700' },
    };
    const info = statusInfo[status] || { icon: null, text: status, className: 'bg-gray-200' };
    return <Badge variant="outline" className={info.className}>{info.icon}{info.text}</Badge>;
};

// --- Helper for JSON Textareas ---
const JsonTextArea: React.FC<{ id: string, label: string, value: string, onChange: (value: string) => void, placeholder?: string, rows?: number }> = 
({ id, label, value, onChange, placeholder, rows = 5 }) => {
    const handlePrettify = () => {
        try {
            if (value) {
                const parsed = JSON.parse(value);
                onChange(JSON.stringify(parsed, null, 2));
            }
        } catch (error) {
            toast.error("Invalid JSON. Cannot prettify.");
        }
    };
    return (
        <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor={id} className="text-right pt-2">{label}</Label>
            <div className="col-span-3">
                <Textarea id={id} value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs" rows={rows} placeholder={placeholder}/>
                <Button variant="outline" size="sm" onClick={handlePrettify} className="mt-2 text-xs h-7">Prettify JSON</Button>
            </div>
        </div>
    );
};

// --- Main Tabs ---

const TaskDefinitionsTab: React.FC<{ taskDefinitions: TaskDefinition[]; internalSignatures: Record<string, FunctionSignature>; onSave: () => void; }> = ({ taskDefinitions, internalSignatures, onSave }) => {
    const [isDefinitionEditDialogOpen, setIsDefinitionEditDialogOpen] = useState(false);
    const [isCodeTaskEditDialogOpen, setIsCodeTaskEditDialogOpen] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState<Partial<TaskDefinition> | null>(null);
    const [selectedCodeTask, setSelectedCodeTask] = useState<Partial<CodeTaskDefinition> | null>(null);

    const handleEdit = (definition: TaskDefinition) => {
        if (definition.task_type === 'code') {
            setSelectedCodeTask({
                id: definition._id,
                name: definition.function_path,
                description: definition.description || '',
                code_snippet: (definition as any).code_snippet || '',
                main_function_name: (definition as any).main_function_name || '',
                input_schema: definition.input_schema || '{}',
                output_schema: definition.output_schema || '{}',
            });
            setIsCodeTaskEditDialogOpen(true);
        } else {
            setSelectedDefinition(definition);
            setIsDefinitionEditDialogOpen(true);
        }
    };

    const handleCreateNew = (type: 'internal' | 'external' | 'code') => {
        if (type === 'internal') {
            setSelectedDefinition({ task_type: 'internal' });
            setIsDefinitionEditDialogOpen(true);
        } else if (type === 'external') {
            setSelectedDefinition({ task_type: 'external', function_path: 'scripts.new_external_task' });
            setIsDefinitionEditDialogOpen(true);
        } else if (type === 'code') {
            setSelectedCodeTask({ name: '', description: '', code_snippet: '', main_function_name: '', input_schema: '{}', output_schema: '{}' });
            setIsCodeTaskEditDialogOpen(true);
        }
    };

    const handleSaveCodeTask = async (task: CodeTaskDefinition) => {
        try {
            if (task.id) {
                await taskService.updateCodeTaskDefinition(task.id, task);
                toast.success(`Code task "${task.name}" updated.`);
            } else {
                await taskService.createCodeTaskDefinition(task);
                toast.success(`Code task "${task.name}" created.`);
            }
            onSave();
        } catch (error: any) {
            toast.error(`Failed to save code task: ${error.message}`);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Task Definitions</CardTitle>
                        <CardDescription>Define what tasks are available in the system.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><PlusCircle className="h-4 w-4 mr-2" />Create New Task<ChevronDown className="h-4 w-4 ml-2" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleCreateNew('internal')}><Code className="h-4 w-4 mr-2" />New Internal (Python) Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateNew('external')}><Terminal className="h-4 w-4 mr-2" />New External (Shell) Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateNew('code')}><Code className="h-4 w-4 mr-2" />New Code Task</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Default Timeout</TableHead>
                            <TableHead>Default Retry Strategy</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {taskDefinitions.map(definition => (
                            <TableRow key={definition._id || definition.function_path}>
                                <TableCell className="font-mono text-xs">{definition.function_path}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="whitespace-nowrap">
                                        {definition.task_type === 'external' ? <Terminal className="h-3 w-3 mr-1.5" /> : definition.task_type === 'code' ? <Code className="h-3 w-3 mr-1.5" /> : <Code className="h-3 w-3 mr-1.5" />}
                                        {definition.task_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-sm truncate">{definition.description}</TableCell>
                                <TableCell>{definition.default_timeout_seconds}s</TableCell>
                                <TableCell>{definition.default_retry_strategy}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(definition)}><Settings className="h-4 w-4 mr-2" />Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {selectedDefinition && (
                <TaskDefinitionDialog isOpen={isDefinitionEditDialogOpen} setIsOpen={setIsDefinitionEditDialogOpen} definition={selectedDefinition} internalSignatures={internalSignatures} onSave={onSave} />
            )}
            {selectedCodeTask && (
                <CodeTaskEditorDialog
                    open={isCodeTaskEditDialogOpen}
                    onClose={() => setIsCodeTaskEditDialogOpen(false)}
                    onSave={handleSaveCodeTask}
                    initialTask={selectedCodeTask as CodeTaskDefinition}
                />
            )}
        </Card>
    );
};

const ManualExecutionTab: React.FC<{ allTaskDefinitions: TaskDefinition[]; }> = ({ allTaskDefinitions }) => {
    const [executingFunctions, setExecutingFunctions] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const handleExecute = async (functionPath: string, kwargs: Record<string, any>) => {
        setExecutingFunctions(prev => new Set(prev).add(functionPath));
        try {
            await taskService.triggerTask(functionPath, kwargs);
            toast.success(`Task ${functionPath} queued for execution.`);
        } catch (error: any) {
            toast.error(`Failed to queue ${functionPath}.`, { description: error.message || 'Check console for details.'});
        } finally {
            setExecutingFunctions(prev => {
                const newSet = new Set(prev);
                newSet.delete(functionPath);
                return newSet;
            });
        }
    };

    const filteredConfigs = useMemo(() => {
        if (!searchTerm.trim()) return allTaskDefinitions;
        const searchLower = searchTerm.toLowerCase();
        return allTaskDefinitions.filter(cfg => 
            cfg.function_path.toLowerCase().includes(searchLower) || 
            cfg.description?.toLowerCase().includes(searchLower)
        );
    }, [allTaskDefinitions, searchTerm]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manual Function Execution</CardTitle>
                <CardDescription>Execute any defined task with a custom JSON input (kwargs).</CardDescription>
                <div className="pt-2">
                    <Input placeholder="Search tasks by name or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredConfigs.map(config => (
                        <FunctionExecutionCard key={config.function_path} config={config} onExecute={handleExecute} isExecuting={executingFunctions.has(config.function_path)} />
                    ))}
                    {filteredConfigs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{searchTerm ? 'No tasks match your search.' : 'No tasks available for execution.'}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// --- Dialog and Card Components (Modified) ---

const TaskDefinitionDialog: React.FC<{
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    definition: Partial<TaskDefinition>;
    internalSignatures: Record<string, FunctionSignature>;
    onSave: () => void;
}> = ({ isOpen, setIsOpen, definition, internalSignatures, onSave }) => {
    const [formData, setFormData] = useState<Partial<TaskDefinition>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(definition);
    }, [definition]);

    const handleSave = async () => {
        if (!formData.function_path) {
            toast.error("Function Path is required.");
            return;
        }
        setIsSaving(true);
        try {
            if (formData._id) {
                await taskService.updateTaskDefinition(formData._id, formData);
                toast.success(`Task definition "${formData.function_path}" updated.`);
            } else {
                await taskService.createTaskDefinition(formData);
                toast.success(`Task definition "${formData.function_path}" created.`);
            }
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error("Failed to save task definition.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof TaskDefinition, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Task Definition: <span className="font-mono text-base">{formData.function_path}</span></DialogTitle>
                    <DialogDescription>Define what this task is and how it should be configured.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                    {/* --- GENERAL SETTINGS --- */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">General Settings</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Task Type</Label>
                            <Badge variant="secondary" className="text-base w-fit">
                                {formData.task_type === 'external' ? <Terminal className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                                {formData.task_type === 'external' ? 'External Process' : 'Internal Function'}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="function_path" className="text-right">{formData.task_type === 'external' ? 'Task ID' : 'Function Path'}</Label>
                            {formData.task_type === 'internal' ? (
                                <Select value={formData.function_path} onValueChange={v => handleChange('function_path', v)} disabled={!!formData._id}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select an internal function..." /></SelectTrigger>
                                    <SelectContent>{Object.keys(internalSignatures).map(path => (<SelectItem key={path} value={path}>{path}</SelectItem>))}</SelectContent>
                                </Select>
                            ) : (
                                <Input id="function_path" value={formData.function_path || ''} onChange={e => handleChange('function_path', e.target.value)} className="col-span-3 font-mono" disabled={!!formData._id}/>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea id="description" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="col-span-3" placeholder="A brief summary of what this task does."/>
                        </div>
                    </div>

                    {/* --- EXECUTION SETTINGS --- */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Default Execution Settings</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="default_timeout_seconds" className="text-right">Default Timeout (s)</Label>
                            <Input id="default_timeout_seconds" type="number" value={formData.default_timeout_seconds || 300} onChange={e => handleChange('default_timeout_seconds', parseInt(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="default_retry_strategy" className="text-right">Default Retry Strategy</Label>
                            <Select value={formData.default_retry_strategy || 'none'} onValueChange={v => handleChange('default_retry_strategy', v)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="exponential">Exponential</SelectItem>
                                    <SelectItem value="linear">Linear</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="default_max_retries" className="text-right">Default Max Retries</Label>
                            <Input id="default_max_retries" type="number" value={formData.default_max_retries || 0} onChange={e => handleChange('default_max_retries', parseInt(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="default_retry_delay_seconds" className="text-right">Default Retry Delay (s)</Label>
                            <Input id="default_retry_delay_seconds" type="number" value={formData.default_retry_delay_seconds || 60} onChange={e => handleChange('default_retry_delay_seconds', parseInt(e.target.value))} className="col-span-3" />
                        </div>
                    </div>
                    
                    {/* --- I/O CONTRACT (SCHEMAS) --- */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg flex items-center"><FileJson className="mr-2 h-5 w-5"/>I/O Contract</h3>
                        <JsonTextArea id="input_schema" label="Input Schema" value={formData.input_schema || ''} onChange={v => handleChange('input_schema', v)} placeholder="A valid JSON Schema to validate the input 'kwargs' object."/>
                        <JsonTextArea id="output_schema" label="Output Schema" value={formData.output_schema || ''} onChange={v => handleChange('output_schema', v)} placeholder="A valid JSON Schema to validate the task's final result object."/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Definition"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TaskScheduleDialog: React.FC<{
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    schedule: Partial<TaskSchedule>;
    taskDefinitions: TaskDefinition[];
    onSave: () => void;
}> = ({ isOpen, setIsOpen, schedule, taskDefinitions, onSave }) => {
    const [formData, setFormData] = useState<Partial<TaskSchedule>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(schedule);
    }, [schedule]);

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Schedule name is required.");
            return;
        }
        if (!formData.task_definition_id) {
            toast.error("Task definition is required.");
            return;
        }
        setIsSaving(true);
        try {
            if (formData._id) {
                await taskService.updateTaskSchedule(formData._id, formData);
                toast.success(`Schedule "${formData.name}" updated.`);
            } else {
                await taskService.createTaskSchedule(formData);
                toast.success(`Schedule "${formData.name}" created.`);
            }
            onSave();
            setIsOpen(false);
        } catch (error) {
            toast.error("Failed to save schedule.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof TaskSchedule, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Task Schedule: <span className="font-mono text-base">{formData.name}</span></DialogTitle>
                    <DialogDescription>Configure when and how often this task should run.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                    {/* --- SCHEDULE SETTINGS --- */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Schedule Settings</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="schedule_name" className="text-right">Schedule Name</Label>
                            <Input id="schedule_name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="col-span-3" placeholder="e.g., Daily Backup Schedule"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task_definition" className="text-right">Task Definition</Label>
                            <Select value={formData.task_definition_id || ''} onValueChange={v => handleChange('task_definition_id', v)}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a task definition..." /></SelectTrigger>
                                <SelectContent>
                                    {taskDefinitions.map(def => (
                                        <SelectItem key={def._id} value={def._id}>
                                            {def.function_path} - {def.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_periodic" className="text-right">Periodic</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch id="is_periodic" checked={formData.is_periodic || false} onCheckedChange={(c) => handleChange('is_periodic', c)} />
                                <Label htmlFor="is_periodic">Run periodically</Label>
                            </div>
                        </div>
                        {formData.is_periodic && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="interval_seconds" className="text-right">Interval (s)</Label>
                                <Input id="interval_seconds" type="number" value={formData.interval_seconds || 3600} onChange={e => handleChange('interval_seconds', parseInt(e.target.value))} className="col-span-3" />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="enabled" className="text-right">Enabled</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch id="enabled" checked={formData.enabled !== false} onCheckedChange={(c) => handleChange('enabled', c)} />
                                <Label htmlFor="enabled">Enable this schedule</Label>
                            </div>
                        </div>
                    </div>

                    {/* --- EXECUTION OVERRIDES --- */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg">Execution Overrides (Optional)</h3>
                        <p className="text-sm text-muted-foreground">Leave empty to use task definition defaults</p>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="timeout_seconds" className="text-right">Timeout Override (s)</Label>
                            <Input id="timeout_seconds" type="number" value={formData.timeout_seconds || ''} onChange={e => handleChange('timeout_seconds', e.target.value ? parseInt(e.target.value) : undefined)} className="col-span-3" placeholder="Use default" />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="retry_strategy" className="text-right">Retry Strategy Override</Label>
                            <Select value={formData.retry_strategy || 'default'} onValueChange={v => handleChange('retry_strategy', v === 'default' ? undefined : v)}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Use default" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Use default</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="exponential">Exponential</SelectItem>
                                    <SelectItem value="linear">Linear</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="max_retries" className="text-right">Max Retries Override</Label>
                            <Input id="max_retries" type="number" value={formData.max_retries || ''} onChange={e => handleChange('max_retries', e.target.value ? parseInt(e.target.value) : undefined)} className="col-span-3" placeholder="Use default" />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="retry_delay_seconds" className="text-right">Retry Delay Override (s)</Label>
                            <Input id="retry_delay_seconds" type="number" value={formData.retry_delay_seconds || ''} onChange={e => handleChange('retry_delay_seconds', e.target.value ? parseInt(e.target.value) : undefined)} className="col-span-3" placeholder="Use default" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Schedule"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FunctionExecutionCard: React.FC<{
    config: TaskDefinition;
    onExecute: (functionPath: string, kwargs: Record<string, any>) => Promise<void>;
    isExecuting: boolean;
}> = ({ config, onExecute, isExecuting }) => {
    const [kwargs, setKwargs] = useState('{}');
    const [isValidJson, setIsValidJson] = useState(true);

    const handleExecuteClick = async () => {
        if (!isValidJson) {
            toast.error("Invalid JSON in kwargs.");
            return;
        }
        try {
            const parsedKwargs = JSON.parse(kwargs);
            await onExecute(config.function_path, parsedKwargs);
        } catch (error) {
            toast.error("Failed to parse kwargs JSON.");
        }
    };

    const handlePrettify = () => {
        try {
            const parsed = JSON.parse(kwargs);
            setKwargs(JSON.stringify(parsed, null, 2));
            setIsValidJson(true);
        } catch {
            setIsValidJson(false);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="font-semibold font-mono text-sm">{config.function_path}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                            {config.task_type === 'external' ? <Terminal className="h-3 w-3 mr-1" /> : <Code className="h-3 w-3 mr-1" />}
                            {config.task_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">Timeout: {config.default_timeout_seconds}s</Badge>
                    </div>
                </div>
                <Button onClick={handleExecuteClick} disabled={isExecuting || !isValidJson} className="ml-4">
                    {isExecuting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                    {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`kwargs-${config.function_path}`} className="text-sm font-medium">Input (kwargs)</Label>
                    <Button variant="outline" size="sm" onClick={handlePrettify} className="text-xs h-7">Prettify</Button>
                </div>
                <Textarea
                    id={`kwargs-${config.function_path}`}
                    value={kwargs}
                    onChange={(e) => {
                        setKwargs(e.target.value);
                        try {
                            JSON.parse(e.target.value);
                            setIsValidJson(true);
                        } catch {
                            setIsValidJson(false);
                        }
                    }}
                    className={`font-mono text-xs h-24 ${!isValidJson ? 'border-red-500' : ''}`}
                    placeholder='{"key": "value"}'
                />
                {!isValidJson && <p className="text-xs text-red-500">Invalid JSON</p>}
            </div>
        </Card>
    );
};

const TaskInspectDialog: React.FC<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void; task: Task; }> = ({ isOpen, setIsOpen, task }) => {
    const [logs, setLogs] = useState<string | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const fetchLogs = useCallback(async () => {
        setIsLoadingLogs(true);
        try {
            const logs = await taskService.getTaskLogs(task._id);
            setLogs(logs);
        } catch (error) {
            setLogs("Failed to load logs.");
            toast.error("Failed to load logs.");
        } finally {
            setIsLoadingLogs(false);
        }
    }, [task._id]);

    useEffect(() => {
        if(isOpen) fetchLogs();
    }, [isOpen, fetchLogs]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Inspect Task: {task.function_path}</DialogTitle>
                    <DialogDescription>ID: {task._id} | Type: {task.task_type}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 max-h-[70vh] overflow-y-auto p-4">
                    {task.error && <FormattedStackTrace error={task.error} />}
                    {task.task_type === 'external' && task.command && (<div><strong>Executed Command:</strong><pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1 font-mono">{task.command}</pre></div>)}
                    {task.task_type === 'external' && task.pid && (<div><strong>Process ID (PID):</strong> {task.pid}</div>)}
                    {task.kwargs && Object.keys(task.kwargs).length > 0 && (<div><strong>Input (kwargs):</strong><pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1">{JSON.stringify(task.kwargs, null, 2)}</pre></div>)}
                    {task.result && (<div><strong>Result:</strong><pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1">{JSON.stringify(task.result, null, 2)}</pre></div>)}
                    <div>
                        <div className="flex items-center justify-between"><strong>Logs:</strong><Button variant="ghost" size="sm" onClick={fetchLogs} disabled={isLoadingLogs} className="h-6 px-2 text-xs"><RefreshCw className={`h-3 w-3 mr-1 ${isLoadingLogs ? 'animate-spin' : ''}`} /> Refresh</Button></div>
                        <pre className="bg-gray-900 text-white p-2 mt-1 rounded text-xs max-h-96 overflow-y-auto">{isLoadingLogs ? "Loading..." : logs || 'No logs available.'}</pre>
                    </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TaskQueueTab: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState<TaskPagination | null>(null);
    const [filters, setFilters] = useState<GetTasksParams>({ page: 1, limit: 20, sort_by: 'created_at', order: 'desc' });
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [cancelingTaskId, setCancelingTaskId] = useState<string | null>(null);
    const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null);
    const debouncedSearch = useDebounce(filters.search || '', 500);
    const [isPolling, setIsPolling] = useState(true);

    const fetchTasks = useCallback(async (currentFilters: GetTasksParams) => {
        setIsLoading(true);
        try {
            const response = await taskService.getTasks(currentFilters.page || 1, currentFilters.limit || 20, currentFilters.search);
            setTasks(response.tasks);
            setPagination(response.pagination);
        } catch (error) {
            toast.error("Failed to load tasks.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const hasActiveTask = tasks.some(t => !taskService.isTaskTerminal(t.status));
        if (isPolling && hasActiveTask) {
        const interval = setInterval(() => {
                fetchTasks({ ...filters, search: debouncedSearch });
        }, 5000);
        return () => clearInterval(interval);
        }
    }, [isPolling, tasks, fetchTasks, filters, debouncedSearch]);

    useEffect(() => {
        fetchTasks({ ...filters, search: debouncedSearch });
    }, [fetchTasks, filters.page, filters.limit, filters.sort_by, filters.order, debouncedSearch]);

    const handleCancelTask = async (taskId: string) => {
        setCancelingTaskId(taskId);
        try {
            await taskService.cancelTask(taskId);
            toast.info('Cancellation signaled for task.');
            setTimeout(() => fetchTasks({ ...filters, search: debouncedSearch }), 1000);
        } catch (error: any) {
            toast.error('Failed to cancel task.', { description: error.message });
        } finally {
            setCancelingTaskId(null);
        }
    };
    
    const handleRetryTask = async (taskId: string) => {
        setRetryingTaskId(taskId);
        try {
            await taskService.retryTask(taskId);
            toast.success('Task queued for retry.');
            fetchTasks({ ...filters, search: debouncedSearch });
        } catch (error: any) {
            toast.error('Failed to retry task.', { description: error.message });
        } finally {
            setRetryingTaskId(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Queue & History</CardTitle>
                 <div className="flex items-center justify-between pt-2">
                    <Input placeholder="Search by name, status, or error..." className="max-w-sm" value={filters.search || ''} onChange={e => setFilters(p => ({...p, page: 1, search: e.target.value}))}/>
                    <div className="flex items-center gap-2">
                        <Switch id="polling-switch" checked={isPolling} onCheckedChange={setIsPolling} />
                        <Label htmlFor="polling-switch">Live Polling</Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow><TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Duration</TableHead><TableHead>Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map(task => (
                            <TableRow key={task._id}>
                                <TableCell><div className="font-mono text-xs">{task.function_path}</div><div className="text-muted-foreground text-xs">{task.trigger_type}</div></TableCell>
                                <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                                <TableCell>{formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}</TableCell>
                                <TableCell>{task.started_at && task.finished_at ? `${((parseISO(task.finished_at).getTime() - parseISO(task.started_at).getTime()) / 1000).toFixed(2)}s` : '-'}</TableCell>
                                <TableCell className="space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedTask(task)}><Eye className="h-4 w-4" /></Button>
                                    {taskService.canCancelTask(task.status) && (<Button variant="ghost" size="icon" onClick={() => handleCancelTask(task._id)} disabled={cancelingTaskId === task._id}>{cancelingTaskId === task._id ? <RefreshCw className="h-4 w-4 animate-spin text-yellow-600"/> : <Ban className="h-4 w-4 text-yellow-600" />}</Button>)}
                                    {taskService.canRetryTask(task.status) && (<Button variant="ghost" size="icon" onClick={() => handleRetryTask(task._id)} disabled={retryingTaskId === task._id}>{retryingTaskId === task._id ? <RefreshCw className="h-4 w-4 animate-spin text-blue-600"/> : <Repeat className="h-4 w-4 text-blue-600" />}</Button>)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {pagination && pagination.total_tasks > 0 && (
                     <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-muted-foreground">Page {pagination.current_page} of {pagination.total_pages}</div>
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => setFilters(p => ({...p, page: p.page - 1}))} disabled={pagination.current_page <= 1}>Previous</Button>
                             <Button variant="outline" size="sm" onClick={() => setFilters(p => ({...p, page: p.page + 1}))} disabled={pagination.current_page >= pagination.total_pages}>Next</Button>
                        </div>
                    </div>
                )}
            </CardContent>
            {selectedTask && <TaskInspectDialog isOpen={!!selectedTask} setIsOpen={() => setSelectedTask(null)} task={selectedTask} />}
        </Card>
    );
};

const TaskSchedulesTab: React.FC<{ taskSchedules: TaskSchedule[]; taskDefinitions: TaskDefinition[]; onSave: () => void; }> = ({ taskSchedules, taskDefinitions, onSave }) => {
    const [isScheduleEditDialogOpen, setIsScheduleEditDialogOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Partial<TaskSchedule> | null>(null);

    const handleEdit = (schedule: TaskSchedule) => {
        setSelectedSchedule(schedule);
        setIsScheduleEditDialogOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedSchedule({});
        setIsScheduleEditDialogOpen(true);
    };

    const handleToggleSchedule = async (id: string, enabled: boolean) => {
        try {
            await taskService.updateTaskSchedule(id, { enabled });
            toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'}.`);
            onSave();
        } catch (error: any) {
            toast.error(`Failed to update schedule: ${error.message}`);
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        try {
            await taskService.deleteTaskSchedule(id);
            toast.success('Schedule deleted successfully.');
            onSave();
        } catch (error: any) {
            toast.error(`Failed to delete schedule: ${error.message}`);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Task Scheduling</CardTitle>
                        <CardDescription>Manage when and how often tasks should run automatically.</CardDescription>
                    </div>
                    <Button onClick={handleCreateNew} variant="outline">
                        <PlusCircle className="h-4 w-4 mr-2" />Create New Schedule
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Schedule Name</TableHead>
                            <TableHead>Task Definition</TableHead>
                            <TableHead>Periodic</TableHead>
                            <TableHead>Interval</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Next Run</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {taskSchedules.map(schedule => (
                            <TableRow key={schedule._id}>
                                <TableCell className="font-medium">{schedule.name}</TableCell>
                                <TableCell className="font-mono text-xs">{schedule.function_path || 'Unknown'}</TableCell>
                                <TableCell>
                                    {schedule.is_periodic ? 'Yes' : 'No'}
                                </TableCell>
                                <TableCell>
                                    {schedule.is_periodic ? `${schedule.interval_seconds}s` : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={schedule.enabled}
                                            onCheckedChange={(enabled) => handleToggleSchedule(schedule._id, enabled)}
                                        />
                                        <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                                            {schedule.enabled ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {schedule.next_run_at ? formatDistanceToNow(parseISO(schedule.next_run_at), { addSuffix: true }) : 'Not scheduled'}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(schedule)}
                                        className="mr-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteSchedule(schedule._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {selectedSchedule && (
                <TaskScheduleDialog 
                    isOpen={isScheduleEditDialogOpen} 
                    setIsOpen={setIsScheduleEditDialogOpen} 
                    schedule={selectedSchedule} 
                    taskDefinitions={taskDefinitions}
                    onSave={onSave} 
                />
            )}
        </Card>
    );
};

// --- Main Component ---
const AdminBackgroundTask: React.FC = () => {
    const [activeTab, setActiveTab] = useState('queue');
    const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
    const [taskSchedules, setTaskSchedules] = useState<TaskSchedule[]>([]);
    const [internalSignatures, setInternalSignatures] = useState<Record<string, FunctionSignature>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [definitionsRes, schedulesRes, signaturesRes] = await Promise.all([
                taskService.getTaskDefinitions(),
                taskService.getTaskSchedules(),
                taskService.getFunctionSignatures()
            ]);
            setTaskDefinitions(definitionsRes.sort((a, b) => a.function_path.localeCompare(b.function_path)));
            setTaskSchedules(schedulesRes.sort((a, b) => a.name.localeCompare(b.name)));
            setInternalSignatures(signaturesRes);
        } catch (error) {
            toast.error("Failed to load initial task data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="queue">Queue & History</TabsTrigger>
                        <TabsTrigger value="definitions">Task Definitions</TabsTrigger>
                        <TabsTrigger value="scheduling">Task Scheduling</TabsTrigger>
                        <TabsTrigger value="manual">Manual Execution</TabsTrigger>
                    </TabsList>
                    <Button onClick={fetchData} variant="outline" size="sm" disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</Button>
                </div>
                <TabsContent value="queue"><TaskQueueTab /></TabsContent>
                <TabsContent value="definitions">{isLoading ? <p>Loading task definitions...</p> : <TaskDefinitionsTab taskDefinitions={taskDefinitions} internalSignatures={internalSignatures} onSave={fetchData} />}</TabsContent>
                <TabsContent value="scheduling">{isLoading ? <p>Loading task schedules...</p> : <TaskSchedulesTab taskSchedules={taskSchedules} taskDefinitions={taskDefinitions} onSave={fetchData} />}</TabsContent>
                <TabsContent value="manual">{isLoading ? <p>Loading tasks...</p> : <ManualExecutionTab allTaskDefinitions={taskDefinitions} />}</TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminBackgroundTask;