import m from "mithril";
import { DataTable, DataTableColumn } from "mithril-materialized";
import { StationRecord } from "../models/Climate";
import { FixedPointCellRenderer } from "../utils/table";

import * as d3 from "d3";

interface ClimateAnnualTableAttrs {
  data: StationRecord[];
}

interface AnnualSummary {
  // null values have been removed
  meantemp: number;
  totalPrecipitation: number;
  heatDegDays: number;
  coolDegDays: number;
}

const ANNUAL_SUMMARY_TABLE_COLUMNS = [
  { key: "year", title: "Year", field: "year" },
  {
    key: "meantemp",
    title: "Mean Temp (°C)",
    field: "meantemp",
    cellRenderer: FixedPointCellRenderer(1),
  },
  {
    key: "preciptation",
    title: "Total Precipitation (mm)",
    field: "totalPrecipitation",
    cellRenderer: FixedPointCellRenderer(0),
  },
  {
    key: "heatdegdays",
    title: "Heating Degree Days",
    field: "heatDegDays",
    cellRenderer: FixedPointCellRenderer(0),
  },
  {
    key: "cooldegdays",
    title: "Cooling Degree Days",
    field: "coolDegDays",
    cellRenderer: FixedPointCellRenderer(0),
  },
].map((col) => ({
  // default alignment
  align: "center",
  sortable: true,
  ...col,
})) as DataTableColumn<AnnualSummary>[];

const calculateAnnualSummary = (data: StationRecord[]): AnnualSummary[] => {
  data.sort((a, b) => a.timestamp - b.timestamp);
  return d3
    .rollups(
      data,
      (v) => ({
        meantemp: d3.mean(v, (d) => d.meantemp) || 0,
        heatDegDays: d3.sum(v, (d) => d.heatDegDays) || 0,
        coolDegDays: d3.sum(v, (d) => d.coolDegDays) || 0,
        totalPrecipitation: d3.sum(v, (d) => d.totalPrecipitation) || 0,
      }),
      (d) => {
        const date = new Date(d.timestamp);
        return date.getFullYear();
      },
    )
    .flatMap(([year, stats]) => ({
      year: year,
      ...stats,
    }));
};

const ClimateAnnualTable: m.ClosureComponent<ClimateAnnualTableAttrs> = () => {
  let annualSummary: AnnualSummary[];

  return {
    oninit: (vnode) => {
      annualSummary = calculateAnnualSummary(vnode.attrs.data);
    },

    onbeforeupdate: (vnode, old) => {
      const update = vnode.attrs.data !== old.attrs.data;
      if (update) annualSummary = calculateAnnualSummary(vnode.attrs.data);
      return update;
    },

    view: () => {
      return m("div.card-panel", [
        m(
          "p",
          m("strong", "Changes in Temperature, Precipitation and Degree Days"),
        ),
        m(
          "p",
          "This table summarizes annual climate metrics. ",
          "Since 'Heating Degree Days' represents degree days below 18°C, large ",
          "values are associated with years with ",
          m("emph", "colder"),
          " days. ",
          "Years with large 'Cooling Degree Days' had more hot days. ",
          "The hottest year, 2024, did not have the most cooling degree days ",
          "because the winter was relatively mild with fewer cooling degree days.",
        ),
        m(".table-scroll-container", [
          m(DataTable<AnnualSummary>, {
            className: "highlight",
            columns: ANNUAL_SUMMARY_TABLE_COLUMNS,
            data: annualSummary,
            sortBy: "startFormatted",
          }),
        ]),
      ]);
    },
  };
};

export default ClimateAnnualTable;
