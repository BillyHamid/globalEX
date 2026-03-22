/**
 * Modes de paiement côté expéditeur :
 * - Burkina Faso : Cash, Zelle
 * - États-Unis : Orange Money, Appel, Virement
 */
import type { LucideIcon } from 'lucide-react';
import { Banknote, Building, Phone, Smartphone } from 'lucide-react';

export type SendMethodId =
  | 'cash'
  | 'zelle'
  | 'orange_money'
  | 'bank_transfer'
  | 'appel'
  | 'wave'; // conservé pour l’affichage d’anciens transferts

export const SEND_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  zelle: 'Zelle',
  orange_money: 'Orange Money',
  bank_transfer: 'Virement',
  appel: 'Appel',
  wave: 'Wave',
};

/** Ordre d’affichage dashboard / listes (wave en dernier = historique) */
export const SEND_METHOD_DISPLAY_ORDER: SendMethodId[] = [
  'cash',
  'zelle',
  'orange_money',
  'appel',
  'bank_transfer',
  'wave',
];

export const SEND_METHODS_BF: { id: SendMethodId; label: string; icon: LucideIcon }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'zelle', label: 'Zelle', icon: Smartphone },
];

export const SEND_METHODS_USA: { id: SendMethodId; label: string; icon: LucideIcon }[] = [
  { id: 'orange_money', label: 'Orange Money', icon: Smartphone },
  { id: 'appel', label: 'Appel', icon: Phone },
  { id: 'bank_transfer', label: 'Virement', icon: Building },
];

export function getSendMethodsForSenderCountry(country: string) {
  return country === 'BFA' ? SEND_METHODS_BF : SEND_METHODS_USA;
}

export function getDefaultSendMethodForCountry(country: string): SendMethodId {
  return country === 'BFA' ? 'cash' : 'orange_money';
}

export function isSendMethodAllowedForCountry(method: string, country: string): boolean {
  const allowed = getSendMethodsForSenderCountry(country).map((m) => m.id);
  return allowed.includes(method as SendMethodId);
}
