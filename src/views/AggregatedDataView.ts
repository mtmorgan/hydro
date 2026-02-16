import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import AppState, { type AggregatedResult } from "../models/AppState";

const CLIMATE_TABLE_COLUMNS = [
  {
    key: "start",
    title: "Start Date",
    field: "start",
    align: "left",
  },
  { key: "days", title: "Days", field: "days" },
  {
    key: "meantemp",
    title: "Mean Temp (°C)",
    render: (row: AggregatedResult) => row.meantemp.toFixed(1),
  },
  {
    key: "heatdegdays",
    title: "Heating Degree Days (HDD)",
    render: (row: AggregatedResult) => row.heatdegdays.toFixed(0),
  },
  {
    key: "consumption",
    title: "Consumption (kWh)",
    field: "consumption",
  },
  {
    key: "cost",
    title: "Cost ($)",
    render: (row: AggregatedResult) => row.cost.toFixed(2),
  },
  {
    key: "consumptionPerHDD",
    title: "kWh / HDD",
    render: (row: AggregatedResult) =>
      (row.consumption / row.heatdegdays).toFixed(2),
  },
  {
    key: "costPerHDD",
    title: "$ / HDD",
    render: (row: AggregatedResult) => (row.cost / row.heatdegdays).toFixed(2),
  },
].map((col) => ({
  // default alignment
  align: "right",
  ...col,
})) as DataTableColumn<AggregatedResult>[];

export const AggregatedDataTable = {
  view: () => [
    m(
      "p",
      m("strong", [
        "Climate and energy use",
        AppState.aggregatedStationData.length > 0 &&
          ` for ${AppState.aggregatedStationData.length} months (scroll for more)`,
      ]),
    ),
    m(".table-scroll-container", [
      m(DataTable<AggregatedResult>, {
        className: "highlight",
        columns: CLIMATE_TABLE_COLUMNS,
        data: AppState.aggregatedStationData,
        sortBy: "startFormatted",
        i18n: { noDataAvailable: "Select hydro and climate data." },
      }),
    ]),
  ],
};
