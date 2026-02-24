import m from "mithril";
import IntervalDatePicker from "../models/IntervalDatePicker";
import { DatePicker } from "mithril-materialized";

const IntervalDatePickerView: m.Component = {
  view: () => {
    return m(DatePicker, {
      dateRange: true,
      label: "View dates",
      minDate: IntervalDatePicker.minDate,
      maxDate: IntervalDatePicker.maxDate,
      initialStartDate: IntervalDatePicker.startDate,
      initialEndDate: IntervalDatePicker.endDate,
      yearRange: [
        IntervalDatePicker.minDate.getFullYear(),
        IntervalDatePicker.maxDate.getFullYear(),
      ],
      autoClose: false,
      onSelect: (start, end) => {
        IntervalDatePicker.setSelection(start, end as Date);
        m.redraw();
      },
    });
  },
};

export default IntervalDatePickerView;
