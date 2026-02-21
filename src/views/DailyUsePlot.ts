import m from "mithril";
import * as d3 from "d3";
import AppState, { AggregatedDailyResult } from "../models/AppState";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  selectTooltip,
  drawAxis,
  drawAxisLabel,
  drawPoints,
} from "../utils/draw";
import { formatDate } from "../utils/date";

interface Attrs extends VnodeDOMAttrs<AggregatedDailyResult> {}

const drawDailyHeatingConsumptionChart = (vnode: m.VnodeDOM<Attrs>) => {
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
    "heating-consumption-daily",
    clientWidth,
    clientHeight,
  );

  const tooltip = selectTooltip<Attrs, { timestamp: number }>(
    vnode,
    "heating-consumption-daily",
    (d) => formatDate(d.timestamp),
  );

  // 'Degree Day' axis (x)
  const degreeDayExtent = d3.extent(
    data.map((d) => d.heatDegDays as number),
  ) as [number, number];
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

  drawPoints(
    chart,
    data,
    "heatdegdays-consumption",
    (d) => degreeDayScale(d.heatDegDays as number),
    (d) => consumptionScale(d.consumption),
    COLOR.consumption,
    tooltip,
  );
};

const DailyHeatingConsumption: m.ClosureComponent<Attrs> = () => {
  let observer: ResizeObserver;

  return {
    oncreate: (vnode) => {
      drawDailyHeatingConsumptionChart(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawDailyHeatingConsumptionChart(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m("div.chart-container", m("p", "FIXME: description."));
    },
  };
};

const DailyUsePlot: m.Component = {
  view: () => [
    m(
      "div.card-panel",
      m("p", m("stong", "Daily heating degree days and consumption")),
      AppState.aggregatedDailyData.length > 0 &&
        m(DailyHeatingConsumption, {
          aggregatedData: AppState.aggregatedDailyData,
          clientHeight: 0,
        }),
    ),
  ],
};

export default DailyUsePlot;
