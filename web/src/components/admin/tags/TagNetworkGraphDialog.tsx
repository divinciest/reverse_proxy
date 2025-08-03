import React, {
  useState, useEffect, useMemo, useRef,
} from 'react';
import {
  ResponsiveNetwork, NetworkProps, ComputedNode, NetworkTooltip,
} from '@nivo/network'; import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'; import { Button } from '@/components/ui/button';
import {
  tagService, TagNetworkData, VisNode, VisEdge,
} from '@/utils/services/tagService';
import { configService } from '@/utils/services/configService';
import { Badge } from '@/components/ui/badge';

interface TagNetworkGraphDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetTagName: string | null;
}

type MyNivoNode = {
  id: string;
  label: string;
  title: string;
  radius: number;
  depth: number;
  color: string;
  data: VisNode; // Store original node data
};

type MyNivoLink = {
  source: string;
  target: string;
  label?: string;
  title?: string;
  distance: number;
  data: VisEdge; // Store original edge data
};

const NIVO_LINK_DISTANCE = 60;
const NIVO_CENTERING_STRENGTH = 0.6;
const NIVO_REPULSIVITY = 15;
const NIVO_NODE_BASE_RADIUS_TARGET = 12;
const NIVO_NODE_BASE_RADIUS_OTHER = 8;
const NIVO_LINK_THICKNESS_BASE = 1;

