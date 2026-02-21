import Climate, { StationRecord } from "./Climate";
import EnergyUse, { IntervalBlockRecord } from "./EnergyUse";
import {
  aggregateDailyRecords,
  aggregateStationRecords,
} from "../services/aggregate";

export interface AggregatedResult {
  timestamp: number;
  start: string;
  days: number;
  consumption: number;
  cost: number;
  meantemp: number;
  heatdegdays: number;
}

export interface AggregatedDailyResult
  extends StationRecord, IntervalBlockRecord {}

const AppState = {
  aggregatedStationData: [] as AggregatedResult[],
  aggregatedDailyData: [] as AggregatedDailyResult[],
  recompute: () => {
    if (Climate.stationData.length > 0 && EnergyUse.usageSummary.length > 0) {
      AppState.aggregatedStationData = aggregateStationRecords(
        Climate.stationData,
        EnergyUse.usageSummary,
      );
    }
    if (
      Climate.stationData.length > 0 &&
      EnergyUse.intervalSummary.length > 0
    ) {
      AppState.aggregatedDailyData = aggregateDailyRecords(
        Climate.stationData,
        EnergyUse.intervalSummary,
      );
    }
  },
};

export default AppState;
