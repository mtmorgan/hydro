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
  drawDateAxis,
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
  const { scale: xScale } = drawDateAxis(
    chart,
    "bottom",
    data.map((d) => d.date),
    "Month",
    width,
    height,
    COLOR.month,
    data[data.length - 1].days,
    "month",
  );
  const xScaleMidpoint = (d: ChartTrace) => {
    const start = xScale(d.date);
    const end = xScale(d3.timeDay.offset(d.date, d.days));
    return start + (end - start) / 2;
  };

  // 'Degree Day' axis
  const { scale: degreeDayScale } = drawAxis(
    chart,
    "left",
    data.map((d) => d.heatdegdays),
    "Heating Degree Days",
    width,
    height,
    COLOR.degreeDay,
    "degreeday",
  );

  // 'Consumption' axis
  const { scale: consumptionScale } = drawAxis(
    chart,
    "right",
    data.map((d) => d.consumption),
    "Consumption (kWh)",
    width,
    height,
    COLOR.consumption,
    "consumption",
  );

  // 'Cost' axis
  const { scale: costScale } = drawAxis(
    chart,
    "right2",
    data.map((d) => d.cost),
    "Cost ($)",
    width,
    height,
    COLOR.cost,
    "cost",
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
  const { scale: xScale } = drawAxis(
    chart,
    "bottom",
    data.map((d) => d.heatdegdays as number),
    "Heating Degree Days",
    width,
    height,
    COLOR.degreeDay,
    "heatdegdays-daily",
  );

  // 'Consumption' axis (y)
  const { scale: yScale } = drawAxis(
    chart,
    "left",
    data.map((d) => d.consumption as number),
    "Consumption (kWh)",
    width,
    height,
    COLOR.consumption,
    "consumption-daily",
  );

  drawScatterplotLine(
    chart,
    data,
    "heatdegdays-consumption",
    (d) => xScale(d.heatdegdays),
    (d) => yScale(d.consumption),
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
