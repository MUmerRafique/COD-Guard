/** Normalize Pakistan mobile to digits-only storage format (e.g. 923001234567). */
export function normalizePakistanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("03")) {
    return `92${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("92")) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    return `92${digits}`;
  }
  return null;
}

export function isValidPakistanPhone(input: string): boolean {
  return normalizePakistanPhone(input) !== null;
}
