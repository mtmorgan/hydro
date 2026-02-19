import { xpathNumber, xpathString } from "../services/xmlInput";
import { Status } from "./types";

export interface EnergyUseRecord {
  timestamp: number;
  duration: number;
  start: Date;
  days: number;
  cost: number;
  consumption: number;
  reading: string;
}

export const parseEnergyUseXML = (xmlDoc: Document): EnergyUseRecord[] => {
  const usageRecord = (usage: Element): EnergyUseRecord => {
    const start = xpathNumber(usage, "./espi:billingPeriod/espi:start");
    const duration = xpathNumber(usage, "./espi:billingPeriod/espi:duration");
    const cost = xpathNumber(usage, "./espi:costAdditionalLastPeriod");
    const consumption = xpathNumber(
      usage,
      "./espi:overallConsumptionLastPeriod/espi:value",
    );
    const reading = xpathString(
      usage,
      "./espi:costAdditionalDetailLastPeriod/espi:note[starts-with(text(), 'Current Meter Read Type')]",
    ).replace(/.*- /, "");

    return {
      timestamp: start * 1000, // milliseconds
      duration: duration * 1000, // milliseconds
      start: new Date(start * 1000),
      days: duration / (60 * 60 * 24),
      cost: cost / 100000,
      consumption: consumption / 1000000,
      reading: reading,
    };
  };

  // Extract energy use data
  const usageSummary = xmlDoc.getElementsByTagName("UsageSummary");
  return Array.from(usageSummary).map(usageRecord);
};

interface EnergyUseInput {
  data: EnergyUseRecord[];
  file: File;
}

const EnergyUse = {
  status: Status.IDLE,
  fileName: [] as string[],
  energyUse: [] as EnergyUseRecord[],

  init: (energyUseInput: EnergyUseInput[]) => {
    EnergyUse.status = Status.LOADING;
    EnergyUse.fileName = energyUseInput.map((elt) => elt.file.name);
    // De-duplicate keeping timestamp & longest durationf
    EnergyUse.energyUse = energyUseInput
      .map((elt) => elt.data)
      .flat()
      .reduce<Map<number, EnergyUseRecord>>((acc, current) => {
        const existing = acc.get(current.timestamp);
        if (!existing || current.duration > existing.duration) {
          acc.set(current.timestamp, current);
        }
        return acc;
      }, new Map())
      .values()
      .toArray()
      .toSorted((a, b) => a.timestamp - b.timestamp);
    EnergyUse.status = Status.READY;
  },
};

export default EnergyUse;
