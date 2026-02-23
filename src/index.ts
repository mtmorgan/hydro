import m from "mithril";
import "mithril-materialized/index.css";
import "material-symbols";
import "./index.css";

import WizardView from "./views/WizardView";
import ImplimentationView from "./views/ImplementationView";

const mountNode = document.querySelector("#app");
if (mountNode) {
  m.route(mountNode, "/wizard", {
    "/wizard": WizardView,
    "/implementation": ImplimentationView,
  });
}
