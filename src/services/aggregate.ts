import { StationRecord } from "../models/Climate";
import { UsageSummaryRecord } from "../models/EnergyUse";
import { UsageSummaryResult } from "../models/AppState";
import { formatDate } from "../utils/date";

/*
 * Aggregate climate data to date intervals from hydro
 */

export const aggregateRecords = (
  stationRecord: StationRecord[],
  energyUse: UsageSummaryRecord[],
) => {
  // Each interval is defined by boundaries[i] to boundaries[i+1]
  return energyUse.reduce<{
    results: UsageSummaryResult[];
    dataIndex: number; // Single-pass pointer
  }>(
    (acc, energyRecord) => {
      const start = energyRecord.timestamp;
      const end = start + energyRecord.duration;
      const averageTemperature: number[] = [];
      let heatDegDays = 0;
      let nextIdx = acc.dataIndex;

      // Advance through data starting from the last saved index
      while (
        nextIdx < stationRecord.length &&
        stationRecord[nextIdx].timestamp < end
      ) {
        if (stationRecord[nextIdx].timestamp >= start) {
          // Deal with missing meantemp
          stationRecord[nextIdx].meantemp &&
            averageTemperature.push(stationRecord[nextIdx].meantemp as number);
          stationRecord[nextIdx].heatDegDays &&
            (heatDegDays += stationRecord[nextIdx].heatDegDays as number);
        }
        nextIdx++;
      }

      acc.results.push({
        ...stationRecord[nextIdx],
        ...energyRecord,
        meantemp: averageTemperature.length
          ? averageTemperature.reduce((a, b) => a + b, 0) /
            averageTemperature.length
          : 0,
        heatDegDays: heatDegDays,
      });

      acc.dataIndex = nextIdx; // Update state for the next interval
      return acc;
    },
    { results: [], dataIndex: 0 },
  ).results;
};

// zipRecords() removes heatDegDays and meantemp with null values; strengthen
// the type definition
type StrictStationFields = {
  heatDegDays: number;
  meantemp: number;
};

export type StationZipRecord<T> = Omit<
  StationRecord,
  keyof StrictStationFields
> &
  T &
  StrictStationFields;

export const zipRecords = <T extends { timestamp: number }>(
  station: StationRecord[],
  interval: T[],
): StationZipRecord<T>[] => {
  // station dates are unique, whereas interval dates may not be, e.g., hourly
  const stationLookup = new Map(
    station.map((elt) => [formatDate(elt.timestamp), elt]),
  );
  const result = interval.flatMap((interval) => {
    const station = stationLookup.get(formatDate(interval.timestamp));
    return station && station.meantemp && station.heatDegDays
      ? [
          {
            ...station,
            ...interval,
          } as StationZipRecord<T>,
        ]
      : [];
  });
  return result;
};
