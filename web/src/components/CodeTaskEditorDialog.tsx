import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Editor } from '@monaco-editor/react';
import { toast } from 'sonner';
import { taskService } from '@/utils/services/taskService';

interface CodeTaskDefinition {
  id?: string; // For local tasks, will be UUID. For global, ObjectId.
  name: string;
  description: string;
  code_snippet: string;
  main_function_name: string;
  input_schema: string;
  output_schema: string;
}

interface CodeTaskEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: CodeTaskDefinition) => void;
  initialTask?: CodeTaskDefinition;
  isLocal?: boolean; // True if it's a workflow-local task
}

const CodeTaskEditorDialog: React.FC<CodeTaskEditorDialogProps> = ({
  open,
  onClose,
  onSave,
  initialTask,
  isLocal = false,
}) => {
  const [name, setName] = useState(initialTask?.name || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [codeSnippet, setCodeSnippet] = useState(initialTask?.code_snippet || '');
  const [mainFunctionName, setMainFunctionName] = useState(initialTask?.main_function_name || '');
  const [inferredInputSchema, setInferredInputSchema] = useState(
    initialTask?.input_schema || '{}'
  );
  const [inferredOutputSchema, setInferredOutputSchema] = useState(
    initialTask?.output_schema || '{}'
  );
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);
  const [loadingInference, setLoadingInference] = useState(false);

  useEffect(() => {
    if (open && initialTask) {
      setName(initialTask.name);
      setDescription(initialTask.description);
      setCodeSnippet(initialTask.code_snippet);
      setMainFunctionName(initialTask.main_function_name);
      setInferredInputSchema(initialTask.input_schema);
      setInferredOutputSchema(initialTask.output_schema);
    } else if (open && !initialTask) {
      // Reset form for new task
      setName('');
      setDescription('');
      setCodeSnippet('');
      setMainFunctionName('');
      setInferredInputSchema('{}');
      setInferredOutputSchema('{}');
      setAvailableFunctions([]);
    }
  }, [open, initialTask]);

  const handleCodeChange = (value: string | undefined) => {
    setCodeSnippet(value || '');
  };

  const handleInferSchema = async () => {
    if (!codeSnippet) {
      toast.error('Please enter code to infer schema.');
      return;
    }
    setLoadingInference(true);
    try {
      const data = await taskService.inferFunctionsFromCode(codeSnippet);
      setAvailableFunctions(data.functions);
      if (data.functions.length > 0 && !mainFunctionName) {
        setMainFunctionName(data.functions[0]); // Auto-select first function
      }
      toast.success('Functions inferred successfully!');
    } catch (error: any) {
      toast.error(`Error inferring functions: ${error.message}`);
    } finally {
      setLoadingInference(false);
    }
  };

  useEffect(() => {
    // Automatically infer schema when mainFunctionName changes or codeSnippet changes
    // and a main function is selected.
    const inferAndUpdateSchemas = async () => {
      if (codeSnippet && mainFunctionName) {
        setLoadingInference(true);
        try {
          const data = await taskService.inferFunctionsFromCode(codeSnippet, mainFunctionName);
          if (data.input_schema && data.output_schema) {
            setInferredInputSchema(JSON.stringify(data.input_schema, null, 2));
            setInferredOutputSchema(JSON.stringify(data.output_schema, null, 2));
          } else {
            setInferredInputSchema('{}');
            setInferredOutputSchema('{}');
          }
        } catch (error: any) {
          toast.error(`Error inferring schemas: ${error.message}`);
          setInferredInputSchema('{}');
          setInferredOutputSchema('{}');
        } finally {
          setLoadingInference(false);
        }
      }
    };
    inferAndUpdateSchemas();
  }, [codeSnippet, mainFunctionName]);


  const handleSave = () => {
    if (!name || !codeSnippet || !mainFunctionName) {
      toast.error('Name, code snippet, and main function name are required.');
      return;
    }

    const newTask: CodeTaskDefinition = {
      name,
      description,
      code_snippet: codeSnippet,
      main_function_name: mainFunctionName,
      input_schema: inferredInputSchema,
      output_schema: inferredOutputSchema,
    };

    if (initialTask?.id) {
      newTask.id = initialTask.id; // Preserve ID for updates
    }

    onSave(newTask);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isLocal ? 'Edit Local Code Task' : 'Edit Global Code Task'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Task Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codeSnippet" className="text-right">
              Code Snippet (Python)
            </Label>
            <div className="col-span-3">
              <Editor
                height="200px"
                language="python"
                value={codeSnippet}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
          <Button
            onClick={handleInferSchema}
            disabled={loadingInference}
          >
            {loadingInference ? 'Inferring...' : 'Infer Functions from Code'}
          </Button>

          {availableFunctions.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mainFunction" className="text-right">
                Main Function
              </Label>
              <Select onValueChange={(value) => setMainFunctionName(value)} value={mainFunctionName}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a main function" />
                </SelectTrigger>
                <SelectContent>
                  {availableFunctions.map((funcName) => (
                    <SelectItem key={funcName} value={funcName}>
                      {funcName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inferredInputSchema" className="text-right">
              Inferred Input Schema (JSON)
            </Label>
            <div className="col-span-3">
                             <Editor
                 height="100px"
                 language="json"
                 value={inferredInputSchema}
                 options={{
                   readOnly: true,
                   minimap: { enabled: false },
                   wordWrap: 'on',
                   scrollBeyondLastLine: false,
                 }}
               />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inferredOutputSchema" className="text-right">
              Inferred Output Schema (JSON)
            </Label>
            <div className="col-span-3">
                             <Editor
                 height="100px"
                 language="json"
                 value={inferredOutputSchema}
                 options={{
                   readOnly: true,
                   minimap: { enabled: false },
                   wordWrap: 'on',
                   scrollBeyondLastLine: false,
                 }}
               />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeTaskEditorDialog;
