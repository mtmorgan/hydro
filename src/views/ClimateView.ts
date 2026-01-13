import m from "mithril";
import Climate, { type ClimateStation } from "../models/Climate";
import { StationMap } from "./StationMap";
import { DataTable, SubmitButton } from "mithril-materialized";
import { formatDate } from "../utils/date";

interface LabelValueViewAttrs {
	label: string;
	value: string | number | null;
}

const labelValueView: m.Component<LabelValueViewAttrs> = {
	view: ({ attrs }) => {
		const { label, value } = attrs;
		return [m("strong", `${label}: `), value, m("br")];
	},
};

interface StationViewAttrs {
	stationId: string | null;
	stationInformation: ClimateStation["stationInformation"];
}

const StationView: m.Component<StationViewAttrs> = {
	view: ({ attrs }) => {
		const { stationId, stationInformation } = attrs;

		return m("div.card-panel", [
			m("p", [
				m(labelValueView, { label: "Id", value: stationId }),
				m(labelValueView, { label: "Name", value: stationInformation.name }),
				m(labelValueView, {
					label: "Province or territory",
					value: stationInformation.provinceOrTerritory,
				}),
				m(labelValueView, {
					label: "Operator",
					value: stationInformation.stationOperator,
				}),
				m(labelValueView, {
					label: "Latitude, longitude",
					value: `${stationInformation.latitude}, ${stationInformation.longitude}`,
				}),
				m(labelValueView, {
					label: "Elevation",
					value: `${stationInformation.elevation} m`,
				}),
			]),
		]);
	},
};

interface StationDataViewAttrs {
	stationData: ClimateStation["stationData"];
}

const StationDataView: m.Component<StationDataViewAttrs> = {
	view: ({ attrs }) => {
		const { stationData } = attrs;
		const nMissing = stationData.filter((day) => day.meantemp === null).length;
		if (nMissing === stationData.length) {
			return m(
				"div.card-panel.red.lighten-4",
				"Error: No valid climate data available."
			);
		}
		const startDate = formatDate(
			stationData[0].year,
			stationData[0].month,
			stationData[0].day
		);
		const endDate = formatDate(
			stationData[stationData.length - 1].year,
			stationData[stationData.length - 1].month,
			stationData[stationData.length - 1].day
		);
		return m("div.card-panel", [
			m("p", [
				m(labelValueView, {
					label: "Date range",
					value: `${startDate} to ${endDate}`,
				}),
				m(labelValueView, {
					label: "Number of observations",
					value: stationData.length,
				}),
				m(labelValueView, {
					label: "Missing mean temperature observations",
					value: nMissing,
				}),
			]),
			m("div", [
				m(labelValueView, {
					label: "Data (scroll for more)",
					value: "",
				}),
			]),
			m(
				".table-scroll-container", [
				m(DataTable<ClimateStation["stationData"][0]>, {
          className: "highlight",
					data: stationData,
					columns: [
						{
							key: "date",
							title: "Date",
							render: (row: ClimateStation["stationData"][0]) =>
								formatDate(row.year, row.month, row.day),
						},
						{ key: "meantemp", title: "Mean Temp (°C)", field: "meantemp" },
						{
							key: "heatDegDays",
							title: "Heating Degree Days",
							field: "heatDegDays",
						},
						{
							key: "coolDegDays",
							title: "Cooling Degree Days",
							field: "coolDegDays",
						},
						{
							key: "totalPrecipitation",
							title: "Total Precipitation (mm)",
							field: "totalPrecipitation",
						},
					],
					striped: false,
				})
    ]),
		]);
	},
};

const ClimateView = () => {
	let selectedStationId = null as string | null;
	// Climate.load();
	return {
		view: () => [
			m("h2", "Climate"),
			m(
				"p",
				"Find a nearby climate station. The 'best' station may not be the nearest, e.g., King City North is further from us than is the Toronto airport, but the elevation is more comparable. Select the station on the map, then press the 'SUBMIT' button to retrieve the data for that station."
			),
			m("p", [
				"Weather stations are from the Government of Canada Environment and Natural Resources. See the government interface to ",
				m(
					"a",
					{
						href: "https://climate.weather.gc.ca/historical_data/search_historic_data_e.html",
					},
					"all climate stations"
				),
				" with historical data. The file used in the map is  ",
				m(
					"a",
					{
						href: "https://collaboration.cmc.ec.gc.ca/cmc/climate/Get_More_Data_Plus_de_donnees/",
					},
					"Station Inventory EN.csv"
				),
				".",
			]),

			m(StationMap, {
				onSelect: (id) => {
					selectedStationId = id;
					m.redraw();
				},
			}),
			selectedStationId && m("p", `Selected station: ${selectedStationId}`),

			m(
				"p",
				m(SubmitButton, {
					label: "Submit",
					iconClass: "right",
					disabled: !selectedStationId,
					onclick: () => {
						Climate.stationId = selectedStationId;
						Climate.ready = false;
						Climate.load();
					},
				})
			),

			Climate.ready
				? [
						m(StationView, {
							stationId: Climate.stationId,
							stationInformation: Climate.stationInformation,
						}),
						m(StationDataView, { stationData: Climate.stationData }),
				  ]
				: m("p.grey-text", "No climate data loaded."),
		],
	};
};

export default ClimateView;
