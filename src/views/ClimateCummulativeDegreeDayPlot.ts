import m from "mithril";
import Climate, { StationRecord } from "../models/Climate";
// import { formatDate } from "../utils/date";
// import { Status } from "../models/types";
import * as d3 from "d3";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  drawDateAxis,
  drawAxisFromValues,
  drawScatterplotLine,
  selectTooltip,
} from "../utils/draw";
import { timestampMonth } from "../utils/date";

interface CumulativeRecord {
  year: number;
  values: {
    date: Date;
    cumulativeHeatDegDays: number;
    cumulativeCoolDegDays: number;
  }[];
}

interface StationRecordAttrs extends VnodeDOMAttrs<StationRecord> {}

const summarizeDegreeDayData = (data: StationRecord[]): CumulativeRecord[] => {
  // Aggregate by year and month
  const monthlyData = d3.rollups(
    data,
    (v) => ({
      timestamp: d3.min(v, (d) => d.timestamp)!,
      heatDegDays: d3.sum(v, (d) => d.heatDegDays),
      coolDegDays: d3.sum(v, (d) => d.coolDegDays),
    }),
    (d) => new Date(d.timestamp).getFullYear(), // Group by Year
    (d) => new Date(d.timestamp).getMonth(), // Group by Month (0-11)
  );

  // Cumulative sum within year
  const cumulativeData = monthlyData.flatMap(([year, monthsList]) => {
    // Sort months chronologically (0 to 11) to guarantee accurate accumulation
    monthsList.sort((a, b) => a[0] - b[0]);
    const timestamp = monthsList.map(([_, totals]) => totals.timestamp);
    const hddValues = monthsList.map(([_, totals]) => totals.heatDegDays);
    const cddValues = monthsList.map(([_, totals]) => totals.coolDegDays);

    // Generate cumulative arrays
    const hddCumulative = d3.cumsum(hddValues);
    const cddCumulative = d3.cumsum(cddValues);

    return {
      year: year,
      values: monthsList.map((_, index) => ({
        date: timestampMonth(timestamp[index]),
        cumulativeHeatDegDays: hddCumulative[index],
        cumulativeCoolDegDays: cddCumulative[index],
      })),
    };
  });

  return cumulativeData;
};

const drawClimateCummulativeDegreeDayPlot = (
  data: CumulativeRecord[],
  vnode: m.VnodeDOM<StationRecordAttrs>,
) => {
  const { clientHeight } = vnode.attrs;
  const clientWidth = Math.min(Math.max(400, vnode.dom.clientWidth), 800);
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;

  const chart = selectChart(
    vnode,
    "cumulative-degree-day",
    clientWidth,
    clientHeight,
  );

  const monthExtent = d3.extent(
    data.flatMap((record) => record.values.map((v) => v.date)),
  ) as [Date, Date];

  const { scale: xScale } = drawDateAxis(
    chart,
    "bottom",
    monthExtent,
    "Month",
    width,
    height,
    COLOR.time,
    31,
    "month-date",
    "%B",
  );

  const { scale: coolScale } = drawAxisFromValues(
    chart,
    "left",
    [0, d3.max(data, (y) => d3.max(y.values, (d) => d.cumulativeCoolDegDays))!],
    "Cooling Degree Days",
    width,
    height,
    COLOR.coolDegreeDay,
    "cdd-scale",
  );

  const { scale: heatScale } = drawAxisFromValues(
    chart,
    "right",
    [0, d3.max(data, (y) => d3.max(y.values, (d) => d.cumulativeHeatDegDays))!],
    "Heating Degree Days",
    width,
    height,
    COLOR.heatDegreeDay,
    "hdd-scale",
  );

  data.forEach((yearly) => {
    const tooltip = selectTooltip<StationRecordAttrs, { date: Date }>(
      vnode,
      `degree-days-${yearly.year}`,
      (_) => String(yearly.year),
    );

    drawScatterplotLine(
      chart,
      yearly.values,
      `heat-degree-days-${yearly.year}`,
      (d) => {
        const start = xScale(d.date);
        const end = xScale(d3.timeMonth.offset(d.date, 1));
        return start + (end - start) / 2;
      },
      (d) => heatScale(d.cumulativeHeatDegDays),
      COLOR.heatDegreeDay,
      COLOR.heatDegreeDay,
      tooltip,
    );

    drawScatterplotLine(
      chart,
      yearly.values,
      `cool-degree-days-${yearly.year}`,
      (d) => {
        const start = xScale(d.date);
        const end = xScale(d3.timeMonth.offset(d.date, 1));
        return start + (end - start) / 2;
      },
      (d) => coolScale(d.cumulativeCoolDegDays),
      COLOR.coolDegreeDay,
      COLOR.coolDegreeDay,
      tooltip,
    );
  });
};

const ClimateCummulativeDegreeDayPlot: m.ClosureComponent<
  StationRecordAttrs
> = () => {
  let degreeDayData: CumulativeRecord[];
  let observer: ResizeObserver;
  return {
    oncreate: (vnode) => {
      degreeDayData = summarizeDegreeDayData(vnode.attrs.aggregatedData);
      drawClimateCummulativeDegreeDayPlot(degreeDayData, vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) =>
      drawClimateCummulativeDegreeDayPlot(degreeDayData, vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "What has the temperture been like over the last several years? ",
          "The chart below shows cummulative heating and cooling degree days ",
          `since 2020 at ${Climate.stationInformation?.name}.`,
        ),
      );
    },
  };
};

export default ClimateCummulativeDegreeDayPlot;
