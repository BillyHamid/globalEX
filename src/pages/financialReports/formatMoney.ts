/** Affichage montants rapports financiers (XOF). */
export function formatReportMoney(n: number, currency: string = 'XOF'): string {
  const rounded = Math.round(n);
  if (currency === 'XOF') {
    return `${rounded.toLocaleString('fr-FR')} XOF`;
  }
  return `${rounded.toLocaleString('fr-FR')} ${currency}`;
}
