import m from "mithril";
import AggregatedDataPlots from "./AggregatedDataPlots";
import DailyUsePlot from "./DailyUsePlot";
import AggregatedDataTable from "./AggregatedDataTable";
import Climate from "../models/Climate";
import Customer from "../models/Customer";
import EnergyUse from "../models/EnergyUse";
import FileListItem from "./FileListItem";
import { Status } from "../models/types";

const InsightView: m.Component = {
  view: () => [
    (Customer.status !== Status.READY ||
      EnergyUse.status !== Status.READY ||
      Climate.status !== Status.READY) &&
      m(
        "div.card-panel",
        m(
          "p.grey-text",
          "Select hydro customer and energy use files, and a climate station.",
        ),
      ),
    m("div.card-panel", [
      m("strong", "Hydro and climate station input"),

      Customer.status === Status.READY && [
        m("div", `Customer: ${Customer.address?.name}`),
        m(FileListItem, { name: Customer.fileName as string }),
      ],
      EnergyUse.status === Status.READY && [
        m(
          "div",
          `Energy Use: ${EnergyUse.usageSummary.length} billing periods`,
        ),
        // Indented file names: one per line
        EnergyUse.fileName.map((name) => m(FileListItem, { name: name })),
      ],
      Climate.status === Status.READY &&
        m("div", `Climate Station: ${Climate.stationInformation?.name}`),
    ]),
    m("div.card-panel", m(AggregatedDataTable)),
    m("div.card-panel", m(AggregatedDataPlots)),
    m("div.card-panel", m(DailyUsePlot)),
  ],
};

export default InsightView;
