import { Wizard, WizardStep } from "mithril-materialized";
import m from "mithril";
import IntroductionView from "./IntroductionView";
import EnergyView from "./EnergyView";
import ClimateView from "./ClimateView";
import InsightView from "./InsightView";
import ImplimentationView from "./ImplementationView";

const steps: WizardStep[] = [
  { title: "Introduction", vnode: () => m(IntroductionView) },
  { title: "Hydro", vnode: () => m(EnergyView) },
  { title: "Climate", vnode: () => m(ClimateView) },
  { title: "Insights", vnode: () => m(InsightView) },
];

const WizardView: m.Component = {
  view: () =>
    m(".container", [
      m(Wizard, {
        steps: steps,
        showStepNumbers: false,
        allowHeaderNavigation: true,
        labels: { complete: "Implementation Notes" },
        onComplete: () => {
          m.route.set("/implementation");
        },
      }),
    ]),
};

export default WizardView;
