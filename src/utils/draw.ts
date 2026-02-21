import m from "mithril";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 120, bottom: 50, left: 50 };

const COLOR = {
  month: "black",
  day: "black",
  degreeDay: "#B0BEC5",
  consumption: "#3F51B5",
  cost: "#FFC107",
};

interface VnodeDOMAttrs<T> {
  aggregatedData: T[];
  clientHeight: number;
}

/**
 * Represents the minimum data structure required for a chart trace (points,
 * bars, etc.).
 */
interface ChartTrace {
  /** The starting date/time of the data point (used for X-axis positioning) */
  date: Date;
  /** The duration in days that this data point represents (used for bar width
   * or centering over bars)
   */
  days: number;
  /**
   * Additional dynamic properties (e.g., consumption, heatingDegreeDays)
   * are allowed and will be accessed via the 'field' parameter in drawPoints,
   * drawBars, etc.
   */
  [key: string]: any;
}

interface Tooltip<T> {
  selection: d3.Selection<HTMLDivElement, null, HTMLElement, unknown>;
  format: (d: T) => string;
}

const selectChart = <T>(
  vnode: m.VnodeDOM<T>,
  className: string,
  width: number,
  height: number,
) => {
  const svgId = `${className}-svg`;
  const classId = `${className}-chart`;
  const container = d3.select<HTMLElement, unknown>(vnode.dom as HTMLElement);

  const svg = container
    .selectAll<SVGSVGElement, null>(`.${svgId}`)
    .data([null])
    .join("svg")
    .attr("class", svgId)
    .attr("width", width)
    .attr("height", height);

  const chart = svg
    .selectAll<SVGGElement, null>(`.${classId}`)
    .data([null])
    .join("g")
    .attr("class", classId)
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  return chart;
};

const selectTooltip = <T, D>(
  vnode: m.VnodeDOM<T>,
  className: string,
  format: (d: D) => string,
): Tooltip<D> => {
  const classId = `${className}-tooltip`;
  const selection = d3
    .select(vnode.dom as HTMLElement)
    .selectAll<HTMLDivElement, null>(`.${classId}`)
    .data([null])
    .join("div")
    .attr("class", classId)
    .style("position", "absolute")
    .style("visibility", "hidden") // Hidden by default
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none"); // Prevents tooltip from blocking mouse events
  return {
    selection: selection,
    format: format,
  };
};

type AxisPosition = "bottom" | "left" | "right" | "right2";

interface AxisStrategy {
  factory: (scale: d3.AxisScale<d3.NumberValue>) => d3.Axis<d3.NumberValue>;
  // Logic for D3 range: [0, w] for bottom, [h, 0] for left
  range: (width: number, height: number) => [number, number];
  // Translation for the <g> element that holds the axis line/ticks
  axisTranslate: (width: number, height: number) => [number, number];
  // Strategy for the text label
  label: {
    x: (width: number, height: number) => number;
    y: (width: number, height: number) => number;
    rotate: number;
  };
}

const AXIS_CONFIG: Record<AxisPosition, AxisStrategy> = {
  bottom: {
    factory: d3.axisBottom,
    range: (w) => [0, w],
    axisTranslate: (_, h) => [0, h],
    label: {
      x: (w) => w / 2,
      y: (_, h) => h + MARGIN.bottom - 15,
      rotate: 0,
    },
  },
  left: {
    factory: d3.axisLeft,
    range: (_, h) => [h, 0],
    axisTranslate: () => [0, 0],
    label: {
      x: () => -MARGIN.left + 15,
      y: (_, h) => h / 2,
      rotate: -90,
    },
  },
  right: {
    factory: d3.axisRight,
    range: (_, h) => [h, 0],
    axisTranslate: (w) => [w, 0],
    label: {
      x: (w) => w + 40,
      y: (_, h) => h / 2,
      rotate: -90,
    },
  },
  right2: {
    factory: d3.axisRight,
    range: (_, h) => [h, 0],
    axisTranslate: (w) => [w + 60, 0],
    label: {
      x: (w) => w + 60 + 40,
      y: (_, h) => h / 2,
      rotate: -90,
    },
  },
};

