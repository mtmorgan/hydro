import m from "mithril";
import Climate from "../models/Climate";
import Customer from "../models/Customer";
import EnergyUse from "../models/EnergyUse";

const InsightView: m.Component = {
	view: () => [
		m("div.card-panel", [
			Customer.ready &&
				m("p", [m("strong", "Customer File Name"), ": ", Customer.fileName]),
			EnergyUse.ready &&
				m("p", [
					m("strong", "Energy Use File Name"),
					`: ${EnergyUse.fileName} (${EnergyUse.energyUse?.length} months)`,
				]),
			Climate.ready && [
				m("strong", "Climate Station"),
				": ",
				Climate.stationInformation.name,
			],
		]),
	],
};

export default InsightView;
