import React from 'react';

interface ContentGridProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  gridCols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
  emptyMessage?: string;
  getItemKey?: (item: T, index: number) => string;
}

function ContentGrid<T>({
  items,
  renderCard,
  gridCols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'gap-3',
  className = '',
  emptyMessage = 'No items to display.',
  getItemKey,
}: ContentGridProps<T>) {
  if (!items || items.length === 0) {
    return <p className="text-center text-muted-foreground py-6">{emptyMessage}</p>;
  }

  const gridColsClasses = [
    'grid',
    `grid-cols-1`,
    gridCols.sm ? `sm:grid-cols-${gridCols.sm}` : '',
    gridCols.md ? `md:grid-cols-${gridCols.md}` : '',
    gridCols.lg ? `lg:grid-cols-${gridCols.lg}` : '',
    gridCols.xl ? `xl:grid-cols-${gridCols.xl}` : '',
    gap,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={gridColsClasses}>
      {items.map((item, index) => (
        <React.Fragment key={getItemKey ? getItemKey(item, index) : index}>
          {renderCard(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ContentGrid; 