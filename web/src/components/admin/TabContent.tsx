import React from 'react';

interface TabContentProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TabContent({
  title, description, children, icon,
}: TabContentProps) {
  return (
    <div className="space-y-4 p-4 bg-card text-card-foreground rounded-lg border border-border shadow-sm">
      <div className="border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h2 className="text-xl font-display font-bold text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export default TabContent;
