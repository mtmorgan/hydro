import m from "mithril";
import AppState from "./AppState";
import { xmlNumber, xmlString } from "../services/xmlInput";
import { memoizedJSONRequest } from "../utils/memoize";
import { FeatureCollection } from "geojson";
import { Stations } from "./Stations";
import { Status } from "./types";

export interface StationRecord {
  // Raw data
  year: number;
  month: number;
  day: number;
  timestamp: number;
  meantemp: number | null;
  heatDegDays: number | null;
  coolDegDays: number | null;
  totalPrecipitation: number | null;
}

export interface ClimateStation {
  climateId: string | null;
  stationInformation: {
    name: string | null;
    latitude: number | null;
    longitude: number | null;
    elevation: number | null;
  };
  stationData: StationRecord[];
  status: Status;
  error: string;
  load: (climateStationId: string) => Promise<void>;
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
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
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
 * Memoizer for XMLDocuments in localStorage.
 */

// Generic function to memoize MOST RECENT XMLDocument request
function memoizeXML<Args extends any[]>(
  baseKey: string,
  requestFn: (...args: Args) => Promise<XMLDocument>,
  ttl: number = 3600000,
) {
  return async (...args: Args): Promise<XMLDocument> => {
    // Create a unique key for this specific call, e.g., "xml_cache_["file1.xml"]"
    const specificKey = `${baseKey}_${JSON.stringify(args)}`;
    const cached = localStorage.getItem(specificKey);

    if (cached) {
      const { xmlString, expiry } = JSON.parse(cached);
      if (Date.now() < expiry) {
        return new DOMParser().parseFromString(xmlString, "text/xml");
      }
      localStorage.removeItem(specificKey);
    }

    // Execute the Mithril request with the passed arguments
    const xmlDoc = await requestFn(...args);

    // Serialize for localStorage
    const serializer = new XMLSerializer();
    const cacheData = {
      xmlString: serializer.serializeToString(xmlDoc),
      expiry: Date.now() + ttl,
    };

    try {
      const cacheString = JSON.stringify(cacheData);
      localStorage.setItem(specificKey, cacheString);
    } catch (e) {
      console.warn("Storage full; could not cache XML.");
    }

    return xmlDoc;
  };
}

// Parameterized request to be memoized
const fetchClimateXML = (
  stationId: string,
  year: string,
): Promise<XMLDocument> => {
  const url = `/climate_data?format=xml&stationID=${stationId}&Year=${year}&Month=1&Day=1&timeframe=2&submit=Download+Data`;
  return m.request<XMLDocument>({
    method: "GET",
    url: url,
    deserialize: (x: any) => x as XMLDocument,
    extract: (xhr: XMLHttpRequest): XMLDocument => {
      return xhr.responseXML as XMLDocument;
    },
  });
};

// Memoized request, 24 hour cache
const getClimateXml = memoizeXML("climate_data", fetchClimateXML, 24 * 3600000);

/**
 * Retrieve and extract climate data for a given station and years.
 */

const extractStationInfo = (xmlDoc: XMLDocument) => {
  const info = xmlDoc.getElementsByTagName("stationinformation")[0];
  return {
    name: xmlString(info.querySelector("name")),
    provinceOrTerritory: xmlString(info.querySelector("province_or_territory")),
    stationOperator: xmlString(info.querySelector("stationoperator")),
    latitude: xmlNumber(info.querySelector("latitude")),
    longitude: xmlNumber(info.querySelector("longitude")),
    elevation: xmlNumber(info.querySelector("elevation")),
  };
};

const extractStationData = (xmlDoc: XMLDocument) => {
  const data = xmlDoc.getElementsByTagName("stationdata");
  return Array.from(data).map((day) => {
    return {
      year: parseInt(day.getAttribute("year")!),
      month: parseInt(day.getAttribute("month")!),
      day: parseInt(day.getAttribute("day")!),
      timestamp: new Date(
        parseInt(day.getAttribute("year")!),
        parseInt(day.getAttribute("month")!) - 1,
        parseInt(day.getAttribute("day")!),
      ).getTime(),
      meantemp: xmlNumber(day.querySelector("meantemp")),
      heatDegDays: xmlNumber(day.querySelector("heatdegdays")),
      coolDegDays: xmlNumber(day.querySelector("cooldegdays")),
      totalPrecipitation: xmlNumber(day.querySelector("totalprecipitation")),
    };
  });
};

async function loadClimateData(
  stationId: string,
  years: number[],
): Promise<ClimateStation> {
  // Create a list of promises for each year, reusing memoized fetcher
  const fetchPromises = years.map((year) =>
    getClimateXml(stationId, year.toString()),
  );

  // Wait for all years to resolve (Parallel)
  const xmlDocs = await Promise.all(fetchPromises);

  // Base object from the first year for station info
  const station: ClimateStation = {
    climateId: stationId,
    stationInformation: extractStationInfo(xmlDocs[0]), // Get info once
    stationData: [], // To be filled
    status: Status.IDLE,
    error: "",
    load: async () => {},
  };

  // Extract and flatten stationData arrays
  await requestDailyData(stationId);

  // Sort to ensure chronological order if years arrived out of sequence
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  station.stationData = station.stationData
    .filter((a) => a.timestamp < todayTs)
    .sort((a, b) => a.timestamp - b.timestamp);

  station.status = Status.READY;
  return station;
}

/**
 * State for climate data
 */

const years = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

let Climate = {
  status: Status.IDLE,
  error: "",
  climateId: null as string | null,
  stationInformation: null as ClimateStation["stationInformation"] | null,
  stationData: [] as ClimateStation["stationData"],
  load: async (climateStationId) => {
    Climate.status = Status.LOADING;
    if (climateStationId !== localStorage.getItem("stationId")) {
      // Flush cache, since it is only large enough for a couple of stationIds
      localStorage.removeItem("dailyData");
      localStorage.setItem("stationId", climateStationId);
    }

    const stationRecord = Stations.getByClimateId(climateStationId);
    if (stationRecord === undefined || stationRecord === null) {
      Climate.error = `Unknown climate station identifier ${climateStationId}`;
      Climate.status = Status.ERROR;
      return;
    }

    await requestDailyData(climateStationId);
    Climate.climateId = stationRecord.ClimateId;
    Climate.stationInformation = {
      elevation: stationRecord.Elevation,
      latitude: stationRecord.Latitude,
      longitude: stationRecord.Longitude,
      name: stationRecord.Name,
    };

    Climate.status = Status.READY;
    AppState.recompute();
  },
} as ClimateStation;

export default Climate;
