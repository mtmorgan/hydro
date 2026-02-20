import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import EnergyUse, {
  UsageSummaryRecord,
  IntervalBlockRecord,
} from "../models/EnergyUse";
import FileListItem from "./FileListItem";
import { formatDate } from "../utils/date";

const UsageSummaryDisplay: m.Component<{
  summaryData: UsageSummaryRecord[];
}> = {
  view: ({ attrs }) => {
    const { summaryData } = attrs;

    const columns: DataTableColumn<UsageSummaryRecord>[] = [
      {
        key: "start",
        title: "Start Date",
        render: (row: UsageSummaryRecord) => formatDate(row.timestamp),
      },
      { key: "days", title: "Days", field: "days" },
      { key: "cost", title: "Cost ($)", field: "cost" },
      { key: "consumption", title: "Consumption (kWh)", field: "consumption" },
      { key: "reading", title: "Meter Read Type", field: "reading" },
    ];

    return m("div.card-panel", [
      m("div", [
        m("strong", "Energy Use: "),
        `${EnergyUse.usageSummary.length} months`,
      ]),
      // Indented file names: one per line
      EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      m("p", "Scroll for more"),
      m(".table-scroll-container", [
        m(DataTable<UsageSummaryRecord>, {
          data: summaryData,
          columns: columns,
          striped: false,
        }),
      ]),
    ]);
  },
};

const IntervalSummaryDisplay: m.Component<{
  summaryData: IntervalBlockRecord[];
}> = {
  view: ({ attrs }) => {
    const { summaryData } = attrs;

    const columns: DataTableColumn<IntervalBlockRecord>[] = [
      {
        key: "start",
        title: "Start Date",
        render: (row) => formatDate(row.timestamp),
      },
      { key: "days", title: "Days", field: "intervalCount" },
      {
        key: "consumption",
        title: "Consumption (kWh)",
        render: (row) => row.consumption.toPrecision(3),
      },
    ];

    return m("div.card-panel", [
      m("div", [
        m("strong", "Energy Use: "),
        `${EnergyUse.intervalSummary.length} days`,
      ]),
      // Indented file names: one per line
      EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      m("p", "Scroll for more"),
      m(".table-scroll-container", [
        m(DataTable<IntervalBlockRecord>, {
          data: summaryData,
          columns: columns,
          striped: false,
        }),
      ]),
    ]);
  },
};

const EnergyUseView: m.Component = {
  view: () => [
    EnergyUse.fileName.length > 0
      ? [
          m(UsageSummaryDisplay, { summaryData: EnergyUse.usageSummary }),
          m(IntervalSummaryDisplay, {
            summaryData: EnergyUse.intervalSummary,
          }),
        ]
      : m(
          "p.grey-text",
          "Choose energy use (",
          m("code", "Hydro1_Electric_60_Minute_*.xml"),
          ") files.",
        ),
  ],
};

export default EnergyUseView;
