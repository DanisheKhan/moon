import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import {
  TrendingUp,
  ArrowUpRight,
  Calendar,
  AreaChart,
  BarChart3,
  LineChart,
} from 'lucide-react';

/**
 * Monotone cubic interpolation (Fritsch-Carlson algorithm)
 * Strictly prevents overshooting below baseline (y > baselineY) or above top (y < topY).
 * When points are flat (e.g. 0 sales), the spline is guaranteed 100% horizontal on the baseline.
 */
function buildMonotoneCubicPath(points, baselineY, topY) {
  const n = points.length;
  if (!points || n === 0) return '';
  if (n === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (n === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  // 1. Calculate secant slopes (delta)
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const slopes = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    slopes[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  // 2. Initialize tangents at points
  const tangents = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      // Local extremum or flat region -> tangent must be strictly 0
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  // If a point is on the baseline (zero sales), tangent must be 0 to prevent dipping below
  for (let i = 0; i < n; i++) {
    if (points[i].y >= baselineY - 0.5) {
      tangents[i] = 0;
    }
  }

  // 3. Fritsch-Carlson limiter to enforce strict monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(dy[i]) < 0.0001) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        tangents[i] = tau * alpha * slopes[i];
        tangents[i + 1] = tau * beta * slopes[i];
      }
    }
  }

  // 4. Construct smooth bezier path with control points strictly clamped
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDx = dx[i] / 3;

    let cp1x = p1.x + segmentDx;
    let cp1y = p1.y + tangents[i] * segmentDx;

    let cp2x = p2.x - segmentDx;
    let cp2y = p2.y - tangents[i + 1] * segmentDx;

    // Hard clamp to ensure control points NEVER go beneath baseline or above top
    cp1y = Math.min(baselineY, Math.max(topY, cp1y));
    cp2y = Math.min(baselineY, Math.max(topY, cp2y));

    // If both endpoints are at baseline (0 sales), force perfectly flat line
    if (p1.y >= baselineY - 0.5 && p2.y >= baselineY - 0.5) {
      cp1y = baselineY;
      cp2y = baselineY;
    }

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

export function SalesVelocityTimeline({ salesVelocity = [], periodComparison = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [viewMode, setViewMode] = useState('area'); // 'area' | 'dual' | 'bars'

  if (!salesVelocity || salesVelocity.length === 0) {
    return null;
  }

  // Calculate scales and bounds
  const totalPeriodRevenue = salesVelocity.reduce((acc, d) => acc + d.revenue, 0);
  const totalPeriodProfit = salesVelocity.reduce((acc, d) => acc + d.profit, 0);
  const overallMargin = totalPeriodRevenue > 0 ? (totalPeriodProfit / totalPeriodRevenue) * 100 : 0;

  // Maximum value for chart Y scale with 15% breathing room
  const rawMax = Math.max(...salesVelocity.map((d) => d.revenue), 10000);
  const maxRevenue = Math.ceil(rawMax * 1.15);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 240;
  const padding = { top: 25, right: 35, bottom: 45, left: 75 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;
  const baselineY = padding.top + graphHeight;

  // Compute point coordinates with hard baseline floor
  const pointsRevenue = salesVelocity.map((item, idx) => {
    const x = padding.left + (idx / Math.max(1, salesVelocity.length - 1)) * graphWidth;
    const yRatio = item.revenue / maxRevenue;
    const y = padding.top + (1 - yRatio) * graphHeight;
    return { x, y: Math.min(baselineY, Math.max(padding.top, y)), ...item };
  });

  const pointsProfit = salesVelocity.map((item, idx) => {
    const x = padding.left + (idx / Math.max(1, salesVelocity.length - 1)) * graphWidth;
    const yRatio = item.profit / maxRevenue;
    const y = padding.top + (1 - yRatio) * graphHeight;
    return { x, y: Math.min(baselineY, Math.max(padding.top, y)), ...item };
  });

  // Smooth curved paths using Fritsch-Carlson monotone spline (strictly bounded above baseline)
  const revenueCurve = buildMonotoneCubicPath(pointsRevenue, baselineY, padding.top);
  const profitCurve = buildMonotoneCubicPath(pointsProfit, baselineY, padding.top);

  // Closed area polygon path for gross sales
  const revenueArea = pointsRevenue.length > 1
    ? `${revenueCurve} L ${pointsRevenue[pointsRevenue.length - 1].x.toFixed(1)} ${baselineY} L ${pointsRevenue[0].x.toFixed(1)} ${baselineY} Z`
    : '';

  // 4 Horizontal Grid Y-ticks
  const yTicks = [
    { value: maxRevenue, y: padding.top },
    { value: maxRevenue * 0.66, y: padding.top + graphHeight * 0.34 },
    { value: maxRevenue * 0.33, y: padding.top + graphHeight * 0.67 },
    { value: 0, y: baselineY },
  ];

  // Active inspected day
  const activeDay = hoveredIdx !== null
    ? salesVelocity[hoveredIdx]
    : salesVelocity.find((d) => d.revenue > 0) || salesVelocity[salesVelocity.length - 1];

  const activePoint = hoveredIdx !== null ? pointsRevenue[hoveredIdx] : null;

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-5 min-w-0">
      {/* Top Header & Run Rate Intelligence */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-brand-sage-border bg-brand-sage-subtle flex items-center justify-center text-brand-sage shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                Sales & Profit Velocity Timeline
                <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text">
                  Daily Pulse Graph
                </span>
              </h3>
              <p className="text-xs text-muted">
                Interactive financial trajectory curve connecting daily store receipts and margin realizations.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Period Growth Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart View Modes */}
          <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 text-xs select-none">
            <button
              type="button"
              onClick={() => setViewMode('area')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'area'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <AreaChart size={12} />
              <span>Area Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dual')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <LineChart size={12} />
              <span>Revenue vs Profit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'bars'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <BarChart3 size={12} />
              <span>Bars</span>
            </button>
          </div>

          {/* Growth Delta Pill */}
          {periodComparison.deltaPct !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text text-xs font-semibold shadow-2xs">
              <ArrowUpRight size={13} className="text-brand-sage" />
              <span>+{periodComparison.deltaPct}% vs last period</span>
            </div>
          )}

          {periodComparison.runRateDaily > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-bg/50 text-muted text-xs">
              <Calendar size={13} className="text-text" />
              <span>
                Run Rate: <strong className="text-text font-mono">{formatCurrency(periodComparison.runRateDaily)}</strong>/day
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active Day Scrubber Ribbon */}
      {activeDay && (
        <div className="p-3.5 rounded-xl border border-border bg-bg/40 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted block">Point in Time</span>
            <span className="font-bold text-text text-xs sm:text-sm font-mono">
              {activeDay.label} ({activeDay.dayOfWeek})
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted block">Gross Day Sales</span>
            <span className="font-bold text-brand-sage text-xs sm:text-sm font-mono">
              {formatCurrency(activeDay.revenue)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted block">Gross Profit</span>
            <span className="font-bold text-brand-gold-text text-xs sm:text-sm font-mono">
              {formatCurrency(activeDay.profit)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted block">Realized Margin</span>
            <span className="font-bold text-brand-sage-text text-xs sm:text-sm font-mono">
              {activeDay.marginPct.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted block">Orders Billed</span>
            <span className="font-bold text-text text-xs sm:text-sm font-mono">
              {activeDay.invoices} {activeDay.invoices === 1 ? 'bill' : 'bills'}
            </span>
          </div>
        </div>
      )}

      {/* The Master SVG Graph Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* 1. Horizontal Reference Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={svgWidth - padding.right}
                y2={tick.y}
                stroke="var(--border)"
                strokeDasharray={tick.value === 0 ? 'none' : '3 3'}
                strokeWidth={tick.value === 0 ? '1.5' : '1'}
              />
              <text
                x={padding.left - 10}
                y={tick.y + 3.5}
                textAnchor="end"
                className="fill-muted text-[10px] font-mono select-none"
              >
                {tick.value === 0 ? '₹0' : formatCurrency(Math.round(tick.value))}
              </text>
            </g>
          ))}

          {/* 2. Bar View Mode (Overlay Behind Curve If Selected) */}
          {viewMode === 'bars' &&
            pointsRevenue.map((pt, idx) => {
              const barHeight = Math.max(2, baselineY - pt.y);
              const isHovered = hoveredIdx === idx;
              const barWidth = Math.max(12, (graphWidth / salesVelocity.length) * 0.45);
              return (
                <rect
                  key={`bar-${idx}`}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill="var(--brand-sage)"
                  fillOpacity={isHovered ? 0.95 : 0.4}
                  className="transition-all duration-150"
                />
              );
            })}

          {/* 3. Filled Area Under Revenue Curve */}
          {(viewMode === 'area' || viewMode === 'bars') && revenueArea && (
            <path
              d={revenueArea}
              fill="var(--brand-sage)"
              fillOpacity={viewMode === 'bars' ? 0.08 : 0.16}
            />
          )}

          {/* 4. Smooth Gross Revenue Spline Path */}
          {revenueCurve && (
            <path
              d={revenueCurve}
              fill="none"
              stroke="var(--brand-sage)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 5. Dual View: Profit Curve (Golden Amber Dashed Spline) */}
          {viewMode === 'dual' && profitCurve && (
            <>
              <path
                d={`${profitCurve} L ${pointsProfit[pointsProfit.length - 1].x.toFixed(1)} ${baselineY} L ${pointsProfit[0].x.toFixed(1)} ${baselineY} Z`}
                fill="var(--brand-gold)"
                fillOpacity="0.10"
              />
              <path
                d={profitCurve}
                fill="none"
                stroke="var(--brand-gold)"
                strokeWidth="2.25"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* 6. Active Crosshair Line on Hover */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={baselineY}
              stroke="var(--brand-sage)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* 7. Circular Data Nodes & Interactive Invisible Hover Columns */}
          {pointsRevenue.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const hasData = pt.revenue > 0;
            const colWidth = graphWidth / Math.max(1, salesVelocity.length);

            return (
              <g key={`point-${idx}`}>
                {/* Node circle on the curve */}
                {hasData && (
                  <>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="var(--surface)"
                      stroke="var(--brand-sage)"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150"
                    />
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="10"
                        fill="var(--brand-sage)"
                        fillOpacity="0.2"
                      />
                    )}
                  </>
                )}

                {/* Profit node on dual view */}
                {viewMode === 'dual' && hasData && (
                  <circle
                    cx={pointsProfit[idx].x}
                    cy={pointsProfit[idx].y}
                    r={isHovered ? 5 : 3}
                    fill="var(--surface)"
                    stroke="var(--brand-gold)"
                    strokeWidth={isHovered ? 2.5 : 1.75}
                  />
                )}

                {/* X-Axis Date Label */}
                <text
                  x={pt.x}
                  y={baselineY + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono select-none transition-colors ${
                    isHovered ? 'fill-brand-sage font-bold' : 'fill-text font-medium'
                  }`}
                >
                  {pt.label}
                </text>
                <text
                  x={pt.x}
                  y={baselineY + 30}
                  textAnchor="middle"
                  className="fill-muted text-[9px] select-none"
                >
                  {pt.dayOfWeek}
                </text>

                {/* Full-height invisible mouse trigger rect */}
                <rect
                  x={pt.x - colWidth / 2}
                  y={padding.top}
                  width={colWidth}
                  height={graphHeight + padding.bottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chart Legend & Telemetry Footnote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-brand-sage inline-block shrink-0" />
            <span className="font-medium text-text">Gross Sales Curve</span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-brand-gold inline-block shrink-0" />
            <span className="font-medium text-text">Gross Profit Trajectory</span>
          </span>

          <span className="flex items-center gap-1.5 hidden md:flex">
            <span className="w-2 h-2 rounded-full border border-brand-sage bg-surface inline-block shrink-0" />
            <span>Active Billing Days</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>14-Day Cumulative:</span>
          <strong className="text-text font-bold">{formatCurrency(totalPeriodRevenue)}</strong>
          <span className="text-brand-sage font-semibold">({overallMargin.toFixed(1)}% Realized Margin)</span>
        </div>
      </div>
    </div>
  );
}
