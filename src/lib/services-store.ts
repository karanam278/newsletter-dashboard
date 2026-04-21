export const DEFAULT_SERVICES = [
  "Hair Transplant",
  "Dental Treatment",
  "Rhinoplasty",
  "Liposuction",
  "Breast Lift and Implants",
  "Other Treatment",
];

const STORAGE_KEY = "newsletter_services";

export function getServices(): string[] {
  if (typeof window === "undefined") return DEFAULT_SERVICES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

export function saveServices(services: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}
