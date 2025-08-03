import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Calendar, Trash2, Edit, Link as LinkIcon, PlusCircle, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Search, Tags, Newspaper, Globe, Loader2,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/common/SearchInput';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Event, eventService, AddEventPayload, UpdateEventPayload,
} from '@/utils/services/eventService';
import { Content, contentService } from '@/utils/services/contentService';
import TabContent from '@/components/admin/TabContent';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import OptImage from '@/components/common/OptImage';

function AdminEventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLinkContentsOpen, setIsLinkContentsOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const fetchEvents = useCallback(async (page = pagination.currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getAllEvents({
        page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: sortOption.sortBy,
        sortOrder: sortOption.sortOrder as 'asc' | 'desc',
      });
      setEvents(data.events);
      setPagination({ ...data.pagination });
    } catch (err) {
      setError('Failed to fetch events');
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, sortOption]);

  useEffect(() => {
    fetchEvents(1);
  }, [searchTerm, sortOption, fetchEvents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    setSortOption({ sortBy, sortOrder });
  };

  const openAddDialog = () => {
    setSelectedEvent(null);
    setIsAddEditOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsAddEditOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteOpen(true);
  };

  const openLinkContentsDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsLinkContentsOpen(true);
  };

  const handleSaveEvent = async (payload: AddEventPayload | UpdateEventPayload) => {
    const promise = selectedEvent
      ? eventService.updateEvent(selectedEvent._id, payload as UpdateEventPayload)
      : eventService.addEvent(payload as AddEventPayload);

    toast.promise(promise, {
      loading: 'Saving event...',
      success: () => {
        setIsAddEditOpen(false);
        fetchEvents(); // Refetch current page
        return `Event ${selectedEvent ? 'updated' : 'added'} successfully`;
      },
      error: (err: any) => err.response?.data?.error || 'Failed to save event.',
    });
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    toast.promise(eventService.deleteEvent(eventToDelete._id), {
      loading: 'Deleting event...',
      success: () => {
        setIsDeleteOpen(false);
        fetchEvents(pagination.currentPage > 1 && events.length === 1 ? pagination.currentPage - 1 : pagination.currentPage);
        return 'Event deleted successfully';
      },
      error: 'Failed to delete event',
    });
  };

  const handleDeleteAllEvents = async () => {
    toast.promise(eventService.deleteAllEvents(), {
      loading: 'Deleting all events...',
      success: (res) => {
        setIsDeleteAllOpen(false);
        fetchEvents(1);
        return res.message || 'All events deleted.';
      },
      error: (err: any) => err.response?.data?.error || 'Failed to delete all events.',
    });
  };

  const handleLinkContents = async (contentIds: string[]) => {
    if (!selectedEvent) return;
    toast.promise(eventService.addContentsToEvent(selectedEvent._id, contentIds), {
      loading: 'Linking contents...',
      success: () => {
        setIsLinkContentsOpen(false);
        fetchEvents();
        return `Successfully linked contents to ${selectedEvent.event_title}`;
      },
      error: 'Failed to link contents',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  return (
    <TabContent
      title="Manage Events"
      description="Add, edit, and manage financial events and their associated contents"
      icon={<Calendar className="h-5 w-5 text-primary" />}
    >
      {/* Danger Zone */}
      <Card className="mb-6 border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteAllOpen(true)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete All Events
          </Button>
          <p className="text-xs text-destructive/80 mt-2">
            This will permanently delete all events and their associated tags. This action cannot be undone.
          </p>
        </CardContent>
      </Card>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="w-full md:max-w-sm">
          <SearchInput
            placeholder="Search events by title or summary..."
            value={searchTerm}
            onSearchChange={setSearchTerm}
            debounceDelay={300}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select onValueChange={handleSortChange} defaultValue={`${sortOption.sortBy}_${sortOption.sortOrder}`}>
            <SelectTrigger className="w-full md:w-[180px] border-border bg-background">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">Newest</SelectItem>
              <SelectItem value="createdAt_asc">Oldest</SelectItem>
              <SelectItem value="event_title_asc">Title (A-Z)</SelectItem>
              <SelectItem value="event_title_desc">Title (Z-A)</SelectItem>
              <SelectItem value="contentCount_desc">Most Contents</SelectItem>
              <SelectItem value="contentCount_asc">Fewest Contents</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog} className="w-full md:w-auto whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            {' '}
            Add Event
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading events...</span>
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found</p>
                <p className="text-sm">Create your first event to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event._id} className="border-border bg-card hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                      <CardTitle className="text-foreground">{event.event_title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-2">
                          {event.event_summary}
                        </CardDescription>
                    </div>
                  <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                          {event.contentCount || 0}
                          {' '}
                          Contents
</Badge>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLinkContentsDialog(event)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(event)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                      Created:{formatDateSafe(event.createdAt)}
                    </span>
                  {event.updatedAt && (
                    <span>
                          Updated:
                          {formatDateSafe(event.updatedAt)}
                        </span>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Page
            {' '}
            {pagination.currentPage}
            {' '}
            of
            {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
              className="border-border bg-background hover:bg-muted"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="border-border bg-background hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="border-border bg-background hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="border-border bg-background hover:bg-muted"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddEditEventDialog
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
      />

      <DeleteEventDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteEvent}
        event={eventToDelete}
      />

      <LinkContentsDialog
        isOpen={isLinkContentsOpen}
        onClose={() => setIsLinkContentsOpen(false)}
        onLink={handleLinkContents}
        event={selectedEvent}
      />

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Events</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all events and their associated tags. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllEvents} className="bg-destructive hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabContent>
  );
}

// Add/Edit Dialog
function AddEditEventDialog({
  isOpen, onClose, onSave, event,
}: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, event: Event | null }) {
  const [formData, setFormData] = useState({
    event_title: '',
    event_date: '',
    event_summary: '',
    event_keywords: '',
    tag_like_title: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        event_title: event.event_title,
        event_date: new Date(event.event_date).toISOString().split('T')[0],
        event_summary: event.event_summary,
        event_keywords: event.event_keywords.join(','),
        tag_like_title: event.tag_like_title,
      });
    } else {
      setFormData({
        event_title: '', event_date: '', event_summary: '', event_keywords: '', tag_like_title: '',
      });
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      event_keywords: formData.event_keywords.split(',').map((kw) => kw.trim()).filter(Boolean),
    };
    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input name="event_title" placeholder="Event Title" value={formData.event_title} onChange={handleChange} />
          <Input name="event_date" type="date" value={formData.event_date} onChange={handleChange} />
          <Input name="event_summary" placeholder="Summary" value={formData.event_summary} onChange={handleChange} />
          <Input name="event_keywords" placeholder="Keywords (comma-separated)" value={formData.event_keywords} onChange={handleChange} />
          <Input name="tag_like_title" placeholder="Tag-like Title" value={formData.tag_like_title} onChange={handleChange} disabled={!!event} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dialog
