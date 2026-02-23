import Climate, { StationRecord } from "./Climate";
import EnergyUse, {
  IntervalBlockRecord,
  UsageSummaryRecord,
} from "./EnergyUse";
import {
  StationZipRecord,
  zipRecords,
  aggregateRecords,
} from "../services/aggregate";

export interface UsageSummaryResult extends StationRecord, UsageSummaryRecord {
  // null values have been removed
  heatDegDays: number;
  meantemp: number;
}

export interface DailyResult extends StationZipRecord<IntervalBlockRecord> {}

const AppState = {
  stationData: [] as UsageSummaryResult[],
  dailyData: [] as DailyResult[],
  recompute: () => {
    if (Climate.stationData.length === 0) return;
    if (EnergyUse.usageSummary.length > 0) {
      AppState.stationData = aggregateRecords(
        Climate.stationData,
        EnergyUse.usageSummary,
      );
    }
    if (EnergyUse.intervalSummary.length > 0) {
      AppState.dailyData = zipRecords(
        Climate.stationData,
        EnergyUse.intervalSummary,
      );
    }
  },
};

export default AppState;
