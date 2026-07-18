export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

export const formatHour = (timestamp: number): string =>
  new Date(timestamp).getHours().toString();

export const timestampMonth = (timestamp: number): Date => {
  const referenceYear = 2022; // Arbitrary
  const m = new Date(timestamp).getMonth();
  return new Date(referenceYear, m, 1);
};
