import m from "mithril";
import AppState, { AggregatedDailyResult } from "../models/AppState";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  selectTooltip,
  drawAxis,
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
  const { scale: xScale } = drawAxis(
    chart,
    "bottom",
    data.map((d) => d.heatDegDays as number),
    "Heating Degree Days",
    width,
    height,
    COLOR.degreeDay,
    "degree-day-daily",
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

  drawPoints(
    chart,
    data,
    "heatdegdays-consumption",
    (d) => xScale(d.heatDegDays as number),
    (d) => yScale(d.consumption),
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
