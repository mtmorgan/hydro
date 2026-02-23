export const formatDate = (timestamp: number): string =>
  new Date(timestamp).toISOString().split("T")[0];

export const formatHour = (timestamp: number): string =>
  new Date(timestamp).getHours().toString();
