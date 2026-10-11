/** 12500 → "12.500", 118160 → "118,16B" style compact numbers for big balances. */
export function pt(n: number): string {
  if (Math.abs(n) >= 100000) {
    return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  }
  return new Intl.NumberFormat('tr-TR').format(n);
}
