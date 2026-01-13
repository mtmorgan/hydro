import m from "mithril";
import CustomerView from "./CustomerView";
import EnergyUseView from "./EnergyUseView";

const HydroView: m.Component = {
	view: () => [
		m("p", [
			"Hydro One (Ontario Hydro) provides energy use data for the previous two years. Download the data by logging in and visiting ",
			m(
				"a",
				{
					href: "https://www.hydroone.com/myaccount/green-button-download-my-data",
				},
				"Green Button Download My Data"
			),
			". Use the buttons below to input the downloaded data; choose more than one file to span more than the two years of historical data provided by Hydro One.",
		]),
		m(CustomerView),
		m(EnergyUseView),
	],
};

export default HydroView;
