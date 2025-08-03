/*
================================================================================================
COMPONENT VISION: ExploreTagsPage.tsx
================================================================================================
PURPOSE:
- To create a discovery page for explorable topics, designed to exactly match the user's reference image.
- The page is divided into a two-column layout within a main container.

------------------------------------------------------------------------------------------------
1. LEFT COLUMN:
------------------------------------------------------------------------------------------------
- Displays a static "Explore topics you are interested in" block.
- Displays "Topic Categories" which are dynamically generated from the `hierarchies` data structure.
- Each hierarchy root (e.g., "Finance and Economy") acts as a category title.
- The lists of links under each category title are the `children` of that hierarchy root.
- CRITICAL FILTERING LOGIC: The children in these lists are strictly filtered to ONLY show tags where the `category` is either 'topic' or 'sector'.

------------------------------------------------------------------------------------------------
2. RIGHT COLUMN:
------------------------------------------------------------------------------------------------
- Displays "Content Topics" as a collection of clickable pills.
- This section is populated by ALL explorable tags, regardless of category. It combines all orphan tags and all tags from all hierarchies (both roots and children).
- NO CATEGORY FILTERING is applied to this section.
- "Show More/Less" Logic:
    - The initial view is curated to show a limited number of topics (~24).
    - Priority is given to tags where `trendable === true`.
    - Remaining slots are filled by tags with the highest `contents_count`.
    - A "See All Topics" button reveals all remaining tags.
================================================================================================
*/
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import HeaderEx from '@/components/layout/HeaderEx';
import Footer from '@/components/layout/Footer';
import { Tag } from '@/types/admin';
import { tagService, TopicHierarchyNode, ExplorableTopicsHierarchyResponse } from '@/utils/services/tagService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const flattenHierarchy = (nodes: TopicHierarchyNode[]): Tag[] => {
  const tags: Tag[] = [];
  const traverse = (node: TopicHierarchyNode) => {
    const { children, ...tag } = node;
    tags.push(tag as Tag);
    if (children) {
      children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return tags;
};

const ExploreTagsPage: React.FC = () => {
  const [apiData, setApiData] = useState<ExplorableTopicsHierarchyResponse>({ hierarchies: [], orphan_tags: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await tagService.getExplorableTopicsHierarchy();
        setApiData(result || { hierarchies: [], orphan_tags: [] });
      } catch (err) {
        setError('Failed to load topics.');
        console.error('Error fetching explorable topics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Left Column Logic: Hierarchies with children filtered by 'topic' or 'sector'
  const topicCategories = useMemo(() => {
    const validCategories = new Set(['topic', 'sector']);
    return (apiData.hierarchies || [])
      .map((h) => ({
        ...h,
        children: (h.children || []).filter((c) => validCategories.has(c.category)),
      }))
      .filter((h) => h.children.length > 0);
  }, [apiData.hierarchies]);

  // Right Column Logic: All explorable tags, sorted alphabetically
  const allContentTags = useMemo(() => {
    const hierarchyTags = flattenHierarchy(apiData.hierarchies);
    const all = [...hierarchyTags, ...apiData.orphan_tags.filter((t) => t.category === 'topic' || t.category === 'sector')];
    const uniqueTags = Array.from(new Map(all.map((tag) => [tag._id, tag])).values());
    return uniqueTags.sort((a, b) => a.tag_name.localeCompare(b.tag_name));
  }, [apiData]);

  const topicsToRender = allContentTags;

  // Layout helpers
  const half = Math.ceil((topicCategories?.length || 0) / 2);
  const leftColumnHierarchies = topicCategories.slice(0, half);
  const rightColumnHierarchies = topicCategories.slice(half);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderEx />
        <main className="container mx-auto p-4 md:p-10">
          <Skeleton className="h-[600px] w-full rounded-lg bg-white shadow-md" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderEx />
        <main className="container mx-auto p-4 md:p-10 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-red-600">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <HeaderEx />
      <main className="container mx-auto p-4 md:p-10">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-12 gap-16">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-5">
              <h2 className="text-2xl font-bold text-gray-800">Explore topics you are interested in</h2>
              <p className="text-gray-500 mt-2 text-sm">Discover trending financial news, analysis, and insights across various categories.</p>
              {topicCategories.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic Categories</h3>
                  <div className="mt-4 grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {leftColumnHierarchies.map((h) => (
                            <div key={h._id}>
                              <h4 className="font-semibold text-sm text-gray-800">{h.tag_name}</h4>
                              <ul className="mt-2 space-y-1.5">
                                    {h.children.map((child) => (
                                      <li key={child._id}>
                                            <Link to={`/tags/${encodeURIComponent(child.tag_name)}`} className="text-gray-600 hover:text-black text-sm">
                                              {child.tag_name}
                                            </Link>
                                          </li>
                                    ))}
                                  </ul>
                            </div>
                          ))}
                    </div>
                    <div className="space-y-6">
                      {rightColumnHierarchies.map((h) => (
                            <div key={h._id}>
                              <h4 className="font-semibold text-sm text-gray-800">{h.tag_name}</h4>
                              <ul className="mt-2 space-y-1.5">
                                    {h.children.map((child) => (
                                      <li key={child._id}>
                                            <Link to={`/tags/${encodeURIComponent(child.tag_name)}`} className="text-gray-600 hover:text-black text-sm">
                                              {child.tag_name}
                                            </Link>
                                          </li>
                                    ))}
                                  </ul>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-7">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content Topics</h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {topicsToRender.map((topic) => (
                  <Link key={topic._id} to={`/tags/${encodeURIComponent(topic.tag_name)}`}>
                    <Button variant="secondary" className="bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 px-4 py-2 h-auto text-sm font-normal">{topic.tag_name}</Button>
                  </Link>
                ))}
                {topicsToRender.length === 0 && !isLoading && <p className="text-sm text-gray-500">No content topics found.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExploreTagsPage;
