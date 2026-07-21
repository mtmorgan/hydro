import m from "mithril";
import {
  CellRendererAttrs,
  DataTable,
  DataTableColumn,
} from "mithril-materialized";
import AppState, { UsageSummaryResult } from "../models/AppState";
import {
  DollarCellRenderer,
  FixedPointCellRenderer,
  TimestampAsDateRenderer,
} from "../utils/table";

const ConsumptionPerHeatDegDayRenderer = (
  digits: number,
): m.FactoryComponent<CellRendererAttrs> => {
  const FixedPointCell = FixedPointCellRenderer(digits);
  return () => {
    return {
      view: ({ attrs }) => {
        const row = attrs.value;
        if (
          !row ||
          !row.consumption ||
          !row.heatDegDays ||
          isNaN(row.consumption)
        ) {
          return m("span", "N/A");
        }
        const result = row.consumption / row.heatDegDays;
        return m(FixedPointCell, { ...attrs, value: result });
      },
    };
  };
};

const CostPerHeatDegDayRenderer = (): m.FactoryComponent<CellRendererAttrs> => {
  const DollarCell = DollarCellRenderer();
  return () => {
    return {
      view: ({ attrs }) => {
        const row = attrs.value; // Use 'data' or 'value' depending on your grid framework
        if (!row || !row.heatDegDays || isNaN(row.cost))
          return m("span", "N/A");
        const result = row.cost / row.heatDegDays;
        return m(DollarCell, { ...attrs, value: result });
      },
    };
  };
};

const CLIMATE_TABLE_COLUMNS = [
  {
    key: "start",
    title: "Start Date",
    field: "timestamp",
    cellRenderer: TimestampAsDateRenderer(),
    align: "left",
  },
  { key: "days", title: "Days", field: "days" },
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
    cellRenderer: ConsumptionPerHeatDegDayRenderer(2),
  },
  {
    key: "costPerHDD",
    title: "$ / HDD",
    cellRenderer: CostPerHeatDegDayRenderer(),
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
