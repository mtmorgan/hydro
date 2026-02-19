import m from "mithril";
import "mithril-materialized/index.css";
import "material-symbols";
import "./index.css";

import EnergyView from "./views/EnergyView";
import ClimateView from "./views/ClimateView";
import WizardView from "./views/WizardView";

const mountNode = document.querySelector("#app");
if (mountNode) {
  m.route(mountNode, "/wizard", {
    "/wizard": WizardView,
    "/hydro": EnergyView,
    "/climate": ClimateView,
  });
}
