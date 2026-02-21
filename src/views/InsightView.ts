import m from "mithril";
import AggregatedDataPlot from "./AggregatedDataPlot";
import DailyUsePlot from "./DailyUsePlot";
import AggregatedDataTable from "./AggregatedDataView";
import Climate from "../models/Climate";
import Customer from "../models/Customer";
import EnergyUse from "../models/EnergyUse";
import FileListItem from "./FileListItem";
import { Status } from "../models/types";

const InsightView: m.Component = {
  view: () => [
    m("div.card-panel", { style: "line-height: 1.5;" }, [
      Customer.status === Status.READY && [
        m("div", [m("strong", "Customer: "), Customer.address?.name]),
        m(FileListItem, { name: Customer.fileName as string }),
      ],
      EnergyUse.status === Status.READY && [
        m("div", [
          m("strong", "Energy Use: "),
          `${EnergyUse.usageSummary.length} months`,
        ]),
        // Indented file names: one per line
        EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      ],
      Climate.stationInformation &&
        m("div", [
          m("strong", "Climate Station: "),
          Climate.stationInformation.name,
        ]),
    ]),
    m("div.card-panel", m(AggregatedDataTable)),
    m(AggregatedDataPlot),
    m(DailyUsePlot),
  ],
};

export default InsightView;
