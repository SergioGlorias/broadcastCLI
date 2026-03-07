export const splitIdsIntoGroups = (broadcastsIds: string[], gameIds: string[]) => {
  const chunkSize = 64;
  const groups: string[][] = broadcastsIds.map(() => []);
  for (let i = 0; i < broadcastsIds.length; i++) {
    const start = i * chunkSize;
    if (i === broadcastsIds.length - 1) {
      groups[i] = gameIds.slice(start);
    } else {
      groups[i] = gameIds.slice(start, start + chunkSize);
    }
  }
  return groups;
};