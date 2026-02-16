import m from "mithril";
import * as d3 from "d3";
import AppState, { type AggregatedResult } from "../models/AppState";

const MARGIN = { top: 30, right: 120, bottom: 50, left: 50 };

const COLOR = {
  month: "black",
  degreeDay: "#B0BEC5",
  consumption: "#3F51B5",
  cost: "#FFC107",
};

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

const selectChart = (
  vnode: m.VnodeDOM<Attrs>,
  chartClass: string,
  width: number,
  height: number,
) => {
  const chartId = `${chartClass}-chart`;
  const container = d3.select<HTMLElement, unknown>(vnode.dom as HTMLElement);

  const svg = container
    .selectAll<SVGSVGElement, null>(`.${chartId}-svg`)
    .data([null])
    .join("svg")
    .attr("class", chartId)
    .attr("width", width)
    .attr("height", height);

  const chart = svg
    .selectAll<SVGGElement, null>(`${chartId}-chart`)
    .data([null])
    .join("g")
    .attr("class", chartId)
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  return chart;
};

const selectTooltip = (vnode: m.VnodeDOM<Attrs>, className: string) => {
  const classId = `${className}-tooltip`;
  return d3
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
};

const formatTooltipDate = d3.timeFormat("%B %Y");

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

const drawPoints = <T extends ChartTrace>(
  chart: d3.Selection<SVGGElement, any, SVGSVGElement, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  y: (d: T) => number,
  fill: string,
  tooltip: d3.Selection<HTMLDivElement, null, any, any> | null = null,
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
        tooltip.style("visibility", "visible").html(formatTooltipDate(d.date));
    })
    .on("mousemove", (event) => {
      // Position the tooltip near the mouse cursor
      tooltip &&
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip && tooltip.style("visibility", "hidden");
    });
};

const drawBars = <T extends ChartTrace>(
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
const drawLine = <T extends ChartTrace>(
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

const drawScatterplotLine = <T extends ChartTrace>(
  chart: d3.Selection<SVGGElement, any, any, any>,
  data: T[],
  className: string,
  x: (d: T) => number,
  y: (d: T) => number,
  fill: string,
  stroke: string,
  tooltip: d3.Selection<HTMLDivElement, null, any, any>,
) => {
  drawLine(chart, data, className, x, y, stroke);
  drawPoints(chart, data, className, x, y, fill, tooltip);
};

const drawHeatingConsumptionCostChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, clientHeight: clientHeight } = vnode.attrs;
  const clientWidth = vnode.dom.clientWidth;
  const data = aggregatedData.map((d) => ({
    ...d,
    date: new Date(d.timestamp),
  }));

  // vnode.dom is the raw HTMLElement rendered by Mithril
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;
  const chart = selectChart(
    vnode,
    "heating-consumption-cost",
    clientWidth,
    clientHeight,
  );

  // Date-axis
  const xExtent = d3.extent(data.map((d) => d.date)) as [Date, Date];
  xExtent[1] = d3.timeDay.offset(xExtent[1], data[data.length - 1].days); // allow for end of cycle
  const xScale = d3.scaleTime().domain(xExtent).range([0, width]);
  const xScaleMidpoint = (d: ChartTrace) => {
    const start = xScale(d.date);
    const end = xScale(d3.timeDay.offset(d.date, d.days));
    return start + (end - start) / 2;
  };
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
    COLOR.month,
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
    COLOR.degreeDay,
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
    COLOR.consumption,
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
    COLOR.cost,
  );

  // Degree day bars
  drawBars(
    chart,
    data,
    "heatdegdays",
    (d) => xScale(d.date),
    (d) => xScale(d3.timeDay.offset(d.date, d.days)),
    (d) => degreeDayScale(d.heatdegdays),
    height,
    COLOR.degreeDay,
  );

  // Consumption points
  drawBars(
    chart,
    data,
    "consumption",
    (d) => xScaleMidpoint(d) - 2,
    (d) => xScaleMidpoint(d) + 4,
    (d) => consumptionScale(d.consumption),
    height,
    COLOR.consumption,
  );

  // Cost points
  drawPoints(
    chart,
    data,
    "cost",
    xScaleMidpoint,
    (d) => costScale(d.cost),
    COLOR.cost,
  );
};

const HeatingConsumptionCost: m.ClosureComponent<Attrs> = () => {
  return {
    oncreate(vnode: m.VnodeDOM<Attrs>) {
      drawHeatingConsumptionCostChart(vnode);
    },
    onupdate(vnode: m.VnodeDOM<Attrs>) {
      drawHeatingConsumptionCostChart(vnode);
    },
    view() {
      return [
        m("p", "Expanation of HeatingConsumptionCost"),
        m("div.chart-container"),
      ];
    },
  };
};

const drawHeatingConsumptionChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData } = vnode.attrs;
  const clientWidth = vnode.dom.clientWidth;
  const data = aggregatedData.map((d) => ({
    ...d,
    date: new Date(d.timestamp),
  }));

  // vnode.dom is the raw HTMLElement rendered by Mithril
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = width;
  const clientHeight = height + MARGIN.top + MARGIN.bottom;
  const chart = selectChart(
    vnode,
    "heating-consumption",
    clientWidth,
    clientHeight,
  );
  const tooltip = selectTooltip(vnode, "heating-consumption");

  // 'Degree Day' axis (x)
  const degreeDayExtent = d3.extent(data.map((d) => d.heatdegdays)) as [
    number,
    number,
  ];
  const degreeDayScale = d3
    .scaleLinear()
    .domain([0, degreeDayExtent[1]])
    .range([0, width])
    .nice();
  const degreeDayAxis = d3
    .axisBottom(degreeDayScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // 'Consumption' axis (y)
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
    .axisLeft(consumptionScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // Draw heating degree day (x) axis
  drawAxis(chart, degreeDayAxis, "degree-day", 0, height);
  drawAxisLabel(
    chart,
    "degree-day",
    "Heating Degree Days",
    width / 2,
    height + MARGIN.bottom - 15,
    0,
    COLOR.degreeDay,
  );

  // Draw consumption (y) axis
  drawAxis(chart, consumptionAxis, "consumption-day", 0, 0);
  drawAxisLabel(
    chart,
    "consumption",
    "Consumption (kWh)",
    -height / 2,
    -MARGIN.left + 15,
    -90,
    COLOR.consumption,
  );

  drawScatterplotLine(
    chart,
    data,
    "heatdegdays-consumption",
    (d) => degreeDayScale(d.heatdegdays),
    (d) => consumptionScale(d.consumption),
    COLOR.consumption,
    COLOR.month,
    tooltip,
  );
};

const HeatingConsumption: m.ClosureComponent<Attrs> = () => {
  return {
    oncreate(vnode: m.VnodeDOM<Attrs>) {
      drawHeatingConsumptionChart(vnode);
    },
    onupdate(vnode: m.VnodeDOM<Attrs>) {
      drawHeatingConsumptionChart(vnode);
    },
    view() {
      return m("div.chart-container");
    },
  };
};

const AggregatedDataPlot = {
  view: () =>
    AppState.aggregatedStationData.length > 0
      ? [
          m(
            "div.card-panel",
            m(HeatingConsumptionCost, {
              aggregatedData: AppState.aggregatedStationData,
              clientHeight: 400,
            }),
          ),
          m(
            "div.card-panel",
            m(HeatingConsumption, {
              aggregatedData: AppState.aggregatedStationData,
              clientHeight: 0,
            }),
          ),
        ]
      : m("p", "No data available"),
};

export default AggregatedDataPlot;
