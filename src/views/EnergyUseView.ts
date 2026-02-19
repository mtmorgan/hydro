import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import EnergyUse, { type EnergyUseRecord } from "../models/EnergyUse";
import FileListItem from "./FileListItem";
import { formatDate } from "../utils/date";

interface EnergyUseDisplayAttrs {
  energyUseData: EnergyUseRecord[];
}

const EnergyUseDisplay: m.Component<EnergyUseDisplayAttrs> = {
  view: ({ attrs }) => {
    const { energyUseData } = attrs;

    if (!energyUseData) {
      return m(
        "div.card-panel.red.lighten-4",
        "Error: Could not display energy use data.",
      );
    }

    const columns: DataTableColumn<EnergyUseRecord>[] = [
      {
        key: "start",
        title: "Start Date",
        render: (row: EnergyUseRecord) => formatDate(row.timestamp),
      },
      { key: "days", title: "Days", field: "days" },
      { key: "cost", title: "Cost ($)", field: "cost" },
      { key: "consumption", title: "Consumption (kWh)", field: "consumption" },
      { key: "reading", title: "Meter Read Type", field: "reading" },
    ];

    return m("div.card-panel", [
      m("div", [
        m("strong", "Energy Use: "),
        `${EnergyUse.energyUse.length} months`,
      ]),
      // Indented file names: one per line
      EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      m("p", "Scroll for more"),
      m(".table-scroll-container", [
        m(DataTable<EnergyUseRecord>, {
          data: energyUseData,
          columns: columns,
          striped: false,
        }),
      ]),
    ]);
  },
};

const EnergyUseView: m.Component = {
  view: () => [
    EnergyUse.energyUse.length > 0
      ? m(EnergyUseDisplay, { energyUseData: EnergyUse.energyUse })
      : m("p.grey-text", "No energy use data loaded."),
  ],
};

export default EnergyUseView;
