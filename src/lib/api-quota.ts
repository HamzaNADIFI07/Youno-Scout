export type ApiQuota = {
  used: number;
  limit: number;
  periodLabel: string;
  resetsAt?: string;
};

export type ApiKey = "clearbitLogo" | "hunter" | "companyEnrich";

const STORAGE_KEY = "scout:api-quotas";

type StoredQuotas = Partial<Record<ApiKey, { used: number; periodStart: string }>>;

const PERIOD_HOURS: Record<ApiKey, number> = {
  clearbitLogo: 24,
  hunter: 24 * 30,
  companyEnrich: 24,
};

export const API_LIMITS: Record<ApiKey, number> = {
  clearbitLogo: 0,
  hunter: 25,
  companyEnrich: 50,
};

export const API_PERIOD_LABEL: Record<ApiKey, string> = {
  clearbitLogo: "illimité",
  hunter: "ce mois",
  companyEnrich: "aujourd’hui",
};

function readStorage(): StoredQuotas {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredQuotas;
  } catch {
    return {};
  }
}

function writeStorage(data: StoredQuotas) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

function isExpired(periodStart: string, hours: number): boolean {
  const start = new Date(periodStart).getTime();
  if (Number.isNaN(start)) return true;
  return Date.now() - start > hours * 3600 * 1000;
}

export function getQuotaSnapshot(): Record<ApiKey, ApiQuota> {
  const stored = readStorage();
  const now = new Date().toISOString();
  const result: Record<ApiKey, ApiQuota> = {
    clearbitLogo: {
      used: stored.clearbitLogo?.used ?? 0,
      limit: API_LIMITS.clearbitLogo,
      periodLabel: API_PERIOD_LABEL.clearbitLogo,
    },
    hunter: {
      used:
        stored.hunter && !isExpired(stored.hunter.periodStart, PERIOD_HOURS.hunter)
          ? stored.hunter.used
          : 0,
      limit: API_LIMITS.hunter,
      periodLabel: API_PERIOD_LABEL.hunter,
      resetsAt: stored.hunter?.periodStart ?? now,
    },
    companyEnrich: {
      used:
        stored.companyEnrich &&
        !isExpired(
          stored.companyEnrich.periodStart,
          PERIOD_HOURS.companyEnrich
        )
          ? stored.companyEnrich.used
          : 0,
      limit: API_LIMITS.companyEnrich,
      periodLabel: API_PERIOD_LABEL.companyEnrich,
      resetsAt: stored.companyEnrich?.periodStart ?? now,
    },
  };
  return result;
}

export function incrementQuotas(keys: ApiKey[]): void {
  const stored = readStorage();
  const now = new Date().toISOString();
  for (const key of keys) {
    const current = stored[key];
    const expired = current ? isExpired(current.periodStart, PERIOD_HOURS[key]) : true;
    stored[key] = {
      used: expired ? 1 : current!.used + 1,
      periodStart: expired ? now : current!.periodStart,
    };
  }
  writeStorage(stored);
}
