import m from "mithril";
import AppState, { HourlyResult } from "../models/AppState";
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

interface Attrs extends VnodeDOMAttrs<HourlyResult> {}

const drawHourlyConsumptionChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, clientHeight } = vnode.attrs;
  const clientWidth = Math.min(Math.max(400, vnode.dom.clientWidth), 800);
  const yearAgo =
    aggregatedData[aggregatedData.length - 1].timestamp -
    1000 * 60 * 60 * 24 * 30;
  const data = aggregatedData
    .filter((d) => d.timestamp > yearAgo)
    .map((d) => ({
      ...d,
      date: new Date(d.timestamp),
    }));

  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;
  const chart = selectChart(
    vnode,
    "consumption-hourly",
    clientWidth,
    clientHeight,
  );

  const tooltip = selectTooltip<Attrs, { timestamp: number }>(
    vnode,
    "consumption-hourly",
    (d) => formatDate(d.timestamp),
  );

  // 'Hour' axis (x)
  const { scale: xScale } = drawAxis(
    chart,
    "bottom",
    data.map((d) => d.date.getHours()),
    "Hour",
    width,
    height,
    COLOR.time,
    "hour-hourly",
    "d",
  );

  // 'Consumption' axis (y)
  const { scale: yScale } = drawAxis(
    chart,
    "left",
    data.map((d) => d.consumption),
    "Consumption (kWh)",
    width,
    height,
    COLOR.consumption,
    "consumption-hourly",
  );

  drawPoints(
    chart,
    data,
    "hourly-consumption",
    (d) => xScale(d.date.getHours()),
    (d) => yScale(d.consumption),
    COLOR.consumption,
    tooltip,
  );
};

const HourlyConsumption: m.ClosureComponent<Attrs> = () => {
  let observer: ResizeObserver;

  return {
    oncreate: (vnode) => {
      drawHourlyConsumptionChart(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawHourlyConsumptionChart(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "Each point represents the hourly energy consumption on a single ",
          "day. Points summarize the 30 days preceeding the last observation. ",
          "Mouse over individual points for the corresponding date.",
        ),
      );
    },
  };
};

const HourlyUsePlot: m.Component = {
  view: () => [
    m(
      "div.card-panel",
      m("p", m("stong", "Hourly consumption")),
      AppState.hourlyData.length > 0 &&
        m(HourlyConsumption, {
          aggregatedData: AppState.hourlyData,
          clientHeight: 400,
        }),
    ),
  ],
};

export default HourlyUsePlot;
