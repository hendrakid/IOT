export type SsePublicConfig = {
  registrationAccessPointIds: number[];
  userManagement: { include: number[] };
  accessLogs: { exclude: number[] };
  dashboard: { exclude: number[] };
  accessPointId: number;
};

const DEFAULT_REGISTRATION_IDS = [1];

/** Parse comma-separated positive integers; invalid tokens are dropped. */
export function parsePositiveIntList(
  raw: string | undefined,
  fallback: number[]
): number[] {
  if (!raw?.trim()) return [...fallback];

  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  return ids.length > 0 ? ids : [...fallback];
}

export function getSsePublicConfig(): SsePublicConfig {
  const registrationAccessPointIds = parsePositiveIntList(
    process.env.SSE_REGISTRATION_ACCESS_POINT_IDS,
    DEFAULT_REGISTRATION_IDS
  );

  const accessPointId = registrationAccessPointIds[0];

  return {
    registrationAccessPointIds,
    userManagement: { include: [...registrationAccessPointIds] },
    accessLogs: { exclude: [...registrationAccessPointIds] },
    dashboard: { exclude: [...registrationAccessPointIds] },
    accessPointId,
  };
}
