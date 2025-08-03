import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Globe } from 'lucide-react';
import api from '@/utils/api';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WorldMap from './WorldMapSvg';

// Default fill color for countries with no data or zero score
const DEFAULT_FILL_COLOR = '#E5E7EB'; // Light Gray
const DARK_MODE_FILL_COLOR = '#2D3748'; // A dark gray for dark mode default fill

// --- Create a simple Legend Component ---
interface HeatmapLegendProps {
  minLabel?: string;
  maxLabel?: string;
}

const HeatmapLegend: React.FC<HeatmapLegendProps> = ({
  minLabel = 'Negative',
  maxLabel = 'Positive',
}) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-red-500 rounded-md" />
      <span>{minLabel}</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-yellow-500 rounded-md" />
      <span>Neutral</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-green-500 rounded-md" />
      <span>{maxLabel}</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-4 h-4 bg-muted rounded-md" />
      <span>No Data</span>
    </div>
  </div>
);
// --- End Legend Component ---

// --- Define Props ---
interface WorldHeatmapSectionProps {
  tag_name?: string; // Optional tag name prop
  darkMode?: boolean; // New prop for dark mode
}

interface CountryEvent {
  id: string;
  title: string;
  date: string;
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// Define the actual heatmap data structure that the API returns
interface HeatmapCountryData {
  name: string;
  score: number;
  mentions: number;
}

interface HeatmapDataResponse {
  [countryCode: string]: HeatmapCountryData;
}

// --- Update Component Signature ---
const WorldHeatmapSection: React.FC<WorldHeatmapSectionProps> = React.memo(({ tag_name, darkMode = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    countryCode: string;
    data: HeatmapCountryData;
  } | null>(null);

  // Query for country events
  const {
    data: countryEvents,
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchCountryEvents,
  } = useQuery<CountryEvent[]>({
    queryKey: ['countryEvents', hoveredCountry, tag_name],
    queryFn: async () => {
      if (!hoveredCountry) return [];
      const endpoint = tag_name
        ? `/events/by-country/${(hoveredCountry || '').toUpperCase()}/tag/${tag_name}`
        : `/events/by-country/${(hoveredCountry || '').toUpperCase()}`;
      const response = await api.get(endpoint);
      return response.data.events;
    },
    enabled: !!hoveredCountry, // Only fetch when a country is hovered
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // 1. Fetch Heatmap Data - The API returns the data directly, not wrapped in WorldHeatmapResponse
  const {
    data: heatmapData,
    isLoading: isHeatmapLoading,
    error: heatmapError,
    isError: isHeatmapError,
  } = useQuery<HeatmapDataResponse, Error>({
    queryKey: ['worldHeatmap', tag_name],
    queryFn: async () => {
      const response = await api.get<HeatmapDataResponse>(
        tag_name ? '/get_world_heat_map_by_tag' : '/get_world_heat_map',
        tag_name ? { params: { tag_name } } : undefined,
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Helper to color SVG elements
  const colorMapElements = useCallback(() => {
    if (!svgRef.current || !heatmapData) {
      return;
    }

    const svgElement = svgRef.current;

    // Add filter definitions for glow effect
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgElement.insertBefore(defs, svgElement.firstChild);
    }

    // Remove existing glow filters
    defs.querySelectorAll('filter[id^="glow-"]').forEach((f) => f.remove());

    // Reset all country fills and filters
    const countryElements = svgElement.querySelectorAll('path[id], g[id]');
    countryElements.forEach((el) => {
      const element = el as SVGElement;
      const countryCode = element.getAttribute('id');
      const fillToApply = darkMode ? DARK_MODE_FILL_COLOR : DEFAULT_FILL_COLOR;

      // Apply base fill and remove filter initially
      if (element.tagName.toLowerCase() === 'g') {
        element.querySelectorAll('path').forEach((path) => {
          (path as SVGElement).style.fill = fillToApply;
          (path as SVGElement).style.filter = 'none';
        });
      } else {
        element.style.fill = fillToApply;
        element.style.filter = 'none';
      }

      // Set cursor pointer only if data exists for that country
      if (countryCode && heatmapData[countryCode.toUpperCase()]) {
        element.style.cursor = 'pointer';
      } else {
        element.style.cursor = 'default';
      }
    });

    // Apply heatmap colors
    Object.entries(heatmapData).forEach(([countryCode, data]) => {
      const selectors = [
        `[id="${countryCode.toLowerCase()}"]`,
        `[id="${countryCode.toUpperCase()}"]`,
        `path[id="${countryCode.toLowerCase()}"]`,
        `path[id="${countryCode.toUpperCase()}"]`,
        `g[id="${countryCode.toLowerCase()}"]`,
        `g[id="${countryCode.toUpperCase()}"]`,
      ];

      const element = selectors.reduce((found, selector) => found || svgElement.querySelector(selector), null as Element | null);

      if (element) {
        if (data.mentions > 0) {
          let fillColor: string;
          if (data.score === 1) {
            fillColor = '#22C55E99'; // Green for positive
          } else if (data.score === 0) {
            fillColor = '#EF444499'; // Red for negative
          } else {
            fillColor = '#EAB30899'; // Yellow for neutral/mixed
          }

          const maxMentions = Math.max(...Object.values(heatmapData).map((d) => d.mentions));
          const glowIntensity = (data.mentions / (maxMentions || 1)) * 8; // Normalize by max, prevent division by zero

          const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
          const filterId = `glow-${countryCode}`;
          filter.setAttribute('id', filterId);
          filter.setAttribute('x', '-50%');
          filter.setAttribute('y', '-50%');
          filter.setAttribute('width', '200%');
          filter.setAttribute('height', '200%');

          const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
          feGaussianBlur.setAttribute('stdDeviation', (glowIntensity + 2).toString());
          feGaussianBlur.setAttribute('result', 'coloredBlur');

          const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
          const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
          feMergeNode1.setAttribute('in', 'coloredBlur');
          const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
          feMergeNode2.setAttribute('in', 'SourceGraphic');

          feMerge.appendChild(feMergeNode1);
          feMerge.appendChild(feMergeNode2);
          filter.appendChild(feGaussianBlur);
          filter.appendChild(feMerge);
          defs.appendChild(filter);

          const applyStyles = (targetEl: SVGElement) => {
            targetEl.style.fill = fillColor;
            targetEl.style.filter = `url(#${filterId})`;
            targetEl.style.transition = 'fill 0.3s ease-in-out, filter 0.3s ease-in-out'; // Smooth transition
          };

          if (element.tagName.toLowerCase() === 'g') {
            element.querySelectorAll('path').forEach((path) => applyStyles(path as SVGElement));
          } else {
            applyStyles(element as SVGElement);
          }
        } else {
          // No mentions, set to default fill
          const fillToApply = darkMode ? DARK_MODE_FILL_COLOR : DEFAULT_FILL_COLOR;
          if (element.tagName.toLowerCase() === 'g') {
            element.querySelectorAll('path').forEach((path) => {
              (path as SVGElement).style.fill = fillToApply;
              (path as SVGElement).style.filter = 'none';
            });
          } else {
            (element as SVGElement).style.fill = fillToApply;
            (element as SVGElement).style.filter = 'none';
          }
        }
      } else {
        console.warn(`Could not find element for country code: ${countryCode}`);
      }
    });
  }, [heatmapData, darkMode]);

  // Apply colors when data changes
  useEffect(() => {
    if (!isHeatmapLoading && !isHeatmapError && heatmapData) {
      // Add a small delay to ensure SVG is rendered
      const timeoutId = setTimeout(() => {
        colorMapElements();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isHeatmapLoading, isHeatmapError, heatmapData, colorMapElements]);

  // Add event listeners for hover functionality
  useEffect(() => {
    if (!svgRef.current || !heatmapData) return;

    const svgElement = svgRef.current;
    const countryElements = svgElement.querySelectorAll('path[id], g[id]');

    const handleMouseEnter = (e: Event) => {
      const element = e.currentTarget as SVGElement;
      const countryCode = element.getAttribute('id')?.toUpperCase();
      if (countryCode && heatmapData?.[countryCode]) {
        const countryData = heatmapData[countryCode];
        const { clientX } = (e as MouseEvent);
        const { clientY } = (e as MouseEvent);
        setHoveredCountry(countryCode);
        setTooltip({
          visible: true,
          x: clientX,
          y: clientY,
          countryCode,
          data: countryData,
        });
      }
    };

    const handleMouseMove = (e: Event) => {
      setTooltip((prev) => {
        if (prev?.visible) {
          return {
            ...prev,
            x: (e as MouseEvent).clientX,
            y: (e as MouseEvent).clientY,
          };
        }
        return prev;
      });
    };

    const handleMouseLeave = () => {
      setHoveredCountry(null);
      setTooltip(null);
    };

    countryElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      countryElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [heatmapData]);

  // Effect to refetch country events when hoveredCountry changes
  useEffect(() => {
    if (hoveredCountry) {
      refetchCountryEvents();
    }
  }, [hoveredCountry, refetchCountryEvents]);

  const isLoading = isHeatmapLoading;
  const isError = isHeatmapError;
  const errorMessage = heatmapError?.message || 'An unknown error occurred.';
  const hasData = heatmapData && Object.keys(heatmapData).length > 0;

  const cardTitle = tag_name
    ? `Geographical spread for topic "${tag_name}"`
    : 'Geographical spread';

  return (
    <Card className="bg-card shadow-sm border border-border overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium flex items-center text-foreground">
          <Globe className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          World Events Heatmap
          {tag_name && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              for "
              {tag_name}
              "
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">Loading map...</span>
          </div>
        )}

        {isError && (
          <Alert variant="destructive" className="text-xs border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-3 w-3" />
            <AlertTitle className="text-xs font-medium">Map Error</AlertTitle>
            <AlertDescription className="text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && (
          <div className="space-y-3">
            <div className="relative">
              <div
                className="w-full h-auto"
                style={{ minHeight: '200px' }}
              >
                <WorldMap ref={svgRef} />
              </div>

              {/* Tooltip */}
              {tooltip && tooltip.visible && (
                <div
                  style={{
                    position: 'fixed',
                    left: tooltip.x + 10,
                    top: tooltip.y + 10,
                    font: '12px sans-serif',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    transition: 'opacity 0.2s ease-in-out',
                    maxWidth: '320px',
                    whiteSpace: 'pre-line',
                    opacity: tooltip.visible ? 1 : 0,
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{tooltip.data.name}</div>
                  <div style={{ fontSize: '11px', marginBottom: 4 }}>
                    <span style={{ color: '#EAB308' }}>Mentions: </span>
                    {tooltip.data.mentions}
                  </div>
                  <div style={{ fontSize: '11px', marginBottom: 4 }}>
                    <span style={{ color: '#EAB308' }}>Score: </span>
                    {tooltip.data.score.toFixed(2)}
                  </div>
                  {isEventsLoading && hoveredCountry === tooltip.countryCode ? (
                    <div className="flex items-center text-xs">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Loading events...
                    </div>
                  ) : eventsError ? (
                    <div className="text-xs text-red-400">Error loading events.</div>
                  ) : countryEvents && countryEvents.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '11px', color: '#EAB308', marginBottom: 4 }}>Recent Events:</div>
                      {countryEvents.map((event, index) => (
                        <div key={event.id} style={{ marginBottom: index < countryEvents.length - 1 ? '8px' : 0 }}>
                          <div style={{
                            color: event.impact === 'positive' ? '#22C55E'
                              : event.impact === 'negative' ? '#EF4444' : '#EAB308',
                            fontWeight: 'bold',
                            fontSize: '11px',
                          }}
                          >
                            {event.title}
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.8 }}>
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>
                            {event.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                      No recent events found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex justify-center">
              <HeatmapLegend />
            </div>
          </div>
        )}

        {/* Show loading state when no data is available yet */}
        {isLoading && !hasData && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">Loading map...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default WorldHeatmapSection;
