export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

export const formatHour = (timestamp: number): string =>
  new Date(timestamp).getHours().toString();
