export function isValidResourceId(value: string): boolean {
  return /^\d{1,20}$/.test(value);
}
