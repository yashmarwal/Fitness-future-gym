export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isPastDate(dateIso: string): boolean {
  return new Date(dateIso).getTime() < Date.now();
}
