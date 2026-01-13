import m from "mithril";
import "mithril-materialized/index.css";
import "./index.css";

import HydroView from "./views/HydroView";
import ClimateView from "./views/ClimateView";
import WizardView from "./views/WizardView";

const mountNode = document.querySelector("#app");
if (mountNode) {
	m.route(mountNode, "/wizard", {
		"/wizard": WizardView,
		"/hydro": HydroView,
		"/climate": ClimateView
	});
}
