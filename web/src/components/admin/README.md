# Unified ContentGrid System

This system provides a unified approach to displaying grid views for different entity types in the admin interface, replacing the need for individual grid view components.

## Overview

The system consists of:
- `ContentGrid`: A generic grid component that handles layout and rendering
- Individual card components for each entity type
- Integration with the existing `ContentList` component for search, sort, and view switching

## Components

### ContentGrid
A generic grid component that accepts:
- `items`: Array of items to display
- `renderCard`: Function to render each card
- `gridCols`: Responsive grid column configuration
- `gap`: CSS gap between grid items
- `emptyMessage`: Message to display when no items
- `getItemKey`: Function to generate unique keys

### Card Components
- `ContentCard`: For displaying contents
- `TagCard`: For displaying tags
- `FeedCard`: For displaying feed sources
- `PersonCard`: For displaying persons
- `CompanyCard`: For displaying companies
- `TagLinkTypeCard`: For displaying tag link types

## Usage

### Basic Usage with ContentList

```tsx
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { ContentCard } from '@/components/admin/cards';

// In your component
<ContentList<Content>
  title="Contents"
  searchValue={searchValue}
  onSearchChange={setSearchValue}
  sortValue={sortValue}
  onSortChange={setSortValue}
  viewType={viewType}
  onViewChange={setViewType}
  sortOptions={sortOptions}
  renderGridView={() => (
    <ContentGrid
      items={contents}
      renderCard={(content) => (
        <ContentCard
          key={content._id}
          content={content}
          onInspect={handleInspect}
        />
      )}
      gridCols={{ sm: 1, md: 2, lg: 3 }}
      gap="gap-3"
      emptyMessage="No contents to display."
      getItemKey={(content) => content._id}
    />
  )}
  renderListView={() => <ContentListView contents={contents} onInspect={handleInspect} />}
/>
```

### Grid Column Configuration

```tsx
// Responsive grid columns
gridCols={{ 
  sm: 1,    // 1 column on small screens
  md: 2,    // 2 columns on medium screens
  lg: 3,    // 3 columns on large screens
  xl: 4     // 4 columns on extra large screens
}}
```

### Custom Card Rendering

```tsx
renderCard={(item) => (
  <CustomCard
    key={item.id}
    item={item}
    onAction={handleAction}
  />
)}
```

## Migration from Individual Grid Components

### Before (Individual Grid Components)
```tsx
<ContentGridView
  contents={contents}
  onInspect={handleInspect}
/>
```

### After (Unified ContentGrid)
```tsx
<ContentGrid
  items={contents}
  renderCard={(content) => (
    <ContentCard
      key={content._id}
      content={content}
      onInspect={handleInspect}
    />
  )}
  gridCols={{ sm: 1, md: 2, lg: 3 }}
  gap="gap-3"
  emptyMessage="No contents to display."
  getItemKey={(content) => content._id}
/>
```

## Benefits

1. **Consistency**: All grid views use the same layout and behavior
2. **Maintainability**: Single grid component to maintain instead of multiple
3. **Flexibility**: Easy to customize grid layout and card rendering
4. **Reusability**: Card components can be reused in different contexts
5. **Type Safety**: Full TypeScript support with generic types

## Examples

See `ContentGridExamples.tsx` for complete examples of using ContentGrid with all entity types. 