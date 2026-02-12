import m from "mithril";
import * as d3 from "d3";
import AppState, { type AggregatedResult } from "../models/AppState";

const MARGIN = { top: 30, right: 120, bottom: 50, left: 50 };

// Define the shape of your data
interface ChartData {
  value: number;
  label: string;
}

// Define the attributes the component expects
interface Attrs {
  aggregatedData: AggregatedResult[];
  height: number;
}

const drawChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, height } = vnode.attrs;
  const width = vnode.dom.clientWidth;
  const data = aggregatedData.map((d) => ({
    ...d,
    date: new Date(d.timestamp),
  }));

  // vnode.dom is the raw HTMLElement rendered by Mithril
  const container = d3.select<HTMLElement, unknown>(vnode.dom as HTMLElement);
  const drawingWidth = width - MARGIN.right - MARGIN.left;
  const drawingHeight = height - MARGIN.top - MARGIN.bottom;

  // Date-axis
  const xExtent = d3.extent(data.map((d) => d.date)) as [Date, Date];
  xExtent[1] = d3.timeDay.offset(xExtent[1], data[data.length - 1].days); // allow for end of cycle
  const xScale = d3.scaleTime().domain(xExtent).range([0, drawingWidth]);
  const xAxisTicks = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(() => "" as any); // Hide monthly tick labels
  const xAxisQuarterlyLabels = d3
    .axisBottom(xScale)
    .ticks(d3.timeMonth.every(3))
    .tickSize(9)
    .tickFormat(d3.timeFormat("%b %Y") as any);

  // 'Consumption' axis
  const consumptionExtent = d3.extent(data.map((d) => d.consumption)) as [
    number,
    number,
  ];
  const consumptionScale = d3
    .scaleLinear()
    .domain([0, consumptionExtent[1]])
    .range([drawingHeight, 0])
    .nice();
  const consumptionAxis = d3
    .axisLeft(consumptionScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // 'Cost' axis
  const costExtent = d3.extent(data.map((d) => d.cost)) as [number, number];
  const costScale = d3
    .scaleLinear()
    .domain([0, costExtent[1]])
    .range([drawingHeight, 0])
    .nice();
  const costAxis = d3
    .axisRight(costScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // 'DegreeDays' axis
  const degreeDayExtent = d3.extent(data.map((d) => d.heatdegdays)) as [
    number,
    number,
  ];
  const degreeDayScale = d3
    .scaleLinear()
    .domain([0, degreeDayExtent[1]])
    .range([drawingHeight, 0])
    .nice();
  const degreeDayAxis = d3
    .axisRight(degreeDayScale)
    .ticks(5)
    .tickFormat(d3.format(".2s") as any);

  // Selection and drawing area. Type the selection with <ElementType, DataType>
  const svg = container
    .selectAll<SVGSVGElement, ChartData[]>("svg")
    .data([null]);

  const svgEnter = svg
    .enter()
    .append("svg")
    .attr("width", width)
    .attr("height", height); // Extra space for x-axis

  const drawingArea = svgEnter
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // X-axis
  drawingArea
    .append("g")
    .attr("transform", `translate(0, ${drawingHeight})`)
    .call(xAxisTicks);
  drawingArea
    .append("g")
    .attr("transform", `translate(0, ${drawingHeight})`)
    .call(xAxisQuarterlyLabels);
  drawingArea
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle") // Centers the text on its X coordinate
    .attr("x", drawingWidth / 2) // Horizontal center of the chart
    .attr("y", drawingHeight + MARGIN.bottom - 15) // Positioned 35px below the axis line
    .attr("fill", "black") // Ensure label is visible
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Month");

  // Consumption axis
  drawingArea
    .selectAll<SVGGElement, null>(".consumption-axis")
    .data([null])
    .join("g")
    .attr("class", "consumption-axis")
    .attr("transform", `translate(0, 0)`)
    .call(consumptionAxis);
  drawingArea
    .selectAll<SVGGElement, null>(".consumption-axis-label")
    .data([null])
    .join("text")
    .attr("class", "consumption-axis-label")
    .attr("transform", "rotate(-90)") // Rotate for vertical label
    .attr("x", -drawingHeight / 2)
    .attr("y", -MARGIN.left + 15) // Position to the left of the axis
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Consumption (kWh)");

  // Heating degree day axis
  drawingArea
    .selectAll<SVGGElement, null>(".hdd-axis")
    .data([null])
    .join("g")
    .attr("class", "hdd-axis")
    .attr("transform", `translate(${drawingWidth}, 0)`)
    .call(degreeDayAxis);
  drawingArea
    .selectAll<SVGGElement, null>(".hdd-axis-label")
    .data([null])
    .join("text")
    .attr("class", "hdd-axis-label")
    .attr("transform", "rotate(-90)") // Rotate for vertical label
    .attr("x", -drawingHeight / 2)
    .attr("y", drawingWidth + 38) // Position to the right of the axis
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "#d62728")
    .text("Heating Degree Days");

  // Cost axis
  drawingArea
    .selectAll<SVGGElement, null>(".cost-axis")
    .data([null])
    .join("g")
    .attr("class", "cost-axis")
    .attr("transform", `translate(${drawingWidth + 60}, 0)`)
    .call(costAxis);
  drawingArea
    .selectAll<SVGGElement, null>(".cost-axis-label")
    .data([null])
    .join("text")
    .attr("class", "cost-axis-label")
    .attr("transform", "rotate(-90)") // Rotate for vertical label
    .attr("x", -drawingHeight / 2)
    .attr("y", drawingWidth + 60 + 38) // Position to the right of the axis
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "green")
    .text("Cost ($)");

  // Consumption bars
  drawingArea
    .selectAll<SVGRectElement, ChartData>("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => xScale(d3.timeDay.offset(d.date, 1)))
    .attr("y", (d) => consumptionScale(d.consumption))
    .attr("width", (d) => {
      const end = d3.timeDay.offset(d.date, d.days - 2);
      return xScale(end) - xScale(d.date);
    })
    .attr("height", (d) => drawingHeight - consumptionScale(d.consumption))
    .attr("fill", "steelblue");

  // Cost points
  drawingArea
    .selectAll<SVGRectElement, ChartData>(".cost-point")
    .data(data)
    .join("circle")
    .attr("class", "cost-point")
    .attr("cx", (d) => {
      const end = d3.timeDay.offset(d.date, d.days);
      return xScale(d.date) + (xScale(end) - xScale(d.date)) / 2;
    })
    .attr("cy", (d) => costScale(d.cost))
    .attr("r", 4)
    .attr("fill", "green")
    .attr("stroke", "white")
    .attr("stroke-width", 1);
  // Degree day points
  drawingArea
    .selectAll<SVGRectElement, ChartData>(".heating-degree-day-point")
    .data(data)
    .join("circle")
    .attr("class", "heating-degree-day-point")
    .attr("cx", (d) => {
      const end = d3.timeDay.offset(d.date, d.days);
      return xScale(d.date) + (xScale(end) - xScale(d.date)) / 2;
    })
    .attr("cy", (d) => degreeDayScale(d.heatdegdays))
    .attr("r", 4)
    .attr("fill", "#d62728")
    .attr("stroke", "white")
    .attr("stroke-width", 1);
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
          height: 400,
        })
      : m("p", "No data available"),
};

export default AggregatedDataPlot;
