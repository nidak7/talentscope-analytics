export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function asCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

export function salaryRange(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return "Not disclosed";
  }
  if (min !== null && max !== null) {
    return `${asCurrency(min)} - ${asCurrency(max)}`;
  }
  return asCurrency(min ?? max);
}
