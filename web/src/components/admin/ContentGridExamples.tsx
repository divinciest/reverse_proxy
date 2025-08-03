import React from 'react';
import ContentGrid from './ContentGrid';
import { 
  ContentCard, 
  TagCard, 
  FeedCard, 
  PersonCard, 
  CompanyCard, 
  TagLinkTypeCard 
} from './cards';
import { Content } from '@/data/types';
import { Tag, Person, CompanySource } from '@/types/admin';
import { FeedSource } from '@/types/shared';
import { TagLinkType } from '@/utils/services/tagLinksTypesService';

// Example usage of ContentGrid with different entity types

// Contents Grid Example
export const ContentsGridExample: React.FC<{
  contents: Content[];
  onInspect: (content: Content) => void;
}> = ({ contents, onInspect }) => (
  <ContentGrid
    items={contents}
    renderCard={(content) => (
      <ContentCard
        key={content._id}
        content={content}
        onInspect={onInspect}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3 }}
    gap="gap-3"
    emptyMessage="No contents to display."
    getItemKey={(content) => content._id}
  />
);

// Tags Grid Example
export const TagsGridExample: React.FC<{
  tags: Tag[];
  onDelete: (id: string) => void;
  onEdit: (tag: Tag) => void;
  onViewNetwork: (tagName: string) => void;
  allTags: Tag[];
}> = ({ tags, onDelete, onEdit, onViewNetwork, allTags }) => (
  <ContentGrid
    items={tags}
    renderCard={(tag) => (
      <TagCard
        key={tag._id}
        tag={tag}
        onDelete={onDelete}
        onEdit={onEdit}
        onViewNetwork={onViewNetwork}
        allTags={allTags}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    gap="gap-4"
    emptyMessage="No tags found."
    getItemKey={(tag) => tag._id}
  />
);

// Feeds Grid Example
export const FeedsGridExample: React.FC<{
  feeds: FeedSource[];
  onDelete: (feed: FeedSource) => void;
  onUpdateCount?: (id: string) => void;
  onCardClick: (feed: FeedSource) => void;
  onInspect: (feed: FeedSource) => void;
}> = ({ feeds, onDelete, onUpdateCount, onCardClick, onInspect }) => (
  <ContentGrid
    items={feeds}
    renderCard={(feed) => (
      <FeedCard
        key={feed._id}
        feed={feed}
        onDelete={onDelete}
        onUpdateCount={onUpdateCount}
        onCardClick={onCardClick}
        onInspect={onInspect}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    gap="gap-3"
    emptyMessage="No feed sources found."
    getItemKey={(feed) => feed._id}
  />
);

// Persons Grid Example
export const PersonsGridExample: React.FC<{
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (person: Person) => void;
  allPersons: Person[];
}> = ({ persons, onDelete, onEdit, allPersons }) => (
  <ContentGrid
    items={persons}
    renderCard={(person) => (
      <PersonCard
        key={person._id}
        person={person}
        onDelete={onDelete}
        onEdit={onEdit}
        allPersons={allPersons}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    gap="gap-4"
    emptyMessage="No persons found."
    getItemKey={(person) => person._id}
  />
);

// Companies Grid Example
export const CompaniesGridExample: React.FC<{
  companies: CompanySource[];
  onDelete: (id: string) => void;
  onAddLogo: (id: string) => void;
  onToggleStatus: (id: string, enabled: boolean) => void;
  onToggleIsFirm: (id: string, isFirm: boolean) => void;
}> = ({ companies, onDelete, onAddLogo, onToggleStatus, onToggleIsFirm }) => (
  <ContentGrid
    items={companies}
    renderCard={(company) => (
      <CompanyCard
        key={company.id}
        company={company}
        onDelete={onDelete}
        onAddLogo={onAddLogo}
        onToggleStatus={onToggleStatus}
        onToggleIsFirm={onToggleIsFirm}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    gap="gap-3"
    emptyMessage="No companies found."
    getItemKey={(company) => company.id}
  />
);

// Tag Link Types Grid Example
export const TagLinkTypesGridExample: React.FC<{
  types: TagLinkType[];
  onDelete: (id: string) => void;
  onEdit: (type: TagLinkType) => void;
}> = ({ types, onDelete, onEdit }) => (
  <ContentGrid
    items={types}
    renderCard={(type) => (
      <TagLinkTypeCard
        key={type._id}
        type={type}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )}
    gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    gap="gap-4"
    emptyMessage="No tag link types found."
    getItemKey={(type) => type._id}
  />
); 