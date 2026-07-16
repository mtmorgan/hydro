export const dayOfYear = (timestamp: number): number => {
  const date = new Date(timestamp);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

export const formatHour = (timestamp: number): string =>
  new Date(timestamp).getHours().toString();
