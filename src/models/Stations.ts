import { Status } from "./types";
import { memoizedJSONRequest } from "../utils/memoize";
import { FeatureCollection, Point } from "geojson";

export interface StationRecord {
  ClimateId: string;
  Name: string;
  Latitude: number;
  Longitude: number;
  Elevation: number;
}

interface ClimateStationProperties {
  CLIMATE_IDENTIFIER: number;
  STATION_NAME: string;
  ELEVATION: number | null;
  DLY_FIRST_DATE: string | null;
  DLY_LAST_DATE: string | null;
}

const stationPropertyMap: Record<keyof ClimateStationProperties, undefined> = {
  CLIMATE_IDENTIFIER: undefined,
  STATION_NAME: undefined,
  ELEVATION: undefined,
  DLY_FIRST_DATE: undefined,
  DLY_LAST_DATE: undefined,
};

const requestStations = async () => {
  Stations.status = Status.LOADING;

  const properties = Object.keys(stationPropertyMap).join(",");
  const url =
    "https://api.weather.gc.ca/collections/climate-stations/items" +
    "?PROV_STATE_TERR_CODE=ON&f=json&limit=10000" +
    `&properties=${properties}`;

  try {
    const data = await memoizedJSONRequest<
      FeatureCollection<Point, ClimateStationProperties>
    >(url, "stations");

    // Filter
    const firstTime = new Date("2022-01-01").getTime();
    const lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 7);
    const lastTime = lastDate.getTime();

    data.features = data.features.filter((stn) => {
      const p = stn.properties;
      const first = p.DLY_FIRST_DATE
        ? new Date(p.DLY_FIRST_DATE).getTime()
        : null;
      const last = p.DLY_LAST_DATE ? new Date(p.DLY_LAST_DATE).getTime() : null;
      return first && first < firstTime && last && last > lastTime;
    });

    Stations.stations = data;
    Stations.status = Status.READY;
  } catch (err) {
    Stations.error = "Cache / Network Error: " + err;
    Stations.status = Status.ERROR;
    console.log(Stations.error);
  }
};

export const Stations = {
  stations: null as FeatureCollection<Point, ClimateStationProperties> | null,
  status: Status.IDLE,
  error: "",
  list: [] as StationRecord[] | null,

  init: async () => {
    await requestStations();
    Stations.list =
      Stations.stations &&
      Stations.stations.features.map((stn) => {
        return {
          ClimateId: String(stn.properties.CLIMATE_IDENTIFIER),
          Name: stn.properties.STATION_NAME,
          Longitude: stn.geometry.coordinates[0],
          Latitude: stn.geometry.coordinates[1],
          Elevation: stn.properties.ELEVATION,
        } as StationRecord;
      });
  },

  // Helper to get full info by ID
  getByClimateId: (climateId: string) =>
    Stations.list && Stations.list.find((s) => s.ClimateId === climateId),
};
