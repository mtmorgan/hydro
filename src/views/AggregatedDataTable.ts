import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import AppState, { UsageSummaryResult } from "../models/AppState";
import {
  DollarCellRenderer,
  FixedPointCellRenderer,
  TimestampAsDateRenderer,
} from "../utils/table";

const CLIMATE_TABLE_COLUMNS = [
  {
    key: "start",
    title: "Start Date",
    field: "timestamp",
    cellRenderer: TimestampAsDateRenderer(),
    align: "left",
  },
  { key: "days", title: "Days", field: "days", sortable: false },
  {
    key: "meantemp",
    title: "Mean Temp (°C)",
    field: "meantemp",
    cellRenderer: FixedPointCellRenderer(1),
  },
  {
    key: "heatdegdays",
    title: "Heating Degree Days (HDD)",
    field: "heatDegDays",
    cellRenderer: FixedPointCellRenderer(0),
  },
  {
    key: "consumption",
    title: "Consumption (kWh)",
    field: "consumption",
  },
  {
    key: "cost",
    title: "Cost ($)",
    field: "cost",
    cellRenderer: DollarCellRenderer(),
  },
  {
    key: "consumptionPerHDD",
    title: "kWh / HDD",
    field: "consumptionPerHeatDegDay",
    cellRenderer: FixedPointCellRenderer(2),
  },
  {
    key: "costPerHDD",
    title: "$ / HDD",
    field: "costPerHeatDegDay",
    cellRenderer: DollarCellRenderer(),
  },
].map((col) => ({
  // default alignment
  align: "right",
  sortable: true,
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
