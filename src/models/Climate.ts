import AppState from "./AppState";
import Stations from "./Stations";
import { memoizedJSONRequest } from "../utils/memoize";
import { FeatureCollection } from "geojson";
import * as d3 from "d3";
import { Status } from "./types";

export interface StationRecord {
  // Raw data
  timestamp: number;
  meantemp: number | null;
  heatDegDays: number | null;
  coolDegDays: number | null;
  totalPrecipitation: number | null;
}

export interface MonthlyRecord extends StationRecord {
  date: Date;
}

export interface StationInformation {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

interface DailyDataProperties {
  LOCAL_DATE: string; // E.g., "2022-01-01 00:00:00"
  COOLING_DEGREE_DAYS: number;
  HEATING_DEGREE_DAYS: number;
  MEAN_TEMPERATURE: number;
  TOTAL_PRECIPITATION: number;
}

const dailyDataPropertyMap: Record<keyof DailyDataProperties, undefined> = {
  LOCAL_DATE: undefined,
  MEAN_TEMPERATURE: undefined,
  TOTAL_PRECIPITATION: undefined,
  COOLING_DEGREE_DAYS: undefined,
  HEATING_DEGREE_DAYS: undefined,
};

const requestDailyData = async (climateId: string) => {
  Climate.status = Status.LOADING;
  const from = new Date("2022-01-01").toISOString();
  const dateInterval = `${from}/..`;
  const properties = Object.keys(dailyDataPropertyMap).join(",");
  const url =
    "https://api.weather.gc.ca/collections/climate-daily/items" +
    `?CLIMATE_IDENTIFIER=${climateId}` +
    `&datetime=${encodeURIComponent(dateInterval)}` +
    `&properties=${properties}` +
    `&sortby=LOCAL_DATE` +
    `&skipGeometry=true&f=json&limit=10000`;

  try {
    const data = await memoizedJSONRequest<
      FeatureCollection<null, DailyDataProperties>
    >(url, "dailyData");

    Climate.stationData = data.features.map((day) => {
      const date = new Date(day.properties.LOCAL_DATE);
      return {
        timestamp: date.getTime(),
        meantemp: day.properties.MEAN_TEMPERATURE,
        heatDegDays: day.properties.HEATING_DEGREE_DAYS,
        coolDegDays: day.properties.COOLING_DEGREE_DAYS,
        totalPrecipitation: day.properties.TOTAL_PRECIPITATION,
      } as StationRecord;
    });
    Climate.status = Status.READY;
  } catch (err) {
    Climate.error = "Cache / Network Error: " + err;
    Climate.status = Status.ERROR;
    console.log(Climate.error);
  }
};

/**
 * State for climate data
 */

const Climate = {
  status: Status.IDLE,
  error: "",
  climateId: null as string | null,
  stationInformation: null as StationInformation | null,
  stationData: [] as StationRecord[],
  monthlyData: [] as MonthlyRecord[],

  load: async (climateId: string) => {
    Climate.status = Status.LOADING;
    if (climateId !== localStorage.getItem("climateId")) {
      // Flush cache, since it is only large enough for a couple of stationIds
      localStorage.removeItem("dailyData");
      localStorage.setItem("climateId", climateId);
    }

    const stationRecord = Stations.getByClimateId(climateId);
    if (stationRecord === undefined || stationRecord === null) {
      Climate.error = `Unknown climate station identifier ${climateId}`;
      Climate.status = Status.ERROR;
      return;
    }

    await requestDailyData(climateId);
    Climate.climateId = stationRecord.ClimateId;
    Climate.stationInformation = {
      elevation: stationRecord.Elevation,
      latitude: stationRecord.Latitude,
      longitude: stationRecord.Longitude,
      name: stationRecord.Name,
    };
    const referenceYear = 2022; // Arbitrary
    Climate.monthlyData = d3
      .rollups(
        Climate.stationData,
        (v) => ({
          meantemp: d3.mean(v, (d) => d.meantemp) || 0,
          heatDegDays: d3.sum(v, (d) => d.heatDegDays) || 0,
          coolDegDays: d3.sum(v, (d) => d.coolDegDays) || 0,
          totalPrecipitation: d3.mean(v, (d) => d.totalPrecipitation) || 0,
        }),
        (d) => {
          // Force all dates to the same reference year
          const m = new Date(d.timestamp).getMonth();
          return new Date(referenceYear, m, 1);
        },
      )
      .map(([week, stats]) => ({
        date: week,
        timestamp: week.getTime(),
        ...stats,
      }));

    Climate.status = Status.READY;
    AppState.recompute();
  },
};

export default Climate;
