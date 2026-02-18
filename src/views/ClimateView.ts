import m from "mithril";
import Climate, { StationRecord } from "../models/Climate";
import { StationMap } from "./StationMap";
import { DataTable } from "mithril-materialized";
import { formatDate } from "../utils/date";
import { Status } from "../models/types";

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
            return [m(StationView), m(StationDataView)];

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
