'use client';

import React, { useMemo, useRef } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';

// 1. Move this plugin definition to the top of the file (before ChartJS.register)
const radarBackgroundPlugin = {
  id: 'radarBackgroundPlugin',
  beforeDraw: (chart) => {
    const scale = chart.scales.r;
    if (!scale) return;
    const ctx = chart.ctx;
    const centerX = scale.xCenter;
    const centerY = scale.yCenter;
    const radius = scale.drawingArea;

    // Get the meta for the first dataset (the radar polygon)
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length === 0) return;

    ctx.save();

    // Build the polygon path
    ctx.beginPath();
    meta.data.forEach((point, i) => {
      const { x, y } = point.getProps(['x', 'y'], true);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.clip();

    // Draw the gradient inside the polygon
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.5)');   // Red at center
    gradient.addColorStop(0.5, 'rgba(255, 205, 86, 0.5)'); // Yellow in middle
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.5)');   // Green at edge

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }
};

// 2. Register the plugin globally (after the definition above)
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  radarBackgroundPlugin
);

// --- Component Props and Data Structure Interfaces ---

/**
 * Represents a single data point on the radar chart.
 * @param label - The name of the sector or topic (e.g., "Technology").
 * @param value - The impact value between -1 and 1.
 * @param note - Optional explanatory note about the impact.
 */
export interface RadarDataPoint {
  label: string;
  value: number;
  note?: string;
  tag_name?: string;
}

export interface RadarChartWidgetProps {
  data: RadarDataPoint[];
}

// --- Color Interpolation Logic ---

/**
 * Calculates a color based on distance from center (0).
 * @param value - The data point's value.
 * @param minVal - The minimum value in the entire dataset.
 * @param maxVal - The maximum value in the entire dataset.
 * @param alpha - The opacity of the color.
 * @returns An rgba color string.
 */
const getValueColor = (value: number, minVal: number, maxVal: number, alpha: number): string => {
  // Define base colors
  const red = { r: 255, g: 99, b: 132 };   // Chart.js default red
  const green = { r: 75, g: 192, b: 192 };  // Chart.js default green/teal

  // Calculate distance from center (0)
  const distance = Math.abs(value);
  const maxDistance = Math.max(Math.abs(minVal), Math.abs(maxVal));
  const percentage = maxDistance > 0 ? distance / maxDistance : 0;

  // Interpolate between red (at center) and green (at edges)
  const r = red.r + (green.r - red.r) * percentage;
  const g = red.g + (green.g - red.g) * percentage;
  const b = red.b + (green.b - red.b) * percentage;

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
};

