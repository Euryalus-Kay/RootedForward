/* ------------------------------------------------------------------ */
/*  ResearchChart                                                      */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Dependency free SVG chart renderer for inline research figures.   */
/*                                                                     */
/*  Supported chart types:                                             */
/*    - bar   : grouped bar chart.                                     */
/*    - line  : line chart (time series).                              */
/*    - pie   : pie chart.                                             */
/*                                                                     */
/*  Driven from a JSON config block embedded in the article markdown: */
/*                                                                     */
/*      ```chart                                                       */
/*      {                                                              */
/*        "type": "bar",                                               */
/*        "title": "Median asking rent, OPC impact zone",              */
/*        "caption": "Figure 1. Annual median rent ...",               */
/*        "x": ["2020", "2021", "2022", "2023", "2024", "2025"],       */
/*        "series": [                                                  */
/*          { "name": "Impact zone", "data": [1075, 1121, 1197,       */
/*              1280, 1389, 1516] },                                   */
/*          { "name": "Control",     "data": [1050, 1082, 1117,       */
/*              1162, 1217, 1302] }                                    */
/*        ]                                                            */
/*      }                                                              */
/*      ```                                                            */
/*                                                                     */
/*  Colors align with the Rooted Forward palette: forest, rust,       */
/*  warm gray, and ink, with opacity steps for additional series.     */
/*                                                                     */
/* ------------------------------------------------------------------ */

import React from "react";

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartConfig {
  type: "bar" | "line" | "pie";
  title?: string;
  caption?: string;
  xLabel?: string;
  yLabel?: string;
  x?: string[];
  series?: ChartSeries[];
  /** For pie charts, an alternative single series format. */
  slices?: { name: string; value: number }[];
  /** Optional explicit y axis min/max. */
  yMin?: number;
  yMax?: number;
  /** Optional unit suffix for labels ("%", "$", etc.). */
  unit?: string;
  /** Optional unit prefix for labels ("$"). */
  prefix?: string;
}

interface ResearchChartProps {
  config: ChartConfig;
  /** Figure number to display in the caption. */
  figureNumber?: number;
}

const PALETTE = [
  "var(--color-forest, #1B3A2D)",
  "var(--color-rust, #C45D3E)",
  "var(--color-warm-gray, #8A8578)",
  "var(--color-ink, #1A1A1A)",
  "var(--color-forest-light, #2A5440)",
  "var(--color-rust-light, #D4765C)",
];

/* ------------------------------------------------------------------ */
/*  Number formatting                                                  */
/* ------------------------------------------------------------------ */

function formatNumber(
  n: number,
  opts: { prefix?: string; unit?: string } = {}
): string {
  const { prefix = "", unit = "" } = opts;
  const abs = Math.abs(n);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  } else if (abs >= 1_000) {
    formatted = (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "k";
  } else if (abs >= 10) {
    formatted = Math.round(n).toString();
  } else {
    formatted = n.toFixed(1);
  }
  return `${prefix}${formatted}${unit}`;
}

/* ------------------------------------------------------------------ */
/*  Bar chart                                                          */
/* ------------------------------------------------------------------ */