function DeleteEventDialog({
  isOpen, onClose, onConfirm, event,
}: { isOpen: boolean, onClose: () => void, onConfirm: () => void, event: Event | null }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the event "
            {event?.event_title}
            " and its associated tag. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Link Contents Dialog
function LinkContentsDialog({
  isOpen, onClose, onLink, event,
}: { isOpen: boolean, onClose: () => void, onLink: (contentIds: string[]) => void, event: Event | null }) {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (event) {
      setSelectedContentIds(new Set(event.contents));
    }
  }, [event]);

  const searchContents = useCallback(async () => {
    if (!searchTerm) {
      setContents([]);
      return;
    }
    setLoading(true);
    try {
      const data = await contentService.getAllContents({ search: searchTerm, limit: 20 });
      // Exclude contents that are already part of ANY event to avoid conflicts
      const unassignedContents = data.contents.filter((a) => !a.events || a.events.length === 0 || (event && a.events.includes(event._id)));
      setContents(unassignedContents);
    } catch (err) {
      toast.error('Failed to search contents');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, event]);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchContents();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, searchContents]);

  const handleSelectContent = (contentId: string) => {
    setSelectedContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  };

  const handleSaveLinks = () => {
    onLink(Array.from(selectedContentIds));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Link Contents to "
            {event?.event_title}
            "
          </DialogTitle>
          <DialogDescription>Search for contents and check them to link to this event. Previously linked contents are already checked.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for contents to link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="mt-4 max-h-96 overflow-y-auto space-y-2 pr-2">
            {loading && <div className="text-center py-4">Searching...</div>}
            {!loading && contents.length === 0 && searchTerm && (
              <div className="text-center text-muted-foreground py-4">No unassigned contents found matching your search.</div>
            )}
            {contents.map((content) => (
              <div key={content._id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                <div className="flex-1 pr-4">
                  <p className="font-semibold">{content.title}</p>
                  <p className="text-xs text-gray-500">
                      {content.source}
                      {' '}
                      - 
{' '}
                      {formatDateSafe(content.date)}
                    </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedContentIds.has(content._id)}
                  onChange={() => handleSelectContent(content._id)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSaveLinks}>Save Links</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const formatDateSafe = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

export default AdminEventsTab;
