export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function asCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function shortDate(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

const UPPER_TOKENS = new Set([
  "ai",
  "ml",
  "qa",
  "ui",
  "ux",
  "sql",
  "aws",
  "gcp",
  "api",
  "sre",
  "devops",
  "ci/cd",
  "kpi",
  "etl"
]);

export function toDisplayLabel(value: string | null | undefined): string {
  const input = (value || "").trim();
  if (!input) {
    return "";
  }
  return input
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (UPPER_TOKENS.has(lower)) {
        return lower.toUpperCase();
      }
      if (lower.includes("/")) {
        return lower
          .split("/")
          .map((part) => (UPPER_TOKENS.has(part) ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`))
          .join("/");
      }
      return `${lower[0].toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

export function salaryRange(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return "Not disclosed";
  }
  if (min !== null && max !== null) {
    return `${asCurrency(min)} - ${asCurrency(max)}`;
  }
  return asCurrency(min ?? max);
}

export function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
