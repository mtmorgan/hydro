import m from "mithril";
import { FileInput } from "mithril-materialized";
import Energy from "../models/Energy";
import CustomerView from "./CustomerView";
import EnergyUseView from "./EnergyUseView";
import { inputFileKey } from "../services/xmlInput";

const HydroView: m.Component = {
  view: () => [
    m("p", [
      "Hydro One (Ontario Hydro) provides energy use data for the previous ",
      "two years. Download the data by logging in and visiting ",
      m(
        "a",
        {
          href: "https://www.hydroone.com/myaccount/green-button-download-my-data",
        },
        "Green Button Download My Data",
      ),
      ". Use the button below to input the downloaded data.",
    ]),
    m("p", [
      "Choose more than one ",
      m("code", "Hydro1_Electric_60_Minute_*"),
      " file with overlapping billing cycles to span more than the two years ",
      "of historical data.",
    ]),
    m("div", [
      m(FileInput, {
        id: "energy-use-input",
        key: inputFileKey,
        placeholder: Energy.fileNames.join(", ") || "Hydro1_*.xml",
        multiple: true,
        accept: ["application/xml"],
        onchange: Energy.loadXml,
        resetOnChange: true,
      }),
    ]),

    m(CustomerView),
    m(EnergyUseView),
  ],
};

export default HydroView;
