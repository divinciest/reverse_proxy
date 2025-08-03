import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Newspaper, Rss, Link as LinkIcon, ArrowDownAZ, ArrowUpAZ,
} from 'lucide-react';
import TabContent from '@/components/admin/TabContent';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { FeedCard } from '@/components/admin/cards';
import FeedListView from '@/components/admin/feeds/FeedListView';
import FeedRefreshBar from '@/components/admin/feeds/FeedRefreshBar';
import NewFeedFormManager from '@/components/admin/feeds/NewFeedFormManager';
import { useFeeds } from '@/hooks/useFeeds';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FeedSource } from '@/types/shared';
import FeedInspectModal from '@/components/admin/feeds/FeedInspectModal';
import { SearchInput } from '@/components/common/SearchInput';

// Define the FeedSortType explicitly if not imported or defined in useFeeds hook export
type FeedSortType = 'default' | 'az' | 'za';

function AdminFeedsTab() {
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<FeedSource | null>(null);

  // --- State for URL Modal ---
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [selectedFeedForModal, setSelectedFeedForModal] = useState<FeedSource | null>(null);
  // --- End State for URL Modal ---

  // --- ADDED: State for Feed Inspection Modal ---
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedFeedForInspect, setSelectedFeedForInspect] = useState<FeedSource | null>(null);
  // --- END ADDED: State for Feed Inspection Modal ---

  const {
    filteredSortedFeeds,
    feedSearch,
    feedSort,
    isFetching,
    lastAutoFetch,
    setFeedSearch,
    setFeedSort,
    refreshContentCounts,
    handleAddFeed,
    handleDeleteFeed,
    loadFeeds,
  } = useFeeds();

  // Apply sorting logic here based on feedSort state
  const sortedFeedsForDisplay = useMemo(() => {
    const feedsToSort = [...filteredSortedFeeds]; // Create a copy to avoid mutating the original array from the hook

    if (feedSort === 'az') {
      return feedsToSort.sort((a, b) => a.name.localeCompare(b.name));
    } if (feedSort === 'za') {
      return feedsToSort.sort((a, b) => b.name.localeCompare(a.name));
    }
    // 'default' sort - return the list as provided by the hook (might have its own default sort)
    return feedsToSort;
  }, [filteredSortedFeeds, feedSort]); // Re-sort whenever the list or sort order changes

  // New function to handle updating the count for a specific feed
  const handleUpdateCount = async (feedId: string) => {
    try {
      toast.info(`Updating content count for feed ${feedId}...`);
      await refreshContentCounts(false);
      toast.success('Content counts refreshed');
    } catch (error) {
      console.error('Error updating content count:', error);
      toast.error('Failed to refresh content counts');
    }
  };

  // Function to open the delete confirmation dialog
  const confirmDeleteFeed = (feed: FeedSource) => {
    const feedId = feed._id;
    if (!feedId) {
      toast.error('Cannot delete feed: Missing ID.');
      console.error('Feed object missing ID:', feed);
      return;
    }
    setFeedToDelete({ ...feed, _id: feedId });
    setDeleteDialogOpen(true);
  };

  // Function to execute the deletion after confirmation
  const executeDeleteFeed = async () => {
    const feedIdToDelete = feedToDelete?._id;

    if (!feedIdToDelete) {
      console.error('No feed ID available for deletion in state');
      toast.error('Cannot delete feed: Missing ID.');
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
      return;
    }

    try {
      await handleDeleteFeed(feedIdToDelete);
      toast.success(`Feed "${feedToDelete?.name || 'Unknown'}" deleted successfully`);
    } catch (error) {
      console.error('Error during feed deletion execution:', error);
    } finally {
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    }
  };

  // Wrapper function to fix the type mismatch for onAddFeed prop
  const handleAddFeedWrapper = async (feedData: { name: string; urls: string[] }): Promise<void> => {
    try {
      await handleAddFeed(feedData);
    } catch (error) {
      console.error('AdminFeedsTab wrapper caught error adding feed:', error);
    }
  };

  // Wrapper function to handle sort changes from ContentList
  const handleSortChangeWrapper = (value: string) => {
    if (value === 'default' || value === 'az' || value === 'za') {
      setFeedSort(value as FeedSortType);
    } else {
      console.warn(`Invalid sort value received from ContentList: ${value}. Using default.`);
      setFeedSort('default');
    }
  };

  // --- Handler for clicking feed card/item ---
  const handleFeedClick = (feed: FeedSource) => {
    console.log('Feed clicked:', feed);
    setSelectedFeedForModal(feed);
    setIsUrlModalOpen(true);
  };

  // --- ADDED: Handler for clicking the INSPECT button ---
  const handleInspectClick = (feed: FeedSource) => {
    console.log('Inspect clicked:', feed); // For debugging
    setSelectedFeedForInspect(feed);
    setIsInspectModalOpen(true);
  };
  // --- END ADDED: Handler for clicking the INSPECT button ---

  // --- Define Sort Options for Feeds ---
  const feedSortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'name_az', label: 'Name (A-Z)' },
    { value: 'name_za', label: 'Name (Z-A)' },
    // Add other relevant sort options for feeds, e.g.:
    // { value: "last_updated_desc", label: "Last Updated (Newest)" },
    // { value: "last_updated_asc", label: "Last Updated (Oldest)" },
  ];
  // --- End Sort Options for Feeds ---

  return (
    <TabContent
      title="Manage Feed Sources"
      description="Add, edit or remove feed sources that appear on the home page."
      icon={<Newspaper className="h-5 w-5 text-primary" />}
    >
      <NewFeedFormManager onAddFeed={handleAddFeedWrapper} />

      {/* Container for Refresh Bar and Sort Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-4">
        <FeedRefreshBar
          lastAutoFetch={lastAutoFetch}
          isFetching={isFetching}
          onRefresh={() => refreshContentCounts(true)}
        />
        {/* Simple Sort Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Sort by Name:</span>
          <Button
            variant={feedSort === 'az' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFeedSort('az')}
            title="Sort A to Z"
            className={feedSort === 'az' ? 'bg-secondary text-secondary-foreground' : 'border-border bg-background hover:bg-muted'}
          >
            <ArrowDownAZ className="h-4 w-4 mr-1" />
            {' '}
            A-Z
          </Button>
          <Button
            variant={feedSort === 'za' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFeedSort('za')}
            title="Sort Z to A"
            className={feedSort === 'za' ? 'bg-secondary text-secondary-foreground' : 'border-border bg-background hover:bg-muted'}
          >
            <ArrowUpAZ className="h-4 w-4 mr-1" />
            {' '}
            Z-A
          </Button>
          {/* Optional: Button to reset to default sort */}
          {feedSort !== 'default' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedSort('default')}
            title="Reset Sort"
            className="text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
          )}
        </div>
      </div>

      <ContentList<FeedSource>
        title="Current Feed Sources"
        searchValue={feedSearch}
        onSearchChange={setFeedSearch}
        debounceDelay={500}
        sortValue={feedSort}
        onSortChange={handleSortChangeWrapper}
        viewType={activeView}
        onViewChange={setActiveView}
        sortOptions={feedSortOptions}
        renderGridView={() => (
          <ContentGrid
            items={sortedFeedsForDisplay}
            renderCard={(feed) => (
              <FeedCard
                key={feed._id}
                feed={feed}
                onDelete={confirmDeleteFeed}
                onUpdateCount={handleUpdateCount}
                onCardClick={handleFeedClick}
                onInspect={handleInspectClick}
              />
            )}
            gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
            gap="gap-3"
            emptyMessage="No feed sources found."
            getItemKey={(feed) => feed._id}
          />
        )}
        renderListView={() => (
          <FeedListView
            feeds={sortedFeedsForDisplay}
            onDelete={confirmDeleteFeed}
            onUpdateCount={handleUpdateCount}
            onItemClick={handleFeedClick}
            onInspect={handleInspectClick}
          />
        )}
        icon={<Rss className="h-4 w-4 mr-2 text-primary" />}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove the feed "
              <strong>{feedToDelete?.name || 'this feed'}</strong>
              ".
              Contents previously fetched from this feed might eventually be removed by background processes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteFeed} className="bg-destructive hover:bg-destructive/90">
              Delete Feed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Feed URLs Modal --- */}
      <Dialog open={isUrlModalOpen} onOpenChange={setIsUrlModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Feed URLs for "
              {selectedFeedForModal?.name}
              "
            </DialogTitle>
            <DialogDescription>
              These are the RSS/Atom URLs associated with this feed source. Click to visit (opens in new tab).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {selectedFeedForModal?.urls && selectedFeedForModal.urls.length > 0 ? (
              <ul className="space-y-2">
                {selectedFeedForModal.urls.map((url, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                      title={url}
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No URLs found for this feed.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-border bg-background hover:bg-muted">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- End Feed URLs Modal --- */}

      {/* --- ADDED: Feed Inspection Modal --- */}
      <FeedInspectModal
        feed={selectedFeedForInspect}
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
      />
      {/* --- END ADDED: Feed Inspection Modal --- */}
    </TabContent>
  );
}

export default AdminFeedsTab;
