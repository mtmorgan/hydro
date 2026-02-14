import m from "mithril";
import * as d3 from "d3";
import AppState, { type AggregatedResult } from "../models/AppState";

const MARGIN = { top: 30, right: 120, bottom: 50, left: 50 };

// Define the attributes the component expects
interface Attrs {
  aggregatedData: AggregatedResult[];
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

const drawAxis = (
  chart: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  axis: d3.Axis<d3.NumberValue>,
  axisClass: string,
  xTranslate: number,
  yTranslate: number,
) => {
  chart
    .selectAll<SVGGElement, null>(`.${axisClass}-axis`)
    .data([null])
    .join("g")
    .attr("class", `${axisClass}-axis`)
    .attr("transform", `translate(${xTranslate}, ${yTranslate})`)
    .call(axis);
};

const drawAxisLabel = (
  chart: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  axisLabelClass: string,
  label: string,
  x: number,
  y: number,
  rotate: number,
  fill: string,
) => {
  chart
    .selectAll<SVGGElement, null>(`.${axisLabelClass}-axis-label`)
    .data([null])
    .join("text")
    .attr("class", `${axisLabelClass}-axis-label`)
    .attr("transform", `rotate(${rotate})`) // Rotate for vertical label
    .attr("x", x)
    .attr("y", y) // Position to the left of the axis
    .attr("text-anchor", "middle")
    .attr("fill", fill) // Ensure label is visible
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(label);
};

const drawPoints = <T extends ChartTrace, K extends keyof T>(
  chart: d3.Selection<SVGGElement, any, SVGSVGElement, any>,
  data: T[],
  field: K,
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  fill: string,
) => {
  const fieldId = String(field);
  chart
    .selectAll<SVGCircleElement, T>(`.${fieldId}-point`)
    .data(data)
    .join("circle")
    .attr("class", `${fieldId}-point`)
    .attr("cx", (d) => {
      const start = xScale(d.date);
      const end = xScale(d3.timeDay.offset(d.date, d.days));
      return start + (end - start) / 2;
    })
    .attr("cy", (d) => yScale(d[field]))
    .attr("r", 4)
    .attr("fill", fill)
    .attr("stroke", "white")
    .attr("stroke-width", 1);
};

const drawBars = <T extends ChartTrace, K extends keyof T>(
  chart: d3.Selection<SVGGElement, any, SVGSVGElement, any>,
  data: T[],
  field: K,
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  height: number,
  fill: string,
) => {
  const fieldId = String(field);
  chart
    .selectAll<SVGRectElement, T>(`.${fieldId}-bar`)
    .data(data)
    .join("rect")
    .attr("class", `${fieldId}-bar`)
    .attr("x", (d) => xScale(d3.timeDay.offset(d.date, 1)))
    .attr("y", (d) => yScale(d[field]))
    .attr("width", (d) => {
      const start = xScale(d.date);
      const end = xScale(d3.timeDay.offset(d.date, d.days));
      // Subtracting a small amount (e.g. 2px) creates a gap between bars
      return Math.max(0, end - start - 2);
    })
    .attr("height", (d) => height - yScale(d[field]))
    .attr("fill", fill);
};

const drawChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, clientHeight: clientHeight } = vnode.attrs;
  const clientWidth = vnode.dom.clientWidth;
  const data = aggregatedData.map((d) => ({
    ...d,
    date: new Date(d.timestamp),
  }));

  // vnode.dom is the raw HTMLElement rendered by Mithril
  const container = d3.select<HTMLElement, unknown>(vnode.dom as HTMLElement);
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;

  // Date-axis
  const xExtent = d3.extent(data.map((d) => d.date)) as [Date, Date];
  xExtent[1] = d3.timeDay.offset(xExtent[1], data[data.length - 1].days); // allow for end of cycle
  const xScale = d3.scaleTime().domain(xExtent).range([0, width]);
  const xAxisTicks = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(() => "" as any); // Hide monthly tick labels
  const xAxisQuarterlyLabels = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(3))
    .tickSize(9)
    .tickFormat(d3.timeFormat("%b %Y") as any);

  // 'Degree Day' axis
  const degreeDayExtent = d3.extent(data.map((d) => d.heatdegdays)) as [
    number,
    number,
  ];
  const degreeDayScale = d3
    .scaleLinear()
    .domain([0, degreeDayExtent[1]])
    .range([height, 0])
    .nice();
  const degreeDayAxis = d3
    .axisLeft(degreeDayScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // 'Consumption' axis
  const consumptionExtent = d3.extent(data.map((d) => d.consumption)) as [
    number,
    number,
  ];
  const consumptionScale = d3
    .scaleLinear()
    .domain([0, consumptionExtent[1]])
    .range([height, 0])
    .nice();
  const consumptionAxis = d3
    .axisRight(consumptionScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // 'Cost' axis
  const costExtent = d3.extent(data.map((d) => d.cost)) as [number, number];
  const costScale = d3
    .scaleLinear()
    .domain([0, costExtent[1]])
    .range([height, 0])
    .nice();
  const costAxis = d3
    .axisRight(costScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // Selection and drawing area. Type the selection with <ElementType, DataType>
  const svg = container
    .selectAll<SVGSVGElement, null>("svg")
    .data([null])
    .join("svg")
    .attr("width", clientWidth)
    .attr("height", clientHeight);

  const chart = svg
    .selectAll<SVGGElement, null>("g.chart")
    .data([null])
    .join("g")
    .attr("class", "chart")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // X-axis
  drawAxis(chart, xAxisTicks, "x", 0, height);
  drawAxis(chart, xAxisQuarterlyLabels, "x-quarterly", 0, height);
  drawAxisLabel(
    chart,
    "x",
    "Month",
    width / 2,
    height + MARGIN.bottom - 15,
    0,
    "black",
  );

  // Heating degree day axis
  drawAxis(chart, degreeDayAxis, "degree-day", 0, 0);
  drawAxisLabel(
    chart,
    "degree-day",
    "Heating Degree Days",
    -height / 2,
    -MARGIN.left + 15,
    -90,
    "#B0BEC5",
  );

  // Consumption axis
  drawAxis(chart, consumptionAxis, "consumption", width, 0);
  drawAxisLabel(
    chart,
    "consumption",
    "Consumption (kWh)",
    -height / 2,
    width + 40,
    -90,
    "#3F51B5",
  );

  // Cost axis
  drawAxis(chart, costAxis, "cost", width + 60, 0);
  drawAxisLabel(
    chart,
    "cost",
    "Cost ($)",
    -height / 2,
    width + 60 + 40,
    -90,
    "#FFC107",
  );

  // Degree day points
  drawBars(
    chart,
    data,
    "heatdegdays",
    xScale,
    degreeDayScale,
    height,
    "#B0BEC5",
  );

  // Consumption bars
  drawPoints(chart, data, "consumption", xScale, consumptionScale, "#3F51B5");

  // Cost points
  drawPoints(chart, data, "cost", xScale, costScale, "#FFC107");
};

const AggregatedD3: m.ClosureComponent<Attrs> = () => {
  return {
    oncreate(vnode: m.VnodeDOM<Attrs>) {
      drawChart(vnode);
    },
    onupdate(vnode: m.VnodeDOM<Attrs>) {
      drawChart(vnode);
    },
    view() {
      return m("div.chart-container");
    },
  };
};

const AggregatedDataPlot = {
  view: () =>
    AppState.aggregatedStationData.length > 0
      ? m(AggregatedD3, {
          aggregatedData: AppState.aggregatedStationData,
          clientHeight: 400,
        })
      : m("p", "No data available"),
};

export default AggregatedDataPlot;
