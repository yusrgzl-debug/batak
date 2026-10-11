const dec = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);

/** 12500 → "12.500", 118160 → "118,16K", 2500000 → "2,5M" (K/M as in the reference app). */
export function pt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${dec(n / 1_000_000)}M`;
  if (a >= 100_000) return `${dec(n / 1000)}K`;
  return new Intl.NumberFormat('tr-TR').format(n);
}
