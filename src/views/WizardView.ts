import { Wizard, WizardStep } from "mithril-materialized";
import m from "mithril";
import HydroView from "./HydroView";
import ClimateView from "./ClimateView";
import InsightView from "./InsightView";

const steps: WizardStep[] = [
	{
		title: "Introduction",
		vnode: () => m("p", "Content for step 1"),
	},
	{ title: "Hydro", vnode: () => m(HydroView) },
	{ title: "Climate", vnode: () => m(ClimateView) },
	{
		title: "Insights",
		vnode: () => m(InsightView),
	},
];

const WizardView: m.Component = {
	view: () =>
		m(".container", [
			m(Wizard, {
				steps: steps,
				showStepNumbers: false,
				allowHeaderNavigation: true,
			}),
		]),
};

export default WizardView;
