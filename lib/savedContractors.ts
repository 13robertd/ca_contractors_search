"use client";

const KEY = "saved_contractors_v1";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  // Tell other components in the same tab to refresh (storage event only fires
  // in *other* tabs, so we fire a custom event too).
  window.dispatchEvent(new CustomEvent("saved-contractors-changed"));
}

export function getSavedLicenses(): string[] {
  return read();
}

export function isSaved(license: string): boolean {
  return read().includes(license);
}

export function saveContractor(license: string): void {
  const list = read();
  if (!list.includes(license)) {
    list.push(license);
    write(list);
  }
}

export function unsaveContractor(license: string): void {
  const list = read().filter((l) => l !== license);
  write(list);
}

export function toggleSaved(license: string): boolean {
  const saved = isSaved(license);
  if (saved) unsaveContractor(license);
  else saveContractor(license);
  return !saved;
}
