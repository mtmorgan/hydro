import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import * as d3 from "d3";
import {
  MARGIN,
  COLOR,
  VnodeDOMAttrs,
  selectChart,
  selectTooltip,
  drawAxis,
  drawStackedBarcode,
} from "../utils/draw";
import EnergyUse, { IntervalReadingRecord } from "../models/EnergyUse";
import { RunRecord } from "../services/aggregate";
import { formatDate } from "../utils/date";

const PowerOutageTable: m.Component<{ runs: RunRecord[] }> = {
  view: ({ attrs }) => {
    const { runs } = attrs;
    const totalDuration = runs.reduce((acc, d) => {
      return (acc += d.duration);
    }, 0);

    const columns: DataTableColumn<RunRecord>[] = [
      {
        key: "start",
        title: "Start date",
        render: (row) => formatDate(row.timestamp),
      },
      { key: "duration", title: "Duration (hours)", field: "duration" },
    ];

    return [
      m("div", [
        m("strong", "Outages (periods of zero consumption): "),
        `${runs.length}`,
      ]),
      m("div", [m("strong", " Total duration: "), `${totalDuration} hours`]),
      m(
        "p",
        "A power 'outage' is a period during which no power consumption ",
        "was reported. This could be because power supply was interuppted, or ",
        "because of a failure of the meter to report consumption during the ",
        "period.",
      ),

      m("p", "Scroll for more"),
      m(".table-scroll-container", [
        m(DataTable<RunRecord>, {
          data: runs,
          columns: columns,
          striped: false,
        }),
      ]),
    ];
  },
};

interface Attrs extends VnodeDOMAttrs<IntervalReadingRecord> {}

const stackedYearAxis = <T extends { timestamp: number }>(
  values: T[],
  height: number,
) => {
  const years = [
    ...new Set(values.map((d) => new Date(d.timestamp).getFullYear())),
  ].sort();
  const scale = d3
    .scalePoint<number>()
    .domain(years)
    .range([height, 0])
    .padding(0.5);
  const axis = d3.axisLeft(scale).tickFormat(d3.format("d"));
  return { scale, axis };
};

const drawPowerOutageBarcode = (vnode: m.VnodeDOM<Attrs>) => {
  const { aggregatedData: data, clientHeight } = vnode.attrs;

  const clientWidth = Math.max(400, vnode.dom.clientWidth);
  const width = clientWidth - MARGIN.right - MARGIN.left;
  const height = clientHeight - MARGIN.top - MARGIN.bottom;
  const chart = selectChart(
    vnode,
    "power-outage-barcode",
    clientWidth,
    clientHeight,
  );

  const tooltip = selectTooltip<Attrs, { timestamp: number; duration: number }>(
    vnode,
    "power-outage-barcode",
    (d) => {
      const hours = `${d.duration} hour${d.duration === 1 ? "" : "s"}`;
      return `${formatDate(d.timestamp)}, ${hours}`;
    },
  );

  // X-Axis: Always 1 to 366 (Day of Year)
  const monthTicks = [
    { day: 1, label: "January" },
    { day: 32 },
    { day: 60 },
    { day: 91, label: "April" },
    { day: 121 },
    { day: 152 },
    { day: 182, label: "July" },
    { day: 213 },
    { day: 244 },
    { day: 274, label: "October" },
    { day: 305 },
    { day: 335 },
  ];
  const xScale = d3.scaleLinear().domain([0, 366]).range([0, width]);
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(monthTicks.map((m) => m.day)) // Place ticks at month starts
    .tickFormat((d) => {
      const match = monthTicks.find((m) => m.day === d);
      return match && match.label ? match.label : "";
    });
  drawAxis(chart, "bottom", xAxis, "Month", width, height, COLOR.time, "month");

  const { scale: yScale, axis: yAxis } = stackedYearAxis(data, height);
  drawAxis(chart, "left", yAxis, "Year", width, height, COLOR.time, "year");

  // Merge run records on the same day and plot barcode
  const merged = Object.values(
    EnergyUse.zeroConsumption.reduce<Record<string, RunRecord>>((acc, curr) => {
      const key = formatDate(curr.timestamp);
      if (!acc[key]) {
        acc[key] = { ...curr }; // Shallow copy
      } else {
        acc[key].duration += curr.duration;
      }
      return acc;
    }, {}),
  );
  drawStackedBarcode(chart, merged, xScale, yScale, tooltip);
};

const PowerOutageBarcodePlot: m.ClosureComponent<Attrs> = () => {
  let observer: ResizeObserver;

  return {
    oncreate: (vnode) => {
      drawPowerOutageBarcode(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawPowerOutageBarcode(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "The barcode shows each day with a power outage as a vertical bar. ",
          "The width of the bar represents the duration of the outage. Mouse ",
          "over each bar for details.",
        ),
      );
    },
  };
};

const EnergyUsePowerOutagePlot: m.Component = {
  view: () => [
    EnergyUse.zeroConsumption.length > 0 &&
      m(PowerOutageTable, { runs: EnergyUse.zeroConsumption }),

    EnergyUse.intervalReadingRecords.length > 0 &&
      m(PowerOutageBarcodePlot, {
        aggregatedData: EnergyUse.intervalReadingRecords,
        clientHeight: 300,
      }),
  ],
};

export default EnergyUsePowerOutagePlot;
