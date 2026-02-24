const IntervalDatePicker = {
  minDate: new Date("2022-01-01"),
  maxDate: new Date(new Date().setHours(23, 59, 59, 999)),
  startDate: new Date("2022-01-1"),
  endDate: new Date(new Date().setHours(23, 59, 59, 999)),

  init: <T extends { timestamp: number }>(data: T[]) => {
    const endDate = new Date(data.at(-1)?.timestamp || Date.now());
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    IntervalDatePicker.minDate = new Date(data[0].timestamp);
    IntervalDatePicker.maxDate = endDate;
    IntervalDatePicker.startDate = startDate;
    IntervalDatePicker.endDate = endDate;
  },

  setSelection: (startDate: Date, endDate: Date) => {
    startDate.setHours(0, 0, 0, 0);
    IntervalDatePicker.startDate = startDate;
    // endDate.setHours(23, 59, 59, 999);
    IntervalDatePicker.endDate = endDate;
  },

  filter: <T extends { timestamp: number }>(data: T[]) => {
    const startDate = new Date(IntervalDatePicker.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(IntervalDatePicker.endDate);
    endDate.setHours(23, 59, 59, 999);
    return data.filter(
      (d) =>
        d.timestamp >= startDate.getTime() && d.timestamp <= endDate.getTime(),
    );
  },
};

export default IntervalDatePicker;
