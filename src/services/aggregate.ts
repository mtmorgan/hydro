import { type StationRecord } from "../models/Climate";
import { type EnergyUseRecord } from "../models/EnergyUse";
import { type AggregatedResult } from "../models/AppState";

/*
 * Aggregate climate data to date intervals from hydro
 */

export const aggregateStationRecords = (
  stationRecord: StationRecord[],
  energyUse: EnergyUseRecord[],
) => {
  // Each interval is defined by boundaries[i] to boundaries[i+1]
  return energyUse.reduce<{
    results: AggregatedResult[];
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
        timestamp: energyRecord.timestamp,
        start: energyRecord.start_formatted as string,
        days: energyRecord.days,
        consumption: energyRecord.consumption,
        cost: energyRecord.cost,
        meantemp: averageTemperature.length
          ? averageTemperature.reduce((a, b) => a + b, 0) /
            averageTemperature.length
          : 0,
        heatdegdays: heatDegDays,
      });

      acc.dataIndex = nextIdx; // Update state for the next interval
      return acc;
    },
    { results: [], dataIndex: 0 },
  ).results;
};
