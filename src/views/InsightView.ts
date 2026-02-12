import m from "mithril";
import { FileListItem } from "./FileListItem";
import { AggregatedDataTable } from "./AggregatedDataView";
import Climate from "../models/Climate";
import Customer from "../models/Customer";
import EnergyUse from "../models/EnergyUse";
import { Status } from "../models/types";
import AggregatedDataPlot from "./AggregatedDataPlot";

const InsightView: m.Component = {
  view: () => [
    m("div.card-panel", { style: "line-height: 1.5;" }, [
      Customer.ready && [
        m("div", [m("strong", "Customer: "), Customer.address?.name]),
        m(FileListItem, { name: Customer.fileName as string }),
      ],
      EnergyUse.ready && [
        m("div", [
          m("strong", "Energy Use: "),
          `${EnergyUse.energyUse.length} months`,
        ]),
        // Indented file names: one per line
        EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      ],
      Climate.status === Status.READY &&
        m("div", [
          m("strong", "Climate Station: "),
          Climate.stationInformation.name,
        ]),
    ]),
    m("div.card-panel", m(AggregatedDataTable)),
    m("div.card-panel", m(AggregatedDataPlot)),
  ],
};

export default InsightView;
