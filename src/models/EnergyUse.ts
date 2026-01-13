import m from "mithril";
import {
	inputXMLFile,
	incrementInputFileKey,
	xpathNumber,
	xpathString,
} from "./XMLFileInput";

export interface EnergyUseRecord {
  timestamp: number,
  duration: number,
	start: Date;
	start_formatted?: string;
	days: number;
	cost: number;
	consumption: number;
	reading: string;
}

const inputEnergyUseXML = (xmlDoc: Document) => {
	const usageRecord = (usage: Element): EnergyUseRecord => {
		const start = xpathNumber(usage, "./espi:billingPeriod/espi:start");
		const duration = xpathNumber(usage, "./espi:billingPeriod/espi:duration");
		const cost = xpathNumber(usage, "./espi:costAdditionalLastPeriod");
		const consumption = xpathNumber(
			usage,
			"./espi:overallConsumptionLastPeriod/espi:value"
		);
		const reading = xpathString(
			usage,
			"./espi:costAdditionalDetailLastPeriod/espi:note[starts-with(text(), 'Current Meter Read Type')]"
		).replace(/.*- /, "");

		return {
      timestamp: start * 1000,
      duration: duration,
			start: new Date(start * 1000),
			days: duration / (60 * 60 * 24),
			cost: cost / 100000,
			consumption: consumption / 1000000,
			reading: reading,
		};
	};

	// Extract energy use data
	const usageSummary = xmlDoc.getElementsByTagName("UsageSummary");
	const energyUse = Array.from(usageSummary).map(usageRecord);

	EnergyUse.energyUse = energyUse;
  EnergyUse.ready = true;
	m.redraw();
	return xmlDoc;
};

let EnergyUse = {
  ready: false,
	fileName: null as string | null,
	energyUse: null as EnergyUseRecord[] | null,
	loadXml: function (files: FileList) {
		EnergyUse.fileName = null;
		EnergyUse.energyUse = null;
    EnergyUse.ready = false;
		const input = inputXMLFile(inputEnergyUseXML, files);
		if (input.error) {
			console.error("EnergyUse loadXML:", input.error);
		} else {
			EnergyUse.fileName = files[0]?.name || null;
		}
		incrementInputFileKey();
	},
};

export default EnergyUse;