const wrapText = (text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

// Helper function to truncate and format labels
const formatLabel = (label: string): string => {
  // Limit label to 15 characters
  const maxLength = 15;
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
};

/**
 * A widget that displays news impact on various topics using a radar chart.
 * Positive values are rendered in green, negative in red, with interpolation.
 * 
 * To use this component, you may need to install chart.js and react-chartjs-2:
 * npm install chart.js react-chartjs-2
 * or
 * yarn add chart.js react-chartjs-2
 */
const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<'radar', number[], string>>(null);

  // Memoize chart data and options to prevent re-computation on every render
  const { chartData, chartOptions } = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        chartData: { labels: [], datasets: [] }, 
        chartOptions: {} 
      };
    }

    const labels = data.map(d => formatLabel(d.label));
    const values = data.map(d => d.value);
    
    // Determine the data range for color mapping and axis scaling
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 0);
    
    // Ensure the radial scale has some padding beyond the max/min values
    const scaleMax = Math.ceil(Math.max(Math.abs(minVal), Math.abs(maxVal)) * 1.1);
    const scaleMin = -scaleMax;

    const chartData: ChartData<'radar'> = {
      labels,
      datasets: [
        {
          label: 'Impact Level',
          data: values,
          borderColor: 'rgba(75, 192, 192, 0.7)',
          borderWidth: 2,
          fill: false,
          backgroundColor: 'rgba(0,0,0,0)',
          pointBackgroundColor: values.map(v => {
            const green = { r: 75, g: 192, b: 192 };
            const red = { r: 255, g: 99, b: 132 };
            const max = 1;
            const pct = Math.abs(v) / max;
            const r = Math.round(red.r + (green.r - red.r) * pct);
            const g = Math.round(red.g + (green.g - red.g) * pct);
            const b = Math.round(red.b + (green.b - red.b) * pct);
            return `rgba(${r},${g},${b},1)`;
          }),
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: values.map(v => {
            const green = { r: 75, g: 192, b: 192 };
            const red = { r: 255, g: 99, b: 132 };
            const max = 1;
            const pct = Math.abs(v) / max;
            const r = Math.round(red.r + (green.r - red.r) * pct);
            const g = Math.round(red.g + (green.g - red.g) * pct);
            const b = Math.round(red.b + (green.b - red.b) * pct);
            return `rgba(${r},${g},${b},1)`;
          }),
        },
      ],
    };

    const chartOptions: ChartOptions<'radar'> = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      scales: {
        r: {
          min: scaleMin,
          max: scaleMax,
          ticks: {
            display: false
          },
          pointLabels: {
            padding: 20,
            centerPointLabels: true,
            callback: function(label, index) {
              const dataIndex = typeof index === 'number' ? index : (Array.isArray(labels) ? labels.indexOf(label as string) : -1);
              const tagName = data[dataIndex]?.tag_name;
              const originalLabel = data[dataIndex]?.label;
              if (tagName) {
                return `🔗 ${formatLabel(originalLabel)}`;
              }
              return formatLabel(originalLabel);
            },
            color: function(context) {
              const index = context.index;
              const tagName = data[index]?.tag_name;
              return tagName ? '#3b82f6' : '#6b7280'; // blue-500 for clickable, gray-500 for non-clickable
            },
            font: function(context) {
              const index = context.index;
              const tagName = data[index]?.tag_name;
              return {
                size: 11,
                weight: tagName ? 'bold' : 'normal'
              };
            }
          },
          grid: {
            circular: true
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false,
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const originalLabel = data[index].label;
              const value = context.raw as number;
              const note = data[index].note;
              let tooltipText = `${originalLabel}: ${value.toFixed(2)}`;
              if (note) {
                tooltipText += `\n${note}`;
              }
              return tooltipText;
            }
          },
          external: function(context) {
            // Tooltip Element
            let tooltipEl = document.getElementById('chartjs-tooltip');
            
            // Create element on first render
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.id = 'chartjs-tooltip';
              document.body.appendChild(tooltipEl);
            }

            // Hide if no tooltip
            const tooltipModel = context.tooltip;
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = '0';
              tooltipEl.style.pointerEvents = 'none';
              return;
            }

            // Set caret Position
            tooltipEl.classList.remove('above', 'below', 'no-transform');
            if (tooltipModel.yAlign) {
              tooltipEl.classList.add(tooltipModel.yAlign);
            } else {
              tooltipEl.classList.add('no-transform');
            }

            function getBody(bodyItem: any) {
              return bodyItem.lines;
            }

            // Set Text
            if (tooltipModel.body) {
              const titleLines = tooltipModel.title || [];
              const bodyLines = tooltipModel.body.map(getBody);

              let innerHtml = '<div>';

              // Add title
              titleLines.forEach(function(title) {
                innerHtml += '<div style="font-weight: bold; margin-bottom: 4px;">' + title + '</div>';
              });

              // Add body
              bodyLines.forEach(function(body, i) {
                innerHtml += '<div style="margin: 4px 0;">' + body + '</div>';
              });
              innerHtml += '</div>';

              tooltipEl.innerHTML = innerHtml;
            }

            // `this` will be the overall tooltip
            const position = context.chart.canvas.getBoundingClientRect();

            // Display, position, and set styles for font and appearance
            tooltipEl.style.opacity = '1';
            tooltipEl.style.position = 'fixed';
            tooltipEl.style.left = position.left + tooltipModel.caretX + 'px';
            tooltipEl.style.top = position.top + tooltipModel.caretY + 'px';
            tooltipEl.style.font = '12px sans-serif';
            tooltipEl.style.padding = '12px';
            tooltipEl.style.background = 'rgba(0, 0, 0, 0.8)';
            tooltipEl.style.color = '#fff';
            tooltipEl.style.border = '1px solid rgba(255,255,255,0.2)';
            tooltipEl.style.borderRadius = '4px';
            tooltipEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.zIndex = '1000';
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.maxWidth = '320px';
            tooltipEl.style.whiteSpace = 'pre-line';
            tooltipEl.style.transform = `translate(-50%, calc(-100% - 15px))`; // Position above the point
          }
        }
      },
      elements: {
        point: {
          hitRadius: 8,
          hoverRadius: 6,
          radius: 4
        }
      },
      onClick: function(event, elements) {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const tagName = data[index]?.tag_name;
          if (tagName) {
            window.open(`/tags/${encodeURIComponent(tagName)}`, '_blank');
          }
        }
      },
      onHover: function(event, elements) {
        const chart = chartRef.current;
        if (!chart) return;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.x - rect.left;
        const y = event.y - rect.top;

        // Get the angle and distance from center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        // Check if hover is near a label (within 30px of the outer edge)
        const maxRadius = Math.min(centerX, centerY) - 20;
        if (distance > maxRadius - 30 && distance < maxRadius + 30) {
          // Find the closest label
          const labelCount = data.length;
          const anglePerLabel = (2 * Math.PI) / labelCount;
          const normalizedAngle = (angle + Math.PI) % (2 * Math.PI);
          const labelIndex = Math.floor(normalizedAngle / anglePerLabel);
          
          const tagName = data[labelIndex]?.tag_name;
          (event.native.target as HTMLElement).style.cursor = tagName ? 'pointer' : 'default';
        } else {
          (event.native.target as HTMLElement).style.cursor = 'default';
        }
      }
    };

    return { chartData, chartOptions };
  }, [data]);

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // If there's no data, or if the calculation results in null, don't render anything.
  if (!chartData || !chartOptions) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-lg bg-gray-800 text-gray-400">
        No data available for chart.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] relative">
      <Radar 
        data={chartData} 
        options={chartOptions} 
        ref={chartRef}
      />
    </div>
  );
};

export default RadarChartWidget;
