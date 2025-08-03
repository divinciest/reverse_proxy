import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Play, AlertCircle, CheckCircle, Download, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, UploadCloud, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/utils/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/common/SearchInput';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PaginationInfo, BackendPaginationInfo } from '@/types/admin';
import TabContent from '@/components/admin/TabContent';

interface BackupItem {
  _id: string;
  filename: string;
  createdAt: string; // ISO date string
  collections_backed_up: string[];
  file_size_bytes: number;
  commitMessage?: string;
  created_by?: string;
}

interface RestoreSummary {
  [collectionName: string]: {
    deleted: number | string;
    inserted: number | string;
  };
}

interface RestoreResponse {
    message: string;
    summary?: RestoreSummary;
    errors?: string[];
}

interface BackupDetailsModalProps {
  backup: BackupItem | null;
  onClose: () => void;
}

// --- BEGIN ADDED: Types for Sorting ---
type BackupSortField = 'filename' | 'commitMessage' | 'createdAt' | 'file_size_bytes';
type SortOrder = 'asc' | 'desc';
// --- END ADDED: Types for Sorting ---

function BackupDetailsModal({ backup, onClose }: BackupDetailsModalProps) {
  if (!backup) return null;

  return (
    <Dialog open={!!backup} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Backup Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground">{backup.filename}</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(backup.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Size</p>
              <p className="text-sm text-muted-foreground">{formatBytes(backup.file_size_bytes)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Collections</p>
              <p className="text-sm text-muted-foreground">{backup.collections_backed_up.join(', ')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateBackupDialog({
  open,
  onOpenChange,
  commitMessage,
  onCommitMessageChange,
  onCreateBackup,
  isCreatingBackup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commitMessage: string;
  onCommitMessageChange: (value: string) => void;
  onCreateBackup: () => Promise<void>;
  isCreatingBackup: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Backup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="commit-message" className="text-foreground">Commit Message (optional)</Label>
            <Input
              id="commit-message"
              value={commitMessage}
              onChange={(e) => onCommitMessageChange(e.target.value)}
              placeholder="Describe what's being backed up..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button onClick={onCreateBackup} disabled={isCreatingBackup} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Database size={16} className="mr-2" />
            {isCreatingBackup ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Backup'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadBackupDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  setFile,
  commitMessage,
  setCommitMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: () => Promise<void>;
  isUploading: boolean;
  setFile: (file: File | null) => void;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Backup from Disk</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="backup-file" className="text-foreground">Backup File (.json)</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 border-border bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upload-commit-message" className="text-foreground">Commit Message (optional)</Label>
            <Input
              id="upload-commit-message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe this backup..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <Button onClick={onUpload} disabled={isUploading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <UploadCloud size={16} className="mr-2" />
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload and Register'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (isNaN(i)) return '0 Bytes'; // Handle cases where log(bytes) is NaN (e.g. bytes < 0)
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

function AdminBackupsTab() {
  const [backupsList, setBackupsList] = useState<BackupItem[]>([]);
  const [isFetchingBackups, setIsFetchingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<string | null>(null); // Store ID of backup being restored
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    backupsPerPage: 10,
    limit: 10,
    totalBackups: 0,
    totalPages: 0,
    totalContents: 0,
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCommitMessage, setUploadCommitMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- BEGIN ADDED: State for Sorting ---
  const [sortField, setSortField] = useState<BackupSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // --- END ADDED: State for Sorting ---

  const fetchBackups = useCallback(async (page: number = pagination.currentPage, limit: number = pagination.backupsPerPage, search: string = searchQuery, currentSortField: BackupSortField, currentSortOrder: SortOrder) => {
    setIsFetchingBackups(true);
    setBackupError(null);
    // setBackupSuccessMessage(null); // Optionally clear success message
    try {
      const response = await api.get<{ backups: BackupItem[], pagination: BackendPaginationInfo }>(
        `/admin/backups?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sort_by=${currentSortField}&sort_order=${currentSortOrder}`,
      );
      setBackupsList(response.data.backups || []);
      const backendPagination = response.data.pagination;
      setPagination({
        currentPage: backendPagination.current_page,
        backupsPerPage: backendPagination.backups_per_page,
        limit: backendPagination.backups_per_page,
        totalBackups: backendPagination.total_backups,
        totalPages: backendPagination.total_pages,
      });
    } catch (error: any) {
      console.error('Error fetching backups:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch backups.';
      setBackupError(errorMsg);
      toast.error(errorMsg);
      setBackupsList([]);
      setPagination((prev) => ({
        ...prev, totalBackups: 0, totalPages: 0, currentPage: 1,
      }));
    } finally {
      setIsFetchingBackups(false);
    }
  }, [pagination.currentPage, pagination.backupsPerPage]);

  useEffect(() => {
    fetchBackups(pagination.currentPage, pagination.backupsPerPage, searchQuery, sortField, sortOrder);
  }, [fetchBackups, pagination.currentPage, pagination.backupsPerPage, searchQuery, sortField, sortOrder]);

  const handleSearchChange = (newSearchQuery: string) => {
    setSearchQuery(newSearchQuery);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 when search changes
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupError(null);
    setBackupSuccessMessage(null);

    try {
      const response = await api.post('/admin/backups/create', { commitMessage });
      setBackupSuccessMessage(response.data.message || 'Backup created successfully');
      setCommitMessage('');
      setShowCreateDialog(false);
      // Refresh the backups list
      fetchBackups(1, pagination.backupsPerPage, searchQuery, sortField, sortOrder);
    } catch (error: any) {
      console.error('Error creating backup:', error);
      setBackupError(error.response?.data?.error || error.message || 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleUploadBackup = async () => {
    if (!uploadFile) {
      setBackupError('Please select a backup file to upload');
      return;
    }

    setIsUploading(true);
    setBackupError(null);
    setBackupSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('backup', uploadFile);
      if (uploadCommitMessage) {
        formData.append('commitMessage', uploadCommitMessage);
      }

      const response = await api.post('/admin/backups/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBackupSuccessMessage(response.data.message || 'Backup uploaded successfully');
      setUploadFile(null);
      setUploadCommitMessage('');
      setShowUploadDialog(false);
      // Refresh the backups list
      fetchBackups(1, pagination.backupsPerPage, searchQuery, sortField, sortOrder);
    } catch (error: any) {
      console.error('Error uploading backup:', error);
      setBackupError(error.response?.data?.error || error.message || 'Failed to upload backup');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, backupFilename: string) => {
    if (!window.confirm(`Are you sure you want to restore from backup "${backupFilename}"? This will overwrite current data.`)) {
      return;
    }

    setIsRestoringBackup(backupId);
    setBackupError(null);
    setBackupSuccessMessage(null);

    try {
      const response = await api.post(`/admin/backups/${backupId}/restore`);
      const result: RestoreResponse = response.data;

      setBackupSuccessMessage(result.message || 'Backup restored successfully');

      if (result.summary) {
        console.log('Restore summary:', result.summary);
      }

      if (result.errors && result.errors.length > 0) {
        console.warn('Restore completed with errors:', result.errors);
        setBackupError(`Restore completed with some errors: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      setBackupError(error.response?.data?.error || error.message || 'Failed to restore backup');
    } finally {
      setIsRestoringBackup(null);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await api.get(`/admin/backups/${backupId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Backup download started');
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to download backup');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(backupId);
    setBackupError(null);
    setBackupSuccessMessage(null);

    try {
      await api.delete(`/admin/backups/${backupId}`);
      setBackupSuccessMessage('Backup deleted successfully');
      // Remove from local state
      setBackupsList((prev) => prev.filter((backup) => backup._id !== backupId));
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      setBackupError(error.response?.data?.error || error.message || 'Failed to delete backup');
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    // fetchBackups will be called by useEffect
  };

  const handleBackupsPerPageChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      backupsPerPage: newLimit,
      currentPage: 1, // Reset to page 1 when limit changes
    }));
    // fetchBackups will be called by useEffect
  };

  // --- BEGIN ADDED: Handler for Sorting ---
  const handleSort = (field: BackupSortField) => {
    if (sortField === field) {
      setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default sort order for new fields
      if (field === 'file_size_bytes' || field === 'createdAt') {
        setSortOrder('desc'); // Numbers and dates often default to descending
      } else {
        setSortOrder('asc'); // Strings default to ascending
      }
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on sort change
  };
  // --- END ADDED: Handler for Sorting ---

  // Filter backups based on search query
  const filteredBackups = backupsList.filter((backup) => backup.filename.toLowerCase().includes(searchQuery.toLowerCase())
    || (backup.commitMessage && backup.commitMessage.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <TabContent
      title="Database Backups"
      description="Create, restore, and manage database backups"
      icon={<Database className="h-5 w-5 text-primary" />}
    >
      <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search backups by filename or commit message..."
              value={searchQuery}
              onSearchChange={handleSearchChange}
              debounceDelay={500}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowUploadDialog(true)}
              disabled={isCreatingBackup || isRestoringBackup !== null}
              variant="outline"
              className="border-border bg-background hover:bg-muted"
            >
              <UploadCloud size={16} className="mr-2" />
              Upload from Disk
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={isCreatingBackup || isRestoringBackup !== null}
              variant="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Database size={16} className="mr-2" />
              Create New Backup
            </Button>
          </div>
        </div>

        {backupSuccessMessage && !backupError && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Backup Operation Success</AlertTitle>
            <AlertDescription>{backupSuccessMessage}</AlertDescription>
          </Alert>
        )}
        {backupError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backup Operation Error</AlertTitle>
            <AlertDescription>{backupError}</AlertDescription>
          </Alert>
        )}

        {isFetchingBackups && (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Loading backups list...</p>
          </div>
        )}
        {!isFetchingBackups && backupsList.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">
            {searchQuery ? `No backups found matching "${searchQuery}".` : 'No backups found.'}
          </p>
        )}
        {!isFetchingBackups && backupsList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted" onClick={() => handleSort('filename')}>
                    Filename
                    {sortField === 'filename' ? (sortOrder === 'asc' ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />) : <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30" />}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted" onClick={() => handleSort('commitMessage')}>
                    Commit Message
                    {sortField === 'commitMessage' ? (sortOrder === 'asc' ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />) : <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30" />}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted" onClick={() => handleSort('createdAt')}>
                    Created At
                    {sortField === 'createdAt' ? (sortOrder === 'asc' ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />) : <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30" />}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted" onClick={() => handleSort('file_size_bytes')}>
                    Size
                    {sortField === 'file_size_bytes' ? (sortOrder === 'asc' ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />) : <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30" />}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Collections</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredBackups.map((backup) => (
                  <tr key={backup._id} className="hover:bg-muted/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground font-mono" title={backup.filename}>{backup.filename.length > 40 ? `${backup.filename.substring(0, 37)}...` : backup.filename}</td>
                    <td className="px-4 py-4 text-sm text-foreground max-w-[250px] break-words">
                      {backup.commitMessage || 'No message'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatBytes(backup.file_size_bytes)}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground max-w-[200px] break-words" title={backup.collections_backed_up.join(', ')}>
                      {backup.collections_backed_up.length > 3
                        ? `${backup.collections_backed_up.slice(0, 2).join(', ')}, ... (${backup.collections_backed_up.length} total)`
                        : backup.collections_backed_up.join(', ') || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreBackup(backup._id, backup.filename);
                          }}
                          disabled={isRestoringBackup === backup._id}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {isRestoringBackup === backup._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadBackup(backup._id);
                          }}
                          className="text-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBackup(backup._id);
                          }}
                          disabled={isDeleting === backup._id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isDeleting === backup._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalBackups > 0 && !isFetchingBackups && (
          <div className="flex items-center justify-between space-x-2 py-4 px-2 border-t border-border">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Page
                {' '}
                {pagination.currentPage}
                {' '}
                of
                {' '}
                {pagination.totalPages}
                {' '}
                (
                {pagination.totalBackups}
                {' '}
                total backups)
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="backups-per-page-select" className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</Label>
                <Select
                  value={String(pagination.backupsPerPage)}
                  onValueChange={(value) => handleBackupsPerPageChange(Number(value))}
                >
                  <SelectTrigger id="backups-per-page-select" className="h-8 w-[70px] border-border bg-background">
                    <SelectValue placeholder={String(pagination.backupsPerPage)} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || isFetchingBackups}
                className="border-border bg-background hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || isFetchingBackups}
                className="border-border bg-background hover:bg-muted"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        <BackupDetailsModal
          backup={selectedBackup}
          onClose={() => setSelectedBackup(null)}
        />

        <CreateBackupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          commitMessage={commitMessage}
          onCommitMessageChange={setCommitMessage}
          onCreateBackup={handleCreateBackup}
          isCreatingBackup={isCreatingBackup}
        />

        <UploadBackupDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUpload={handleUploadBackup}
          isUploading={isUploading}
          setFile={setUploadFile}
          commitMessage={uploadCommitMessage}
          setCommitMessage={setUploadCommitMessage}
        />
      </div>
    </TabContent>
  );
}

export default AdminBackupsTab;
