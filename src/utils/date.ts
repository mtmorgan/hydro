export const formatDate = (timestamp: number): string =>
  new Date(timestamp).toISOString().split("T")[0];
