import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import EnergyUse, {
  UsageSummaryRecord,
  IntervalBlockRecord,
  IntervalReadingRecord,
} from "../models/EnergyUse";
import IntervalDatePickerView from "./IntervalDatePickerView";
import FileListItem from "./FileListItem";
import { formatDate, formatHour } from "../utils/date";
import EnergyUsePowerOutagePlot from "./EnergyUsePowerOutagePlot";
import EnergyUseHourlyPlot from "./EnergyUseHourlyPlot";

const EnergyUseFiles: m.Component = {
  view: () => {
    return m("div.card-panel", [
      m("div", m("strong", "Energy Use")),
      EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
    ]);
  },
};

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
        m("strong", "Monthly: "),
        `${EnergyUse.usageSummary.length} months`,
      ]),
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
      { key: "hours", title: "Hours", field: "intervalCount" },
      {
        key: "consumption",
        title: "Consumption (kWh)",
        render: (row) => row.consumption.toPrecision(3),
      },
    ];

    return m("div.card-panel", [
      m("div", [
        m("strong", "Daily: "),
        `${EnergyUse.intervalSummary.length} days`,
      ]),
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

const IntervalReadingDisplay: m.Component<{
  intervals: IntervalReadingRecord[];
}> = {
  view: ({ attrs }) => {
    const { intervals } = attrs;

    if (EnergyUse.intervalReadingRecords.length === 0) return;

    const columns: DataTableColumn<IntervalReadingRecord>[] = [
      {
        key: "start",
        title: "Date",
        render: (row) => formatDate(row.timestamp),
      },
      {
        key: "time",
        title: "Hour",
        render: (row) => formatHour(row.timestamp),
      },
      {
        key: "consumption",
        title: "Consumption (kWh)",
        render: (row) => row.consumption.toPrecision(3),
      },
    ];

    return m("div.card-panel", [
      m("div", [
        m("strong", "Hourly: "),
        `${EnergyUse.intervalReadingRecords.length} intervals`,
      ]),
      m(IntervalDatePickerView),
      m(".table-scroll-container", [
        m(DataTable<IntervalReadingRecord>, {
          data: intervals,
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
          // Indented file names: one per line
          m(EnergyUseFiles),
          m(UsageSummaryDisplay, { summaryData: EnergyUse.usageSummary }),
          m(IntervalSummaryDisplay, {
            summaryData: EnergyUse.intervalSummary,
          }),
          EnergyUse.intervalReadingRecords.length === 0 &&
            m("p.grey-text", "No hourly intervals available"),

          m(IntervalReadingDisplay, {
            intervals: EnergyUse.intervalReading,
          }),

          m("div.card-panel", m(EnergyUsePowerOutagePlot)),
          m(EnergyUseHourlyPlot),
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
