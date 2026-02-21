import m from "mithril";
import * as d3 from "d3";
import AppState, { AggregatedResult } from "../models/AppState";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  ChartTrace,
  selectChart,
  selectTooltip,
  drawAxis,
  drawAxisLabel,
  drawBars,
  drawPoints,
  drawScatterplotLine,
} from "../utils/draw";

// Define the attributes the component expects
interface Attrs extends VnodeDOMAttrs<AggregatedResult> {}

const drawHeatingConsumptionCostChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, clientHeight: clientHeight } = vnode.attrs;
  const clientWidth = Math.max(600, vnode.dom.clientWidth); // minimum width
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
    null,
  );
};

const HeatingConsumptionCost: m.ClosureComponent<Attrs> = () => {
  let observer: ResizeObserver;

  return {
    oncreate: (vnode) => {
      drawHeatingConsumptionCostChart(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawHeatingConsumptionCostChart(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "The gray bars represent heating degree days in each billing period. ",
          "The blue consumption bars closely track heating degree days when ",
          "one has electric heat. The yellow dots are actual cost; cost and ",
          "consumption may differ when, for instance, consumption is ",
          "estimated rather than actual.",
        ),
      );
    },
  };
};

const drawHeatingConsumptionChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData } = vnode.attrs;
  const clientWidth = Math.min(Math.max(400, vnode.dom.clientWidth), 800);
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

  const tooltip = selectTooltip<Attrs, { date: Date }>(
    vnode,
    "heating-consumption",
    (d) => d3.timeFormat("%B %Y")(d.date),
  );

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
  let observer: ResizeObserver;

  return {
    oncreate: (vnode) => {
      drawHeatingConsumptionChart(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawHeatingConsumptionChart(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "The dotted line traces the relationship between heating degree ",
          "days and consumption over time. Mouse over individual points for ",
          "the corresponding date.",
        ),
      );
    },
  };
};

const AggregatedDataPlot = {
  view: () => [
    m(
      "div.card-panel",
      m(
        "p",
        m("strong", "Heating degree days, consumption, and cost over time"),
      ),
      AppState.aggregatedStationData.length === 0
        ? m("div.d3-empty-chart", "Select hydro and climate data.")
        : m(HeatingConsumptionCost, {
            aggregatedData: AppState.aggregatedStationData,
            clientHeight: 400,
          }),
    ),
    m(
      "div.card-panel",
      m("p", m("strong", "Heating degree days and consumption")),
      AppState.aggregatedStationData.length === 0
        ? m("div.d3-empty-chart", "Select hydro and climate data.")
        : m(HeatingConsumption, {
            aggregatedData: AppState.aggregatedStationData,
            clientHeight: 0,
          }),
    ),
  ],
};

export default AggregatedDataPlot;
