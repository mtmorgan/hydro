import m from "mithril";
import { CellRendererAttrs } from "mithril-materialized";
import { formatDate, formatHour } from "./date";

const isNotNumber = (value: any): boolean => {
  return value === undefined || value === null || typeof value !== "number";
};

export const FixedPointCellRenderer = (
  digits: number,
): m.FactoryComponent<CellRendererAttrs> => {
  return () => {
    return {
      view: ({ attrs }) => {
        const { value } = attrs;
        if (isNotNumber(value)) return "";
        return value.toFixed(digits);
      },
    };
  };
};

export const PrecisionCellRenderer = (
  digits: number,
): m.FactoryComponent<CellRendererAttrs> => {
  return () => {
    return {
      view: ({ attrs }) => {
        const { value } = attrs;
        if (isNotNumber(value)) return "";
        return value.toPrecision(digits);
      },
    };
  };
};

export const DollarCellRenderer = (): m.FactoryComponent<CellRendererAttrs> => {
  return () => {
    return {
      view: ({ attrs }) => {
        const { value } = attrs;
        if (isNotNumber(value)) return "";
        const paddedValue = value.toFixed(2).padStart(6, "\u00A0");
        return `$${paddedValue}`;
      },
    };
  };
};

export const TimestampAsDateRenderer =
  (): m.FactoryComponent<CellRendererAttrs> => {
    return () => {
      return {
        view: ({ attrs }) => {
          const { value } = attrs;
          if (isNotNumber(value)) return "";
          return m("span", formatDate(value));
        },
      };
    };
  };

export const TimestampAsHourRenderer =
  (): m.FactoryComponent<CellRendererAttrs> => {
    return () => {
      return {
        view: ({ attrs }) => {
          const { value } = attrs;
          if (isNotNumber(value)) return "";
          return m("span", formatHour(value));
        },
      };
    };
  };
