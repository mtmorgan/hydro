import Climate, { StationRecord } from "./Climate";
import EnergyUse, {
  IntervalBlockRecord,
  IntervalReadingRecord,
  UsageSummaryRecord,
} from "./EnergyUse";
import {
  StationZipRecord,
  zipRecords,
  aggregateRecords,
} from "../services/aggregate";
import IntervalDatePicker from "./IntervalDatePicker";

export interface UsageSummaryResult extends StationRecord, UsageSummaryRecord {
  // null values have been removed
  heatDegDays: number;
  meantemp: number;
}

export interface DailyResult extends StationZipRecord<IntervalBlockRecord> {}

export interface HourlyResult extends StationZipRecord<IntervalReadingRecord> {}

const AppState = {
  stationData: [] as UsageSummaryResult[],
  dailyData: [] as DailyResult[],
  hourlyDataRecords: [] as HourlyResult[],
  get hourlyData() {
    return IntervalDatePicker.filter(AppState.hourlyDataRecords);
  },
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
    if (EnergyUse.intervalReadingRecords.length > 0) {
      AppState.hourlyDataRecords = zipRecords(
        Climate.stationData,
        EnergyUse.intervalReadingRecords,
      );
    }
  },
};

export default AppState;
