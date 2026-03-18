import m from "mithril";
import Climate, { StationRecord, MonthlyRecord } from "../models/Climate";
import { StationMap } from "./StationMap";
import Stations from "../models/Stations";
import { DataTable } from "mithril-materialized";
import { formatDate } from "../utils/date";
import { Status } from "../models/types";
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

interface LabelValueViewAttrs {
  label: string;
  value: string | number | null;
}

const labelValueView: m.Component<LabelValueViewAttrs> = {
  view: ({ attrs }) => {
    const { label, value } = attrs;
    return [m("strong", `${label}: `), value, m("br")];
  },
};

const StationView: m.Component = {
  view: () => {
    const { climateId, stationInformation } = Climate;
    if (stationInformation === null) return;

    return m("div.card-panel", [
      m("p", [
        m(labelValueView, { label: "Id", value: climateId }),
        m(labelValueView, { label: "Name", value: stationInformation.name }),
        m(labelValueView, {
          label: "Longitude",
          value: stationInformation.longitude.toFixed(2),
        }),
        m(labelValueView, {
          label: "Latitude",
          value: stationInformation.latitude.toFixed(2),
        }),

        m(labelValueView, {
          label: "Elevation",
          value: `${stationInformation.elevation} m`,
        }),
      ]),
    ]);
  },
};

const StationDataView: m.Component = {
  view: () => {
    const { stationData } = Climate;
    const nMissing = stationData.filter((day) => day.meantemp === null).length;
    if (nMissing === stationData.length) {
      return m(
        "div.card-panel.red.lighten-4",
        "Error: No valid climate data available.",
      );
    }
    const startDate = formatDate(stationData[0].timestamp);
    const endDate = formatDate(stationData[stationData.length - 1].timestamp);
    return m("div.card-panel", [
      m("p", [
        m(labelValueView, {
          label: "Date range",
          value: `${startDate} to ${endDate}`,
        }),
        m(labelValueView, {
          label: "Number of observations",
          value: stationData.length,
        }),
        m(labelValueView, {
          label: "Missing mean temperature observations",
          value: nMissing,
        }),
      ]),
      m("div", [
        m(labelValueView, {
          label: "Data (scroll for more)",
          value: "",
        }),
      ]),
      m(".table-scroll-container", [
        m(DataTable<StationRecord>, {
          className: "highlight",
          data: stationData,
          columns: [
            {
              key: "date",
              title: "Date",
              render: (row) => formatDate(row.timestamp),
            },
            { key: "meantemp", title: "Mean Temp (°C)", field: "meantemp" },
            {
              key: "heatDegDays",
              title: "Heating Degree Days",
              field: "heatDegDays",
            },
            {
              key: "coolDegDays",
              title: "Cooling Degree Days",
              field: "coolDegDays",
            },
            {
              key: "totalPrecipitation",
              title: "Total Precipitation (mm)",
              field: "totalPrecipitation",
            },
          ],
          striped: false,
        }),
      ]),
    ]);
  },
};

const drawWeeklyClimate = (vnode: m.VnodeDOM<WeeklyClimateAttrs>) => {
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

  const values = data.map((d) => d.totalPrecipitation!);
  values.push(0);
  const { scale: precipitationScale } = drawAxisFromValues(
    chart,
    "right2",
    values,
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

const WeeklyClimatePlot: m.ClosureComponent<WeeklyClimateAttrs> = () => {
  let observer: ResizeObserver;
  return {
    oncreate: (vnode) => {
      drawWeeklyClimate(vnode);
      observer = new ResizeObserver(() => m.redraw());
      observer.observe(vnode.dom);
    },
    onupdate: (vnode) => drawWeeklyClimate(vnode),
    onremove: () => observer.disconnect(),
    view: () => {
      return m(
        "div.chart-container",
        m(
          "p",
          "The chart below shows monthly heat degree days, temperature, and ",
          `precipitation since 2022 at ${Climate.stationInformation!.name}.`,
        ),
      );
    },
  };
};

const ClimateView = () => {
  return {
    view: () => {
      const renderClimateReadyStatus = () => {
        switch (Climate.status) {
          case Status.LOADING:
            return m("p.grey-text", "Fetching climate data...");

          case Status.ERROR:
            return m(".error-box", [
              m("p.red-text", "Error loading climate station data."),
            ]);

          case Status.READY:
            return [
              m(StationView),
              m(StationDataView),
              m(WeeklyClimatePlot, {
                aggregatedData: Climate.monthlyData,
                clientHeight: 400,
              }),
            ];

          case Status.IDLE:
          default:
            return m("p.grey-text", "Select a climate station...");
        }
      };

      return [
        m("h2", "Climate"),
        m(
          "p",
          "Find a nearby climate station. The 'best' station may not be the nearest, e.g., King City North is further from us than is the Toronto airport, but the elevation is more comparable. Select the station on the map, then press the 'SUBMIT' button to retrieve the data for that station.",
        ),
        m("p", [
          "Weather stations are from the Government of Canada Environment and Natural Resources. See the government interface to ",
          m(
            "a",
            {
              href: "https://climate.weather.gc.ca/historical_data/search_historic_data_e.html",
            },
            "all climate stations",
          ),
          " with historical data. Data are retieved using the ",
          m(
            "a",
            { href: "https://api.weather.gc.ca/" },
            "MSC GeoMet - GeoMet - OGC - API",
          ),
          " service.",
        ]),
        Stations.status !== Status.READY &&
          m("p", "Loading climate station map..."),
        m(StationMap, {
          onSelect: (climateId) => {
            Climate.load(climateId);
            m.redraw();
          },
        }),

        renderClimateReadyStatus(),
      ];
    },
  };
};

export default ClimateView;
