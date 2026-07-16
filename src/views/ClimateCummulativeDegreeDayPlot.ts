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
  drawAxisFromValues,
  drawPoints,
} from "../utils/draw";
import { dayOfYear } from "../utils/date";

interface CumulativeRecord extends StationRecord {
  dayOfYear: number;
  cumulativeHeatDegDays: number;
  cumulativeCoolDegDays: number;
}

interface StationRecordAttrs extends VnodeDOMAttrs<StationRecord> {}

const summarizeDegreeDayData = (data: StationRecord[]): CumulativeRecord[] => {
  // Sort and group by year
  const sorted = d3.sort(data, (d) => d.timestamp);
  const groupedByYear = d3.groups(sorted, (d) =>
    new Date(d.timestamp).getFullYear(),
  );

  // Compute running sum per year
  const resultMap = new Map<number, CumulativeRecord[]>();
  for (const [year, records] of groupedByYear) {
    // d3.cumsum returns an optimized Float64Array of running totals
    const runningHeatDegDays = d3.cumsum(records, (d) => d.heatDegDays ?? 0);
    const runningCoolDegDays = d3.cumsum(records, (d) => d.coolDegDays ?? 0);
    const cumulativeRecords = records.map((record, index) => ({
      ...record,
      dayOfYear: dayOfYear(record.timestamp),
      cumulativeHeatDegDays: runningHeatDegDays[index],
      cumulativeCoolDegDays: runningCoolDegDays[index],
    }));

    resultMap.set(year, cumulativeRecords);
  }

  return [...resultMap.values()].flatMap((records) => records);
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

  const { scale: xScale } = drawAxisFromValues(
    chart,
    "bottom",
    data.map((d) => d.dayOfYear!),
    "Day of Year",
    width,
    height,
    COLOR.time,
    "month-hdd",
  );

  const { scale: coolScale } = drawAxisFromValues(
    chart,
    "left",
    data.map((d) => d.cumulativeCoolDegDays!),
    "Cooling Degree Days",
    width,
    height,
    COLOR.coolDegreeDay,
    "month-cdd",
  );

  const { scale: heatScale } = drawAxisFromValues(
    chart,
    "right",
    data.map((d) => d.cumulativeHeatDegDays!),
    "Heating Degree Days",
    width,
    height,
    COLOR.heatDegreeDay,
    "month-hdd",
  );

  drawPoints(
    chart,
    data,
    "heat-degree-days",
    (d) => xScale(d.dayOfYear),
    (d) => heatScale(d.cumulativeHeatDegDays),
    COLOR.heatDegreeDay,
  );

  drawPoints(
    chart,
    data,
    "cool-degree-days",
    (d) => xScale(d.dayOfYear),
    (d) => coolScale(d.cumulativeCoolDegDays),
    COLOR.coolDegreeDay,
  );
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
          "The chart below shows cummulative heating and cooling degree days ",
          `since 2020 at ${Climate.stationInformation!.name}.`,
        ),
      );
    },
  };
};

export default ClimateCummulativeDegreeDayPlot;
