import stationList from "../assets/stations.json";

export interface StationRecord {
	StationId: string;
	Name: string;
	Latitude: number;
	Longitude: number;
	Elevation: number;
}

export const Stations = {
	list: stationList.map((station) => ({
		...station,
		StationId: station.StationId.toString(),
	})) as StationRecord[],

	// Helper to get full info by ID
	getById: (id: string) =>
		Stations.list.find((s) => s.StationId === id),

	// Format for the Select component
	getOptions: () =>
		Stations.list.map((s) => ({
			value: s.StationId,
			label: `${s.Name}`,
		})),
};