export const drawAxisSet = (
  chart: d3.Selection<SVGGElement, any, any, any>,
  position: AxisPosition,
  values: number[],
  label: string,
  width: number,
  height: number,
  fill: string,
  className: string = "chart",
  tickFormat: string = ".2s",
) => {
  const strategy = AXIS_CONFIG[position];

  // extent and scale of axis
  const extent = d3.extent(values) as [number, number];
  const scale = d3
    .scaleLinear()
    .domain([0, extent[1]])
    .range(strategy.range(width, height)) // Range is now automated
    .nice();
  const axis = strategy
    .factory(scale)
    .ticks(5)
    .tickFormat(d3.format(tickFormat) as any);

  // render axis
  const [tx, ty] = strategy.axisTranslate(width, height);
  const axisClass = `${className}-${position}-axis`;
  chart
    .selectAll<SVGGElement, any>(`.${axisClass}`)
    .data([null])
    .join("g")
    .attr("class", axisClass)
    .attr("transform", `translate(${tx}, ${ty})`)
    .call(axis);

  // render axis label
  const labelClass = `${className}-${position}-label`;
  chart
    .selectAll<SVGTextElement, string>(`.${labelClass}`)
    .data([label])
    .join("text")
    .attr("class", labelClass)
    .attr("text-anchor", "middle")
    .attr("fill", fill)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .attr(
      "transform",
      `translate(
        ${strategy.label.x(width, height)},${strategy.label.y(width, height)})
        rotate(${strategy.label.rotate})
      `,
    )
    .text((d) => d);

  return { scale, extent };
};

const drawAxis = (
  chart: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  axis: d3.Axis<d3.NumberValue>,
  className: string,
  xTranslate: number,
  yTranslate: number,
) => {
  const classId = `${className}-axis`;
  chart
    .selectAll<SVGGElement, null>(`.${classId}`)
    .data([null])
    .join("g")
    .attr("class", classId)
    .attr("transform", `translate(${xTranslate}, ${yTranslate})`)
    .call(axis);
};

const drawAxisLabel = (
  chart: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  className: string,
  label: string,
  x: number,
  y: number,
  rotate: number,
  fill: string,
) => {
  const classId = `${className}-axis-label`;
  chart
    .selectAll<SVGGElement, null>(`.${classId}`)
    .data([null])
    .join("text")
    .attr("class", classId)
    .attr("transform", `rotate(${rotate})`) // Rotate for vertical label
    .attr("x", x)
    .attr("y", y) // Position to the left of the axis
    .attr("text-anchor", "middle")
    .attr("fill", fill) // Ensure label is visible
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(label);
};

const drawPoints = <T>(
  chart: d3.Selection<SVGGElement, any, SVGSVGElement, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  y: (d: T) => number,
  fill: string,
  tooltip: Tooltip<T> | null,
) => {
  const classId = `${className}-point`;
  chart
    .selectAll<SVGCircleElement, T>(`.${classId}`)
    .data(data)
    .join("circle")
    .attr("class", classId)
    .attr("cx", (d) => x(d))
    .attr("cy", (d) => y(d))
    .attr("r", 4)
    .attr("fill", fill)
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("mouseover", (_, d) => {
      tooltip &&
        tooltip.selection
          .style("visibility", "visible")
          .html(tooltip.format(d));
    })
    .on("mousemove", (event) => {
      // Position the tooltip near the mouse cursor
      tooltip &&
        tooltip.selection
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip && tooltip.selection.style("visibility", "hidden");
    });
};

const drawBars = <T>(
  chart: d3.Selection<SVGGElement, any, SVGSVGElement, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  xEnd: (d: T) => number,
  y: (d: T) => number,
  height: number,
  fill: string,
) => {
  const classId = `${className}-bar`;
  chart
    .selectAll<SVGRectElement, T>(`.${classId}`)
    .data(data)
    .join("rect")
    .attr("class", classId)
    .attr("x", (d) => x(d))
    .attr("y", (d) => y(d))
    .attr("width", (d) => Math.max(0, xEnd(d) - x(d) - 2))
    .attr("height", (d) => height - y(d))
    .attr("fill", fill);
};

/**
 * Renders line segements between x- and y- fields.
 */
const drawLine = <T>(
  chart: d3.Selection<SVGGElement, any, any, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  y: (d: T) => number,
  stroke: string = "#ff7f0e",
) => {
  const classId = `${className}-line`;
  const lineGenerator = d3
    .line<T>()
    .x((d) => x(d))
    .y((d) => y(d));

  // 2. Use .join() on a single-item array [data] to update one path
  chart
    .selectAll<SVGPathElement, T[]>(`.${classId}`)
    .data([data]) // Wrap data in an array so D3 creates exactly ONE path
    .join("path")
    .attr("class", classId)
    .attr("fill", "none")
    .attr("stroke", stroke)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "1, 5")
    .attr("d", lineGenerator); // Apply the path string
};

const drawScatterplotLine = <T>(
  chart: d3.Selection<SVGGElement, any, any, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  y: (d: T) => number,
  fill: string,
  stroke: string,
  tooltip: Tooltip<T> | null,
) => {
  drawLine(chart, data, className, x, y, stroke);
  drawPoints(chart, data, className, x, y, fill, tooltip);
};

export {
  MARGIN,
  COLOR,
  // interfaces
  VnodeDOMAttrs,
  ChartTrace,
  // select
  selectChart,
  selectTooltip,
  // draw
  drawAxis,
  drawAxisLabel,
  drawPoints,
  drawBars,
  drawLine,
  drawScatterplotLine,
};
