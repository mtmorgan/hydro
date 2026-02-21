import { xpathNumber, xpathString } from "../services/xmlInput";
import { Status } from "./types";

export interface IntervalBlockRecord {
  timestamp: number;
  duration: number;
  intervalCount: number;
  consumption: number;
}

export interface UsageSummaryRecord {
  timestamp: number;
  duration: number;
  start: Date;
  days: number;
  cost: number;
  consumption: number;
  reading: string;
}

export interface EnergyUseRecord {
  intervalSummary: IntervalBlockRecord[];
  useSummary: UsageSummaryRecord[];
}

const usageSummaryRecord = (usage: Element): UsageSummaryRecord => {
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

const intervalBlockRecord = (interval: Element): IntervalBlockRecord => {
  const timestamp = xpathNumber(interval, "./espi:interval/espi:start");
  const duration = xpathNumber(interval, "./espi:interval/espi:duration");
  const intervalReading = interval.getElementsByTagName("IntervalReading");
  const consumption = Array.from(intervalReading).reduce(
    (acc, elt) => acc + xpathNumber(elt, "./espi:value"),
    0,
  );
  return {
    timestamp: timestamp * 1000,
    duration: duration * 1000,
    intervalCount: intervalReading.length,
    consumption: consumption / 1000000,
  };
};

export const parseEnergyUseXML = (xmlDoc: Document): EnergyUseRecord => {
  const intervalBlock = xmlDoc.getElementsByTagName("IntervalBlock");
  const intervalSummary = Array.from(intervalBlock).map(intervalBlockRecord);

  const usageSummary = xmlDoc.getElementsByTagName("UsageSummary");
  const useSummary = Array.from(usageSummary).map(usageSummaryRecord);

  return {
    intervalSummary: intervalSummary,
    useSummary: useSummary,
  };
};

interface EnergyUseInput {
  data: EnergyUseRecord;
  file: File;
}

interface RecordBase {
  timestamp: number;
  duration: number;
}

const deduplicateSummary = <T extends RecordBase>(records: T[]): T[] => {
  return Array.from(
    records
      .reduce<Map<number, T>>((acc, current) => {
        const existing = acc.get(current.timestamp);
        if (!existing || current.duration > existing.duration) {
          acc.set(current.timestamp, current);
        }
        return acc;
      }, new Map())
      .values(),
  ).toSorted((a, b) => a.timestamp - b.timestamp);
};

const EnergyUse = {
  status: Status.IDLE,
  fileName: [] as string[],
  usageSummary: [] as UsageSummaryRecord[],
  intervalSummary: [] as IntervalBlockRecord[],

  init: (energyUseInput: EnergyUseInput[]) => {
    EnergyUse.status = Status.LOADING;
    EnergyUse.fileName = energyUseInput.map((elt) => elt.file.name);

    // De-duplicate keeping timestamp & longest duration
    const data = energyUseInput.map((elt) => elt.data);
    EnergyUse.usageSummary = deduplicateSummary(
      data.flatMap((elt) => elt.useSummary),
    );
    EnergyUse.intervalSummary = deduplicateSummary(
      data.flatMap((elt) => elt.intervalSummary),
    );

    EnergyUse.status = Status.READY;
  },
};

export default EnergyUse;
