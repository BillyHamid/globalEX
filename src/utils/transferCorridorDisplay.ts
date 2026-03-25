/**
 * Corridors USA ↔ BF : pour les transferts en attente de paiement côté partenaire,
 * on met en avant le montant dans la devise du pays qui doit payer (XOF au BF, USD aux USA).
 */

export function isUsaToBfCorridor(senderCountry?: string, beneficiaryCountry?: string): boolean {
  return senderCountry === 'USA' && beneficiaryCountry === 'BFA';
}

export function isBfToUsaCorridor(senderCountry?: string, beneficiaryCountry?: string): boolean {
  return senderCountry === 'BFA' && beneficiaryCountry === 'USA';
}

export function isAwaitingCounterpartPayment(status: string): boolean {
  return status === 'pending' || status === 'in_progress';
}

export type PendingCorridorHighlight = {
  /** Montant à mettre en avant (devise du pays qui paie en attente) */
  primaryAmount: number;
  primaryCurrency: string;
  primaryHint: string;
  secondaryAmount: number;
  secondaryCurrency: string;
  secondaryHint: string;
};

/**
 * Si retour non null, l’UI doit afficher primary en premier (XOF pour USA→BF en attente, USD pour BF→USA).
 */
export function getPendingCorridorHighlight(row: {
  status: string;
  sender?: { country?: string };
  beneficiary?: { country?: string };
  amountSent: number;
  currencySent: string;
  amountReceived: number;
  currencyReceived: string;
}): PendingCorridorHighlight | null {
  if (!isAwaitingCounterpartPayment(row.status)) return null;
  const sc = row.sender?.country;
  const bc = row.beneficiary?.country;
  if (isUsaToBfCorridor(sc, bc)) {
    return {
      primaryAmount: row.amountReceived,
      primaryCurrency: row.currencyReceived || 'XOF',
      primaryHint: 'À remettre au BF',
      secondaryAmount: row.amountSent,
      secondaryCurrency: row.currencySent,
      secondaryHint: 'Émis aux USA',
    };
  }
  if (isBfToUsaCorridor(sc, bc)) {
    return {
      primaryAmount: row.amountReceived,
      primaryCurrency: row.currencyReceived || 'USD',
      primaryHint: 'À remettre aux USA',
      secondaryAmount: row.amountSent,
      secondaryCurrency: row.currencySent,
      secondaryHint: 'Émis au BF',
    };
  }
  return null;
}