function BarChart({
  config,
  width,
  height,
}: {
  config: ChartConfig;
  width: number;
  height: number;
}) {
  const x = config.x ?? [];
  const series = config.series ?? [];

  const padding = { top: 20, right: 16, bottom: 40, left: 54 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const rawMax = allValues.length > 0 ? Math.max(...allValues) : 1;
  const rawMin = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  const yMax = config.yMax ?? niceCeiling(rawMax);
  const yMin = config.yMin ?? (rawMin < 0 ? niceFloor(rawMin) : 0);
  const yRange = yMax - yMin || 1;

  const groupW = chartW / x.length;
  const barGap = 4;
  const barW = Math.max(
    4,
    (groupW - barGap * (series.length + 1)) / Math.max(series.length, 1)
  );

  // Y axis gridlines (five lines including top and bottom)
  const gridSteps = 5;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const value = yMin + (yRange * i) / gridSteps;
    const y = padding.top + chartH - (chartH * i) / gridSteps;
    return { value, y };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={config.title ?? "Bar chart"}
      className="w-full max-w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {gridValues.map((g, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={padding.left + chartW}
            y1={g.y}
            y2={g.y}
            stroke="var(--color-border, #DDD6C8)"
            strokeWidth={0.75}
          />
          <text
            x={padding.left - 8}
            y={g.y + 3}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--font-body)"
            fill="var(--color-warm-gray, #8A8578)"
          >
            {formatNumber(g.value, { prefix: config.prefix, unit: config.unit })}
          </text>
        </g>
      ))}

      {/* Axis */}
      <line
        x1={padding.left}
        x2={padding.left + chartW}
        y1={padding.top + chartH}
        y2={padding.top + chartH}
        stroke="var(--color-ink, #1A1A1A)"
        strokeWidth={1}
      />

      {/* Bars */}
      {x.map((label, xi) => {
        const groupX = padding.left + groupW * xi + barGap;
        return (
          <g key={label}>
            {series.map((s, si) => {
              const v = s.data[xi] ?? 0;
              const h = Math.max(0, ((v - yMin) / yRange) * chartH);
              const x = groupX + si * (barW + barGap);
              const y = padding.top + chartH - h;
              return (
                <g key={s.name}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    fill={PALETTE[si % PALETTE.length]}
                    opacity={0.9}
                  />
                </g>
              );
            })}
            <text
              x={groupX + groupW / 2 - barGap}
              y={padding.top + chartH + 16}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-body)"
              fill="var(--color-ink, #1A1A1A)"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Line chart                                                         */
/* ------------------------------------------------------------------ */

function LineChart({
  config,
  width,
  height,
}: {
  config: ChartConfig;
  width: number;
  height: number;
}) {
  const x = config.x ?? [];
  const series = config.series ?? [];

  const padding = { top: 20, right: 16, bottom: 40, left: 54 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const rawMax = allValues.length > 0 ? Math.max(...allValues) : 1;
  const rawMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const yMax = config.yMax ?? niceCeiling(rawMax);
  const yMin = config.yMin ?? niceFloor(rawMin);
  const yRange = yMax - yMin || 1;

  const pointX = (i: number) =>
    padding.left + (chartW / Math.max(x.length - 1, 1)) * i;
  const pointY = (v: number) =>
    padding.top + chartH - ((v - yMin) / yRange) * chartH;

  const gridSteps = 5;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const value = yMin + (yRange * i) / gridSteps;
    const y = padding.top + chartH - (chartH * i) / gridSteps;
    return { value, y };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={config.title ?? "Line chart"}
      className="w-full max-w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {gridValues.map((g, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={padding.left + chartW}
            y1={g.y}
            y2={g.y}
            stroke="var(--color-border, #DDD6C8)"
            strokeWidth={0.75}
          />
          <text
            x={padding.left - 8}
            y={g.y + 3}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--font-body)"
            fill="var(--color-warm-gray, #8A8578)"
          >
            {formatNumber(g.value, { prefix: config.prefix, unit: config.unit })}
          </text>
        </g>
      ))}

      {/* Series */}
      {series.map((s, si) => {
        const pathD = s.data
          .map((v, i) => `${i === 0 ? "M" : "L"} ${pointX(i)} ${pointY(v)}`)
          .join(" ");
        const color = PALETTE[si % PALETTE.length];
        return (
          <g key={s.name}>
            <path
              d={pathD}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.data.map((v, i) => (
              <circle
                key={i}
                cx={pointX(i)}
                cy={pointY(v)}
                r={3}
                fill={color}
              />
            ))}
          </g>
        );
      })}

      {/* X axis labels */}
      {x.map((label, i) => (
        <text
          key={label}
          x={pointX(i)}
          y={padding.top + chartH + 16}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-body)"
          fill="var(--color-ink, #1A1A1A)"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Pie chart                                                          */
/* ------------------------------------------------------------------ */

function PieChart({
  config,
  width,
  height,
}: {
  config: ChartConfig;
  width: number;
  height: number;
}) {
  const slices =
    config.slices ??
    (config.series?.[0]?.data ?? []).map((v, i) => ({
      name: (config.x?.[i] ?? `Slice ${i + 1}`) as string,
      value: v,
    }));

  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const cx = width / 2;
  const cy = height / 2 + 4;
  const radius = Math.min(width, height) * 0.34;

  let acc = 0;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={config.title ?? "Pie chart"}
      className="w-full max-w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {slices.map((s, i) => {
        const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += s.value;
        const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const midAngle = (startAngle + endAngle) / 2;
        const labelX = cx + (radius + 18) * Math.cos(midAngle);
        const labelY = cy + (radius + 18) * Math.sin(midAngle);
        const pct = Math.round((s.value / total) * 100);
        return (
          <g key={s.name}>
            <path
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={PALETTE[i % PALETTE.length]}
              opacity={0.92}
              stroke="var(--color-cream, #F5F0E8)"
              strokeWidth={1.5}
            />
            {pct >= 4 && (
              <text
                x={labelX}
                y={labelY}
                textAnchor={labelX > cx ? "start" : "end"}
                fontSize="10"
                fontFamily="var(--font-body)"
                fill="var(--color-ink, #1A1A1A)"
              >
                {s.name} ({pct}%)
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function niceCeiling(n: number): number {
  if (n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const scaled = n / pow;
  let mult = 1;
  if (scaled > 1) mult = 2;
  if (scaled > 2) mult = 5;
  if (scaled > 5) mult = 10;
  return mult * pow;
}

function niceFloor(n: number): number {
  if (n >= 0) return 0;
  return -niceCeiling(-n);
}

/* ------------------------------------------------------------------ */
/*  Legend                                                             */
/* ------------------------------------------------------------------ */

function Legend({
  items,
}: {
  items: { name: string; color: string }[];
}) {
  if (items.length <= 1) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-1.5 font-body text-[12px] text-ink/75"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-4"
            style={{ background: item.color }}
          />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

export default function ResearchChart({
  config,
  figureNumber,
}: ResearchChartProps) {
  const width = 640;
  const height = config.type === "pie" ? 320 : 280;

  const legendItems =
    config.type === "pie"
      ? (config.slices ?? []).map((s, i) => ({
          name: s.name,
          color: PALETTE[i % PALETTE.length],
        }))
      : (config.series ?? []).map((s, i) => ({
          name: s.name,
          color: PALETTE[i % PALETTE.length],
        }));

  return (
    <figure
      className="my-4 rounded-sm border border-border bg-cream-dark/30 p-4"
      role="group"
      aria-labelledby={config.title ? `chart-title-${figureNumber ?? ""}` : undefined}
    >
      {config.title && (
        <p
          id={figureNumber ? `chart-title-${figureNumber}` : undefined}
          className="mb-2 font-display text-[15px] font-medium leading-snug text-forest"
        >
          {config.title}
        </p>
      )}

      {config.type === "bar" && (
        <BarChart config={config} width={width} height={height} />
      )}
      {config.type === "line" && (
        <LineChart config={config} width={width} height={height} />
      )}
      {config.type === "pie" && (
        <PieChart config={config} width={width} height={height} />
      )}

      <Legend items={legendItems} />

      {(config.caption || figureNumber) && (
        <figcaption className="mt-3 font-body text-[12.5px] leading-snug text-warm-gray">
          {figureNumber !== undefined ? (
            <span className="font-medium text-ink/70">
              Figure {figureNumber}.{" "}
            </span>
          ) : null}
          {config.caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  Parser: safely read a chart config string                          */
/* ------------------------------------------------------------------ */

/**
 * Parse a chart config JSON string from inside a fenced code block.
 * Returns null on any parse error so the renderer can fall back to
 * showing the code block as preformatted text.
 */
export function parseChartConfig(raw: string): ChartConfig | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { type } = parsed as Partial<ChartConfig>;
    if (type !== "bar" && type !== "line" && type !== "pie") return null;
    return parsed as ChartConfig;
  } catch {
    return null;
  }
}
