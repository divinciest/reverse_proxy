import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import {
  Share2Icon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, Loader2, Network, RefreshCw, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveNetwork } from '@nivo/network';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tagService, VisNode, VisEdge } from '@/utils/services/tagService';
import { TagNetworkData } from '@/types/shared';
import { configService } from '@/utils/services/configService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TagNetworkSectionProps {
    tag_name?: string;
}

type MyNivoNode = {
    id: string;
    label: string;
    title: string;
    radius: number;
    depth: number;
    color: string;
    data: VisNode;
};

type MyNivoLink = {
    source: string;
    target: string;
    label?: string;
    title?: string;
    distance: number;
    data: VisEdge;
};

const NIVO_LINK_DISTANCE = 60;
const NIVO_CENTERING_STRENGTH = 0.6;
const NIVO_REPULSIVITY = 15;
const NIVO_NODE_BASE_RADIUS_TARGET = 12;
const NIVO_NODE_BASE_RADIUS_OTHER = 8;
const NIVO_LINK_THICKNESS_BASE = 1;
const DEFAULT_DEGREE = 1;

const TagNetworkSection: React.FC<TagNetworkSectionProps> = ({ tag_name }) => {
  const [networkData, setNetworkData] = useState<TagNetworkData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});
  const [refreshCount, setRefreshCount] = useState(0);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphContentRef = useRef<HTMLDivElement>(null);
  const networkContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tag_name) {
      const fetchNetwork = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await tagService.getTagNetwork(tag_name, DEFAULT_DEGREE);
          setNetworkData(data);
          if (data.nodes.length === 0 && data.edges.length === 0) {
            toast.info(`No network data found for "${tag_name}". It might be an isolated tag.`);
          }
        } catch (err: any) {
          console.error('Error fetching tag network:', err);
          setError(err.message || 'Failed to load network data.');
          setNetworkData({ nodes: [], edges: [] });
        } finally {
          setIsLoading(false);
        }
      };
      fetchNetwork();
    }
  }, [tag_name]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await configService.getAllowedTagCategories();
        const colorMap: Record<string, string> = {};
        categories.forEach((categoryName, index) => {
          const hue = (index * 360) / categories.length;
          colorMap[categoryName] = `hsl(${hue}, 70%, 50%)`;
        });
        setCategoryColorMap(colorMap);
      } catch (error) {
        console.error('Failed to load tag categories:', error);
        toast.error('Failed to load category colors');
      }
    };
    fetchCategories();
  }, []);

  const nivoData = useMemo((): { nodes: MyNivoNode[]; links: MyNivoLink[] } => {
    if (!networkData || networkData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }
    const nodes: MyNivoNode[] = networkData.nodes.map((node) => ({
      id: node.id.toString(),
      label: node.label,
      title: node.title || node.label,
      radius: node.id.toString() === tag_name ? NIVO_NODE_BASE_RADIUS_TARGET : NIVO_NODE_BASE_RADIUS_OTHER,
      depth: node.level || 0,
      color: categoryColorMap[node.category] || '#cccccc',
      data: { ...node },
    }));

    const links: MyNivoLink[] = networkData.edges.map((edge) => ({
      source: edge.from.toString(),
      target: edge.to.toString(),
      label: edge.label,
      title: edge.title || edge.label,
      distance: NIVO_LINK_DISTANCE,
      data: { ...edge },
    }));
    return { nodes, links };
  }, [networkData, tag_name, categoryColorMap]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev * 0.8, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  function CustomNodeComponent({ node }: any) {
    return (
      <g transform={`translate(${node.x},${node.y})`}>
        <circle
          r={node.data.radius}
          fill={node.data.color}
          stroke="#fff"
          strokeWidth={1.5}
        />
        <text
          textAnchor="middle"
          y={node.data.radius + 12}
          style={{ fontSize: 9, fill: '#333' }}
        >
          {node.data.label}
        </text>
        {node.data.title && <title>{node.data.title}</title>}
      </g>
    );
  }

  function CustomLinkComponent({ link }: any) {
    const sourceNode = link.source;
    const targetNode = link.target;
    const linkCustomPayload = link.data;

    if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
      return null;
    }

    const sourceDepth = sourceNode.data.depth;
    const targetDepth = targetNode.data.depth;
    const showLabelAndArrow = linkCustomPayload.label && (sourceDepth < targetDepth);

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return null;

    const targetRadius = targetNode.data.radius;
    const normDX = dx / distance;
    const normDY = dy / distance;

    const arrowTipX = targetNode.x - normDX * targetRadius;
    const arrowTipY = targetNode.y - normDY * targetRadius;

    return (
      <g>
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={arrowTipX}
          y2={arrowTipY}
          stroke="#999999"
          strokeOpacity={0.5}
          strokeWidth={NIVO_LINK_THICKNESS_BASE}
        />
        {showLabelAndArrow && (
        <text
          x={(sourceNode.x + targetNode.x) / 2}
          y={(sourceNode.y + targetNode.y) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 8, fill: '#555', pointerEvents: 'none' }}
        >
          {linkCustomPayload.label}
        </text>
        )}
      </g>
    );
  }

  const graphContentStyle = useMemo(() => ({
    transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
    transformOrigin: 'center center',
    transition: 'transform 0.1s ease-out',
    width: '100%',
    height: '100%',
  }), [zoomLevel, panX, panY]);

  if (!tag_name) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
            <Network className="mr-1.5 h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            Tag Network
            {tag_name && (
            <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">
              for "
              {tag_name}
              "
            </span>
            )}
          </h3>
          <button
            onClick={() => setRefreshCount((c) => c + 1)}
            className="text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors p-0.5 rounded-sm hover:bg-teal-100 dark:hover:bg-teal-900/20 ml-auto"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <CardContent className="p-3">
        {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading network...</span>
        </div>
        )}

        {error && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs font-medium">Network Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
        )}

        {!isLoading && !error && networkData && (
        <div className="space-y-3">
          <div
            ref={networkContainerRef}
            className="w-full h-64 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700"
          />

          {networkData.nodes.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {networkData.nodes.length}
            {' '}
            related tags •
            {networkData.edges.length}
            {' '}
            connections
          </div>
          )}
        </div>
        )}

        {!isLoading && !error && (!networkData || networkData.nodes.length === 0) && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-8">
          No network data available
          {tag_name ? ` for "${tag_name}"` : ''}
          .
        </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TagNetworkSection;
