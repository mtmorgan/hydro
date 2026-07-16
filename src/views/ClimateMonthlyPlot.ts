import m from "mithril";
import Climate, { MonthlyRecord } from "../models/Climate";
import * as d3 from "d3";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  drawDateAxis,
  drawAxisFromValues,
  drawBars,
  drawScatterplotLine,
} from "../utils/draw";

interface WeeklyClimateAttrs extends VnodeDOMAttrs<MonthlyRecord> {}

const drawClimateMonthlyPlot = (vnode: m.VnodeDOM<WeeklyClimateAttrs>) => {
  const { aggregatedData: data, clientHeight } = vnode.attrs;
  const clientWidth = Math.min(Math.max(400, vnode.dom.clientWidth), 800);
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;

  const chart = selectChart(vnode, "month-climate", clientWidth, clientHeight);

  const { scale: xScale } = drawDateAxis(
    chart,
    "bottom",
    data.map((d) => d.date),
    "Month",
    width,
    height,
    COLOR.time,
    31,
    "month-date",
    "%B",
  );

  const { scale: yScale } = drawAxisFromValues(
    chart,
    "left",
    data.map((d) => d.heatDegDays!),
    "Heating Degree Days",
    width,
    height,
    COLOR.degreeDay,
    "month-hdd",
  );

  const { scale: meantempScale } = drawAxisFromValues(
    chart,
    "right",
    data.map((d) => d.meantemp!),
    "Mean Temperature (°C)",
    width,
    height,
    COLOR.temperature,
    "month-meantemp",
  );

  const { scale: precipitationScale } = drawAxisFromValues(
    chart,
    "right2",
    [0, d3.max(data, (d) => d.totalPrecipitation)!],
    "Mean Daily Precipitation (mm)",
    width,
    height,
    COLOR.precipitation,
    "month-precipitation",
  );

  drawBars(
    chart,
    data,
    "monthly-hdd",
    (d) => xScale(d.date),
    (d) => xScale(d3.timeMonth.offset(d.date, 1)),
    (d) => yScale(d.heatDegDays!),
    height,
    COLOR.degreeDay,
  );

  drawScatterplotLine(
    chart,
    data,
    "monthly-meantemp",
    (d) => {
      const start = xScale(d.date);
      const end = xScale(d3.timeMonth.offset(d.date, 1));
      return start + (end - start) / 2;
    },
    (d) => meantempScale(d.meantemp!),
    COLOR.temperature,
    COLOR.temperature,
  );

  drawScatterplotLine(
    chart,
    data,
    "month-precipitation",
    (d) => {
      const start = xScale(d.date);
      const end = xScale(d3.timeMonth.offset(d.date, 1));
      return start + (end - start) / 2;
    },
    (d) => precipitationScale(d.totalPrecipitation!),
    COLOR.precipitation,
    COLOR.precipitation,
  );
};

const ClimateMonthlyPlot: m.ClosureComponent<WeeklyClimateAttrs> = () => {
  let observer: ResizeObserver;
  return {
    oncreate: (vnode) => {
      drawClimateMonthlyPlot(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawClimateMonthlyPlot(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "The chart below shows monthly heat degree days, temperature, and ",
          `precipitation since 2020 at ${Climate.stationInformation!.name}.`,
        ),
      );
    },
  };
};

export default ClimateMonthlyPlot;
