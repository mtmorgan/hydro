import Climate from "./Climate";
import EnergyUse from "./EnergyUse";
import { aggregateStationRecords } from "../services/aggregate";

export interface AggregatedResult {
  timestamp: number;
  start: string;
  days: number;
  consumption: number;
  cost: number;
  meantemp: number;
  heatdegdays: number;
}

const AppState = {
  aggregatedStationData: [] as AggregatedResult[],
  recompute: () => {
    if (Climate.stationData.length > 0 && EnergyUse.usageSummary.length > 0) {
      AppState.aggregatedStationData = aggregateStationRecords(
        Climate.stationData,
        EnergyUse.usageSummary,
      );
    }
  },
};

export default AppState;
