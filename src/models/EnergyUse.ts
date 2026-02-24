import { xpathNumber, xpathString } from "../services/xmlInput";
import { Status } from "./types";
import IntervalDatePicker from "./IntervalDatePicker";

export interface IntervalReadingRecord {
  timestamp: number;
  duration: number;
  consumption: number;
  quality: number;
}

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
  intervalReading: IntervalReadingRecord[];
  intervalBlock: IntervalBlockRecord[];
  usageSummary: UsageSummaryRecord[];
}

const usageSummaryRecord = (usage: Element): UsageSummaryRecord => {
  const timestamp = xpathNumber(usage, "./espi:billingPeriod/espi:start");
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
    timestamp: timestamp * 1000, // milliseconds
    duration: duration * 1000, // milliseconds
    start: new Date(timestamp * 1000),
    days: duration / (60 * 60 * 24),
    cost: cost / 100000,
    consumption: consumption / 1000000,
    reading: reading,
  };
};

const intervalBlockRecord = (interval: Element): IntervalBlockRecord => {
  const intervalReading = interval.getElementsByTagName("IntervalReading");
  const consumption = Array.from(intervalReading).reduce(
    (acc, elt) => acc + xpathNumber(elt, "./espi:value"),
    0,
  );
  return {
    timestamp: xpathNumber(interval, "./espi:interval/espi:start") * 1000,
    duration: xpathNumber(interval, "./espi:interval/espi:duration") * 1000,
    intervalCount: intervalReading.length,
    consumption: consumption / 1000000,
  };
};

const intervalReadingRecord = (reading: Element): IntervalReadingRecord => {
  return {
    timestamp: xpathNumber(reading, "./espi:timePeriod/espi:start") * 1000,
    duration: xpathNumber(reading, "./espi:timePeriod/espi:duration") * 1000,
    consumption: xpathNumber(reading, "./espi:value") / 1000000,
    quality: xpathNumber(reading, "./espi:ReadingQuality/espi:quality"),
  };
};

export const parseEnergyUseXML = (xmlDoc: Document): EnergyUseRecord => {
  const intervalBlock = xmlDoc.getElementsByTagName("IntervalBlock");
  const intervalBlocks = Array.from(intervalBlock).map(intervalBlockRecord);

  const usageSummary = xmlDoc.getElementsByTagName("UsageSummary");
  const usageSummaries = Array.from(usageSummary).map(usageSummaryRecord);

  const intervalReading = xmlDoc.getElementsByTagName("IntervalReading");
  const intervalReadings = Array.from(intervalReading).map(
    intervalReadingRecord,
  );

  return {
    intervalReading: intervalReadings,
    intervalBlock: intervalBlocks,
    usageSummary: usageSummaries,
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
  usageSummary: [] as UsageSummaryRecord[], // billing period
  intervalSummary: [] as IntervalBlockRecord[], // daily

  // intervalReading, allowing for filter
  intervalReadingRecords: [] as IntervalReadingRecord[], // hourly; all data
  get intervalReading() {
    return IntervalDatePicker.filter(this.intervalReadingRecords);
  },

  init: (energyUseInput: EnergyUseInput[]) => {
    EnergyUse.status = Status.LOADING;
    EnergyUse.fileName = energyUseInput.map((elt) => elt.file.name);

    // De-duplicate keeping timestamp & longest duration
    const data = energyUseInput.map((elt) => elt.data);
    EnergyUse.usageSummary = deduplicateSummary(
      data.flatMap((elt) => elt.usageSummary),
    );
    EnergyUse.intervalSummary = deduplicateSummary(
      data.flatMap((elt) => elt.intervalBlock),
    );
    EnergyUse.intervalReadingRecords = deduplicateSummary(
      data.flatMap((elt) => elt.intervalReading),
    );

    EnergyUse.status = Status.READY;
  },
};

export default EnergyUse;