const TagNetworkGraphDialog: React.FC<TagNetworkGraphDialogProps> = ({ isOpen, onClose, targetTagName }) => {
  const [networkData, setNetworkData] = useState<TagNetworkData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [degree, setDegree] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [categoryColorMap, setCategoryColorMap] = useState<Record<string, string>>({});
  const [selectedNode, setSelectedNode] = useState<ComputedNode<MyNivoNode> | null>(null);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && targetTagName && degree > 0) {
      const fetchNetwork = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await tagService.getTagNetwork(targetTagName, degree);
          setNetworkData(data);
          if (data.nodes.length === 0 && data.edges.length === 0) {
            toast.info(`No network data found for "${targetTagName}" with degree ${degree}. It might be an isolated tag or degree is too small.`);
          }
        } catch (err: any) {
          console.error('Error fetching tag network:', err);
          setError(err.message || 'Failed to load network data.');
          toast.error(err.message || 'Failed to load network data.');
          setNetworkData({ nodes: [], edges: [] });
        } finally {
          setIsLoading(false);
          setZoomLevel(1);
          setPanX(0);
          setPanY(0);
        }
      };
      fetchNetwork();
    } else if (!isOpen) {
      setNetworkData({ nodes: [], edges: [] });
      setError(null);
      setZoomLevel(1);
      setPanX(0);
      setPanY(0);
    }
  }, [isOpen, targetTagName, degree]);

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

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const nivoData = useMemo((): { nodes: MyNivoNode[]; links: MyNivoLink[] } => {
    if (!networkData || networkData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }
    const nodes: MyNivoNode[] = networkData.nodes.map((node) => ({
      id: node.id.toString(),
      label: node.label,
      title: node.title || node.label,
      radius: node.id.toString() === targetTagName ? NIVO_NODE_BASE_RADIUS_TARGET : NIVO_NODE_BASE_RADIUS_OTHER,
      depth: node.level || 0,
      color: categoryColorMap[node.category] || '#cccccc',
      data: { ...node }, // Original VisNode is nested here in MyNivoNode.data.data
    }));

    const links: MyNivoLink[] = networkData.edges.map((edge) => ({
      source: edge.from.toString(),
      target: edge.to.toString(),
      label: edge.label,
      title: edge.title || edge.label,
      distance: NIVO_LINK_DISTANCE,
      data: { ...edge }, // Original VisEdge is nested here in MyNivoLink.data.data
    }));
    return { nodes, links };
  }, [networkData, targetTagName, categoryColorMap]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev * 0.8, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleDegreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDegree = parseInt(e.target.value, 10);
    if (newDegree > 0 && newDegree <= 5) {
      setDegree(newDegree);
    } else if (e.target.value === '') {
      // Allow empty input
    } else {
      toast.warning('Degree must be between 1 and 5.');
    }
  };

  // node is ComputedNode<MyNivoNode>, so node.data is MyNivoNode
  const CustomNodeComponent: NetworkProps<MyNivoNode, MyNivoLink>['nodeComponent'] = ({ node }) => (
    <g transform={`translate(${node.x},${node.y})`}>
      <circle
        r={node.data.radius} // CORRECTED: Access MyNivoNode.radius via node.data
        fill={node.data.color} // CORRECTED: Access MyNivoNode.color via node.data
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        textAnchor="middle"
        y={node.data.radius + 12} // CORRECTED: Use node.data.radius
        style={{ fontSize: 9, fill: '#333' }}
      >
        {node.data.label}
        {' '}
        {/* CORRECTED: Access MyNivoNode.label via node.data */}
      </text>
      {node.data.title && <title>{node.data.title}</title>}
      {' '}
      {/* CORRECTED: Access MyNivoNode.title via node.data */}
    </g>
  );

  // link.source and link.target are ComputedNode<MyNivoNode>
  // link.data is MyNivoLink (our payload)
  const CustomLinkComponent: NetworkProps<MyNivoNode, MyNivoLink>['linkComponent'] = ({ link }) => {
    const sourceNode = link.source; // This is ComputedNode<MyNivoNode>
    const targetNode = link.target; // This is ComputedNode<MyNivoNode>
    const linkCustomPayload = link.data; // This is MyNivoLink

    if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
      return null;
    }

    // Access MyNivoNode properties via .data on the ComputedNode
    const sourceDepth = sourceNode.data.depth;
    const targetDepth = targetNode.data.depth;
    // User's explicit request: DO NOT CHANGE THIS LOGIC for showing label/arrow
    const showLabelAndArrow = linkCustomPayload.label && (sourceDepth < targetDepth);

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return null;

    let labelDisplayAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (labelDisplayAngle > 90) {
      labelDisplayAngle -= 180;
    } else if (labelDisplayAngle < -90) {
      labelDisplayAngle += 180;
    }

    const labelOffsetDistance = 10;
    const labelOffsetX = labelOffsetDistance * Math.sin(labelDisplayAngle * Math.PI / 180);
    const labelOffsetY = -labelOffsetDistance * Math.cos(labelDisplayAngle * Math.PI / 180);

    const textMiddleX = (sourceNode.x + targetNode.x) / 2 + labelOffsetX;
    const textMiddleY = (sourceNode.y + targetNode.y) / 2 + labelOffsetY;

    const arrowDirectionAngle = Math.atan2(dy, dx) * 180 / Math.PI;

    const targetRadius = targetNode.data.radius; // Access MyNivoNode.radius via .data
    const normDX = dx / distance;
    const normDY = dy / distance;

    const arrowTipX = targetNode.x - normDX * targetRadius;
    const arrowTipY = targetNode.y - normDY * targetRadius;

    const arrowHeight = 6;
    const arrowBaseHalfWidth = arrowHeight / Math.sqrt(3);

    const arrowPoints = `0,0 ${-arrowHeight},${-arrowBaseHalfWidth} ${-arrowHeight},${arrowBaseHalfWidth}`;

    // Use the color Nivo calculates for the link (based on linkColor prop), or fallback
    const resolvedLinkColor = link.color || '#999999';
    // linkCustomPayload.data is VisEdge
    const linkThicknessValue = NIVO_LINK_THICKNESS_BASE + ((linkCustomPayload.data?.value || 0) / 5);

    return (
      <g>
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={arrowTipX}
          y2={arrowTipY}
          stroke={resolvedLinkColor}
          strokeOpacity={0.5}
          strokeWidth={linkThicknessValue}
        />
        {showLabelAndArrow && (
          <>
            <text
              x={textMiddleX}
              y={textMiddleY}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: 8, fill: '#555', pointerEvents: 'none' }}
              transform={`rotate(${labelDisplayAngle}, ${textMiddleX}, ${textMiddleY})`}
            >
              {linkCustomPayload.label}
            </text>
            <polygon
              points={arrowPoints}
              fill={resolvedLinkColor}
              stroke={resolvedLinkColor}
              strokeWidth={0.5}
              transform={`translate(${arrowTipX}, ${arrowTipY}) rotate(${arrowDirectionAngle})`}
            />
          </>
        )}
        {linkCustomPayload.title && <title>{linkCustomPayload.title}</title>}
      </g>
    );
  };

  // node is ComputedNode<MyNivoNode>, so node.data is MyNivoNode
  const NivoTooltip: NetworkTooltip<MyNivoNode, MyNivoLink> = ({ node }) => {
    if (node) {
      return (
        <div className="bg-background p-3 rounded-lg border">
          <strong>{node.data.label}</strong>
          {' '}
          {/* Access MyNivoNode.label */}
          {/* node.data.data is VisNode, which contains original category */}
          <div>
            Category:
            {node.data.data.category}
          </div>
          <div>
            Depth:
            {node.data.depth}
          </div>
          {' '}
          {/* Access MyNivoNode.depth */}
        </div>
      );
    }
    return null;
  };

  const graphContentStyle = useMemo(() => ({
    transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
    transformOrigin: 'center center',
    transition: 'transform 0.1s ease-out',
    width: '100%',
    height: '100%',
  }), [zoomLevel, panX, panY]);

  function ColorLegend({ colorMap, usedCategories }: {
    colorMap: Record<string, string>,
    usedCategories: string[]
  }) {
    // Filter color map to only include categories present in the graph
    const relevantEntries = Object.entries(colorMap).filter(([category]) => usedCategories.includes(category));

    return (
      <div className="absolute bottom-4 left-4 z-20 bg-background/90 p-3 rounded-lg border shadow-sm max-h-48 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-2">Category Colors</h4>
        <div className="flex flex-col gap-2">
          {relevantEntries.map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">{category.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Add this inside the component to get used categories
  const usedCategories = useMemo(() => Array.from(new Set(networkData.nodes.map((node) => node.category))), [networkData.nodes]);

  const handleNodeClick = (node: ComputedNode<MyNivoNode>) => {
    setSelectedNode(node);
  };

  const handleClose = () => {
    onClose();
    setSelectedNode(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Tag Network:
            {targetTagName}
          </DialogTitle>
          <DialogDescription>
            View and manage relationships between tags. Click on nodes to see details.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            <span>Loading tag network...</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex-1 min-h-0">
              <div className="h-full border rounded-lg">
                <ResponsiveNetwork<MyNivoNode, MyNivoLink>
                  data={nivoData}
                  margin={{
                    top: 10, right: 10, bottom: 10, left: 10,
                  }}
                  linkDistance={(e) => NIVO_LINK_DISTANCE}
                  centeringStrength={NIVO_CENTERING_STRENGTH}
                  repulsivity={NIVO_REPULSIVITY}
                  iterations={120}
                  nodeSize={(n) => n.data.radius * 2} // CORRECTED: Access MyNivoNode.radius via n.data
                  activeNodeSize={(n) => n.data.radius * 2 * 1.5} // CORRECTED: Access MyNivoNode.radius via n.data
                  nodeColor={(n) => n.data.color} // CORRECTED: Access MyNivoNode.color via n.data
                  nodeBorderWidth={1.5}
                  nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                  linkColor="#999999" // CHANGED: Static link color as requested (was from: 'source.color')
                  nodeComponent={CustomNodeComponent}
                  linkComponent={CustomLinkComponent}
                  tooltip={NivoTooltip}
                  isInteractive
                  animate
                  motionConfig="gentle"
                />
              </div>
            </div>

            {selectedNode && (
              <div className="mt-4 p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-2">{selectedNode.data.label}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Category:
                    {' '}
                    {selectedNode.data.data.category || 'N/A'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.data.data.trendable && (
                      <Badge variant="secondary">Trendable</Badge>
                    )}
                    {selectedNode.data.data.explorable && (
                      <Badge variant="secondary">Explorable</Badge>
                    )}
                    {selectedNode.data.data.humanReviewed && (
                      <Badge variant="secondary">Human Reviewed</Badge>
                    )}
                    {selectedNode.data.data.financeApproved && (
                      <Badge variant="secondary">Finance Approved</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TagNetworkGraphDialog;
