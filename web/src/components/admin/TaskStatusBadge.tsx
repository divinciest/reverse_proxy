import React, { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, Clock, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';

interface TaskStatus {
  is_processing: boolean;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  last_update: string;
}

const TaskStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<TaskStatus>('/admin/task_status');
        setStatus(response.data);
      } catch (err: any) {
        console.error('Failed to fetch task status:', err);
        setError(err.response?.data?.error || 'Failed to fetch status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Badge variant="outline" className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking Status...</span>
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-2">
        <AlertCircle className="h-3 w-3" />
        <span>Status Error</span>
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge variant="secondary" className="flex items-center gap-2">
        <Clock className="h-3 w-3" />
        <span>No Status</span>
      </Badge>
    );
  }

  // Determine status based on processing state and task counts
  let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let statusIcon = <CheckCircle className="h-3 w-3" />;
  let statusText = 'All Systems Operational';

  if (status.is_processing) {
    statusVariant = 'outline';
    statusIcon = <Loader2 className="h-3 w-3 animate-spin" />;
    statusText = `Processing (${status.completed_tasks}/${status.total_tasks})`;
  } else if (status.failed_tasks > 0) {
    statusVariant = 'destructive';
    statusIcon = <AlertCircle className="h-3 w-3" />;
    statusText = `${status.failed_tasks} Failed Tasks`;
  } else if (status.total_tasks === 0) {
    statusVariant = 'secondary';
    statusIcon = <Clock className="h-3 w-3" />;
    statusText = 'No Active Tasks';
  }

  return (
    <Badge variant={statusVariant} className="flex items-center gap-2">
      {statusIcon}
      <span>{statusText}</span>
    </Badge>
  );
};

export default TaskStatusBadge;
