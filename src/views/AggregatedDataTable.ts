import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import AppState, { UsageSummaryResult } from "../models/AppState";
import { formatDate } from "../utils/date";

const CLIMATE_TABLE_COLUMNS = [
  {
    key: "start",
    title: "Start Date",
    render: (row: UsageSummaryResult) => formatDate(row.timestamp),
    align: "left",
  },
  { key: "days", title: "Days", field: "days" },
  {
    key: "meantemp",
    title: "Mean Temp (°C)",
    render: (row: UsageSummaryResult) => row.meantemp.toFixed(1),
  },
  {
    key: "heatdegdays",
    title: "Heating Degree Days (HDD)",
    render: (row: UsageSummaryResult) => row.heatDegDays.toFixed(0),
  },
  {
    key: "consumption",
    title: "Consumption (kWh)",
    field: "consumption",
  },
  {
    key: "cost",
    title: "Cost ($)",
    render: (row: UsageSummaryResult) => row.cost.toFixed(2),
  },
  {
    key: "consumptionPerHDD",
    title: "kWh / HDD",
    render: (row: UsageSummaryResult) =>
      (row.consumption / row.heatDegDays).toFixed(2),
  },
  {
    key: "costPerHDD",
    title: "$ / HDD",
    render: (row: UsageSummaryResult) =>
      (row.cost / row.heatDegDays).toFixed(2),
  },
].map((col) => ({
  // default alignment
  align: "right",
  ...col,
})) as DataTableColumn<UsageSummaryResult>[];

const AggregatedDataTable = {
  view: () => [
    m("strong", "Climate and energy use"),
    AppState.stationData.length > 0 && [
      m(
        "p",
        `${AppState.stationData.length} billing periods (scroll for more)`,
      ),
      m(".table-scroll-container", [
        m(DataTable<UsageSummaryResult>, {
          className: "highlight",
          columns: CLIMATE_TABLE_COLUMNS,
          data: AppState.stationData,
          sortBy: "startFormatted",
        }),
      ]),
    ],
  ],
};

export default AggregatedDataTable;
