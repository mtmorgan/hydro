import m from "mithril";
import * as d3 from "d3";
import EnergyUse, { HourlyResult } from "../models/EnergyUse";
import IntervalDatePickerView from "./IntervalDatePickerView";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  selectTooltip,
  drawAxisFromValues,
  drawPoints,
  drawScatterplotLine,
} from "../utils/draw";
import { formatDate } from "../utils/date";

interface Attrs extends VnodeDOMAttrs<HourlyResult> {}

const drawHourlyConsumptionChart = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData, clientHeight } = vnode.attrs;
  const clientWidth = Math.min(Math.max(400, vnode.dom.clientWidth), 800);
  const data = aggregatedData.map((d) => ({
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
  const { scale: xScale } = drawAxisFromValues(
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
  const { scale: yScale } = drawAxisFromValues(
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
    COLOR.consumption + "3D", // 30% opacity
    tooltip,
  );

  const rolled = d3.rollup(
    data,
    (v) => d3.mean(v, (d) => d.consumption),
    (d) => d.date.getHours(),
  );
  const hourlyConsumptionAverage = Array.from(
    rolled,
    ([hour, consumption]) => ({
      hour: hour,
      consumption: consumption || 0,
    }),
  ).sort((a, b) => a.hour - b.hour);

  drawScatterplotLine(
    chart,
    hourlyConsumptionAverage,
    "hourly-consumption-average",
    (d) => xScale(d.hour),
    (d) => yScale(d.consumption),
    COLOR.time,
    COLOR.consumption,
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
          "Each blue point represents the hourly energy consumption on a ",
          "single day. Black points are the hourly average over all days. ",
          "Mouse over blue points for the corresponding date.",
        ),
        m(IntervalDatePickerView),
      );
    },
  };
};

const HourlyUsePlot: m.Component = {
  view: () => [
    m(
      "div.card-panel",
      m("p", m("stong", "Hourly consumption")),
      EnergyUse.hourlyData.length > 0 &&
        m(HourlyConsumption, {
          aggregatedData: EnergyUse.hourlyData,
          clientHeight: 400,
        }),
    ),
  ],
};

export default HourlyUsePlot;
