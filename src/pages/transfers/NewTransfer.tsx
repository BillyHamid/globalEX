import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI, sendersAPI, beneficiariesAPI, exchangeRatesAPI } from '@/services/api';
import { 
  ArrowLeft, ArrowRight, User, Phone, Mail, MapPin, 
  DollarSign, Calculator, CheckCircle, Send, Copy,
  CreditCard, Hash, Calendar,
  Globe, FileText, Upload, X, Loader2
} from 'lucide-react';
import {
  getDefaultSendMethodForCountry,
  getSendMethodsForSenderCountry,
  isSendMethodAllowedForCountry,
  type SendMethodId,
} from '@/constants/sendMethods';

// Types pour le formulaire
interface SenderInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  sendMethod: SendMethodId;
}

interface BeneficiaryInfo {
  firstName: string;
  lastName: string;
  phone: string;
  idType: 'none' | 'passport' | 'national_id' | 'driver_license';
  idNumber: string;
  country: string;
  city: string;
}

interface FinancialInfo {
  amountSent: number;
  currency: string;
  exchangeRate: number;
  useAutoRate: boolean;
  fees: number;
}

// Taux de change - fallback si API indisponible
// taux_paiement = taux_reel + marge_fixe(30)
const MARGE_FIXE = 30;
const FALLBACK_RATE_REEL = 557;
const FALLBACK_RATE_PAIEMENT = FALLBACK_RATE_REEL + MARGE_FIXE;

// Frais selon le montant
// Structure pour USD (USA → BF): 
// - $1-$100: $5
// - $101-$200: $8
// - $201-$500: $10
// - $501-$800: $15
// - $801-$1000: $20
// - >$1000: $20 par tranche de $1000
// Structure pour XOF (BF → USA):
// - 1-61500 XOF (~$1-$100): 3075 XOF (~$5)
// - 61501-123000 XOF (~$101-$200): 4920 XOF (~$8)
// - 123001-307500 XOF (~$201-$500): 6150 XOF (~$10)
// - 307501-492000 XOF (~$501-$800): 9225 XOF (~$15)
// - 492001-615000 XOF (~$801-$1000): 12300 XOF (~$20)
// - >615000 XOF: 12300 XOF par tranche de 615000 XOF (~$20 par $1000)
const calculateFees = (amount: number, currency: string): number => {
  if (currency === 'USD') {
    // Montants supérieurs à $1000: $20 par tranche de $1000
    if (amount > 1000) {
      const thousands = Math.floor(amount / 1000);
      return thousands * 20; // $20 par tranche de $1000
    }
    
    // Montants <= $1000: utiliser les tranches fixes
    if (amount >= 1 && amount <= 100) return 5;
    if (amount >= 101 && amount <= 200) return 8;
    if (amount >= 201 && amount <= 500) return 10;
    if (amount >= 501 && amount <= 800) return 15;
    if (amount >= 801 && amount <= 1000) return 20;
    
    // Fallback
    return 5;
  } else if (currency === 'XOF') {
    // Frais en XOF pour BF → USA
    // Montants supérieurs à 615000 XOF (~$1000): 12300 XOF par tranche de 615000 XOF
    if (amount > 615000) {
      const tranches = Math.floor(amount / 615000);
      return tranches * 12300; // 12300 XOF par tranche (~$20 par $1000)
    }
    
    // Montants <= 615000 XOF: utiliser les tranches fixes en XOF
    if (amount >= 1 && amount <= 61500) return 3075; // ~$5
    if (amount >= 61501 && amount <= 123000) return 4920; // ~$8
    if (amount >= 123001 && amount <= 307500) return 6150; // ~$10
    if (amount >= 307501 && amount <= 492000) return 9225; // ~$15
    if (amount >= 492001 && amount <= 615000) return 12300; // ~$20
    
    // Fallback
    return 3075;
  } else {
    // Fallback pour autres devises (ne devrait pas arriver)
    return currency === 'USD' ? 5 : 3075;
  }
};

const STEPS = [
  { id: 1, title: 'Expéditeur', icon: User },
  { id: 2, title: 'Bénéficiaire', icon: User },
  { id: 3, title: 'Montant', icon: DollarSign },
  { id: 4, title: 'Confirmation', icon: CheckCircle },
];

const COUNTRIES_SEND = [
  { code: 'USA', name: 'États-Unis', currency: 'USD', flag: '🇺🇸' },
  { code: 'BFA', name: 'Burkina Faso', currency: 'XOF', flag: '🇧🇫' },
];

const COUNTRIES_RECEIVE = [
  { code: 'BFA', name: 'Burkina Faso', currency: 'XOF', flag: '🇧🇫' },
  { code: 'USA', name: 'États-Unis', currency: 'USD', flag: '🇺🇸' },
];

// Pays d'envoi/réception selon l'agent connecté : agent BF → envoi BF uniquement ; agent USA → envoi USA uniquement
const isAgentBF = (userCountry: string | undefined) =>
  !!userCountry &&
  (userCountry === 'BFA' || userCountry === 'Burkina Faso' || userCountry.toLowerCase().includes('burkina'));

const getDefaultCountriesByAgent = (userCountry: string | undefined) => {
  const isBF = isAgentBF(userCountry);
  return {
    send: isBF ? 'BFA' : 'USA',
    receive: isBF ? 'USA' : 'BFA',
  };
};

// Pour un agent BF : seul BF peut envoyer ; pour un agent USA : seule USA peut envoyer (pas de choix)
const getSenderCountriesForAgent = (userCountry: string | undefined) =>
  isAgentBF(userCountry)
    ? COUNTRIES_SEND.filter((c) => c.code === 'BFA')
    : COUNTRIES_SEND.filter((c) => c.code === 'USA');

const getReceiverCountriesForAgent = (userCountry: string | undefined) =>
  isAgentBF(userCountry)
    ? COUNTRIES_RECEIVE.filter((c) => c.code === 'USA')
    : COUNTRIES_RECEIVE.filter((c) => c.code === 'BFA');

/** Pour l’auto-complétion : prend le fragment le plus long (≥ 2 car.) parmi prénom, nom, téléphone */
const getBeneficiarySearchToken = (b: BeneficiaryInfo): string => {
  const parts = [b.firstName, b.lastName, b.phone].map((s) => s.trim()).filter((s) => s.length >= 2);
  if (parts.length === 0) return '';
  return parts.reduce((best, x) => (x.length > best.length ? x : best), parts[0]);
};

const getSenderSearchToken = (s: SenderInfo): string => {
  const parts = [s.firstName, s.lastName, s.phone].map((x) => x.trim()).filter((x) => x.length >= 2);
  if (parts.length === 0) return '';
  return parts.reduce((best, x) => (x.length > best.length ? x : best), parts[0]);
};

const mapApiIdTypeToForm = (raw: string | null | undefined): BeneficiaryInfo['idType'] => {
  if (!raw) return 'none';
  const v = String(raw).toLowerCase().replace(/-/g, '_');
  if (v === 'passport' || v === 'passeport') return 'passport';
  if (v === 'national_id' || v === 'cni' || v === 'id_nationale') return 'national_id';
  if (v === 'driver_license' || v === 'permis') return 'driver_license';
  return 'none';
};

export const NewTransfer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [copied, setCopied] = useState(false);

  const defaultCountries = getDefaultCountriesByAgent(user?.country);

  // État du formulaire : pays d'envoi = pays de l'agent (BF → BF, USA → USA)
  const [sender, setSender] = useState<SenderInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    country: defaultCountries.send,
    sendMethod: getDefaultSendMethodForCountry(defaultCountries.send),
  });

  const [beneficiary, setBeneficiary] = useState<BeneficiaryInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    idType: 'none',
    idNumber: '',
    country: defaultCountries.receive,
    city: '',
  });

  const [financial, setFinancial] = useState<FinancialInfo>({
    amountSent: 0,
    currency: 'USD',
    exchangeRate: FALLBACK_RATE_REEL,
    useAutoRate: true,
    fees: 0,
  });
  
  const [feesManuallyEdited, setFeesManuallyEdited] = useState(false);
  /** Saisie libre USA → BFA (string) pour permettre de vider le champ ; `financial.fees` reste la valeur numérique. */
  const [feesText, setFeesText] = useState('0');
  const [liveRateDetails, setLiveRateDetails] = useState<{ rateReel: number; ratePaiement: number; marge: number } | null>(null);

  // Direction du transfert
  const isUSAtoBF = sender.country === 'USA' && beneficiary.country === 'BFA';
  const isBFtoUSA = sender.country === 'BFA' && beneficiary.country === 'USA';

  // Taux effectif selon la direction : marge (+30) uniquement pour BF → USA
  const effectiveAutoRate = isBFtoUSA
    ? (liveRateDetails?.ratePaiement ?? FALLBACK_RATE_PAIEMENT)
    : (liveRateDetails?.rateReel ?? FALLBACK_RATE_REEL);

  // Récupérer le taux USD/XOF du jour (API)
  useEffect(() => {
    let cancelled = false;
    exchangeRatesAPI.getUsdXofDetails()
      .then((d) => {
        if (!cancelled) setLiveRateDetails(d);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveRateDetails({ rateReel: FALLBACK_RATE_REEL, ratePaiement: FALLBACK_RATE_PAIEMENT, marge: MARGE_FIXE });
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Listes expéditeurs / bénéficiaires depuis la base (pour sélection)
  const [sendersList, setSendersList] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string; email?: string; country: string }>>([]);
  const [beneficiariesList, setBeneficiariesList] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string; country: string; city?: string }>>([]);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [beneficiaryIdProofFile, setBeneficiaryIdProofFile] = useState<File | null>(null);
  const [debouncedBeneficiarySearch, setDebouncedBeneficiarySearch] = useState('');
  const [beneficiaryTypeahead, setBeneficiaryTypeahead] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      country: string;
      city?: string;
      idType?: string;
      idNumber?: string;
    }>
  >([]);
  const [beneficiaryTypeaheadLoading, setBeneficiaryTypeaheadLoading] = useState(false);
  const [beneficiarySuggestionsOpen, setBeneficiarySuggestionsOpen] = useState(false);

  const [debouncedSenderSearch, setDebouncedSenderSearch] = useState('');
  const [senderTypeahead, setSenderTypeahead] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      country: string;
    }>
  >([]);
  const [senderTypeaheadLoading, setSenderTypeaheadLoading] = useState(false);
  const [senderSuggestionsOpen, setSenderSuggestionsOpen] = useState(false);

  // Charger les expéditeurs du pays d'envoi (avec protection StrictMode + cleanup)
  useEffect(() => {
    if (!sender.country) return;
    setSelectedSenderId(null);
    setLoadingSenders(true);
    let cancelled = false;
    sendersAPI.getAll({ country: sender.country, limit: 200 })
      .then((res) => { if (!cancelled) setSendersList(res.data || []); })
      .catch(() => { if (!cancelled) setSendersList([]); })
      .finally(() => { if (!cancelled) setLoadingSenders(false); });
    return () => { cancelled = true; };
  }, [sender.country]);

  useEffect(() => {
    const token = getSenderSearchToken(sender);
    const t = setTimeout(() => setDebouncedSenderSearch(token), 380);
    return () => clearTimeout(t);
  }, [sender.firstName, sender.lastName, sender.phone]);

  useEffect(() => {
    if (currentStep !== 1 || !sender.country || debouncedSenderSearch.length < 2) {
      setSenderTypeahead([]);
      setSenderTypeaheadLoading(false);
      return;
    }
    let cancelled = false;
    setSenderTypeaheadLoading(true);
    sendersAPI
      .getAll({ country: sender.country, search: debouncedSenderSearch, limit: 20 })
      .then((res) => {
        if (!cancelled) setSenderTypeahead(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setSenderTypeahead([]);
      })
      .finally(() => {
        if (!cancelled) setSenderTypeaheadLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSenderSearch, sender.country, currentStep]);

  const applySenderSuggestion = (s: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    country: string;
  }) => {
    setSelectedSenderId(s.id);
    const country = s.country || sender.country;
    setSender((prev) => ({
      ...prev,
      firstName: s.firstName,
      lastName: s.lastName,
      phone: s.phone,
      email: s.email || '',
      country,
      sendMethod: getDefaultSendMethodForCountry(country),
    }));
    setSenderSuggestionsOpen(false);
    setSenderTypeahead([]);
  };

  // Charger les bénéficiaires du pays de réception (avec protection StrictMode + cleanup)
  useEffect(() => {
    if (!beneficiary.country) return;
    setSelectedBeneficiaryId(null);
    setLoadingBeneficiaries(true);
    let cancelled = false;
    beneficiariesAPI.getAll({ country: beneficiary.country, limit: 200 })
      .then((res) => { if (!cancelled) setBeneficiariesList(res.data || []); })
      .catch(() => { if (!cancelled) setBeneficiariesList([]); })
      .finally(() => { if (!cancelled) setLoadingBeneficiaries(false); });
    return () => { cancelled = true; };
  }, [beneficiary.country]);

  // Saisie prénom / nom / tél. : debounce puis recherche API (suggestions)
  useEffect(() => {
    const token = getBeneficiarySearchToken(beneficiary);
    const t = setTimeout(() => setDebouncedBeneficiarySearch(token), 380);
    return () => clearTimeout(t);
  }, [beneficiary.firstName, beneficiary.lastName, beneficiary.phone]);

  useEffect(() => {
    if (currentStep !== 2 || !beneficiary.country || debouncedBeneficiarySearch.length < 2) {
      setBeneficiaryTypeahead([]);
      setBeneficiaryTypeaheadLoading(false);
      return;
    }
    let cancelled = false;
    setBeneficiaryTypeaheadLoading(true);
    beneficiariesAPI
      .getAll({ country: beneficiary.country, search: debouncedBeneficiarySearch, limit: 20 })
      .then((res) => {
        if (!cancelled) setBeneficiaryTypeahead(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setBeneficiaryTypeahead([]);
      })
      .finally(() => {
        if (!cancelled) setBeneficiaryTypeaheadLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedBeneficiarySearch, beneficiary.country, currentStep]);

  const applyBeneficiarySuggestion = (
    b: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      country: string;
      city?: string;
      idType?: string;
      idNumber?: string;
    }
  ) => {
    setSelectedBeneficiaryId(b.id);
    setBeneficiary((prev) => ({
      ...prev,
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone,
      country: b.country || prev.country,
      city: b.city || '',
      idType: mapApiIdTypeToForm(b.idType),
      idNumber: b.idNumber || '',
    }));
    setBeneficiarySuggestionsOpen(false);
    setBeneficiaryTypeahead([]);
  };

  // Quand l'agent est chargé, appliquer pays d'envoi = pays de l'agent (BF → BF, USA → USA)
  useEffect(() => {
    if (!user?.country) return;
    const { send, receive } = getDefaultCountriesByAgent(user.country);
    setSender(prev => (prev.country === send ? prev : { ...prev, country: send }));
    setBeneficiary(prev => (prev.country === receive ? prev : { ...prev, country: receive }));
  }, [user?.country]);

  // Modes de paiement selon le pays expéditeur (BF : cash/zelle · USA : Orange / Appel / Virement)
  useEffect(() => {
    setSender((prev) => {
      if (!prev.country) return prev;
      if (isSendMethodAllowedForCountry(prev.sendMethod, prev.country)) return prev;
      return { ...prev, sendMethod: getDefaultSendMethodForCountry(prev.country) };
    });
  }, [sender.country]);

  // Mettre à jour la devise et le taux selon le pays d'envoi
  // Bf → USA : taux_paiement (réel + 30). USA → BF : taux réel
  useEffect(() => {
    const country = COUNTRIES_SEND.find(c => c.code === sender.country);
    if (country) {
      const bfToUsa = sender.country === 'BFA' && beneficiary.country === 'USA';
      const rate = bfToUsa
        ? (liveRateDetails?.ratePaiement ?? FALLBACK_RATE_PAIEMENT)
        : (liveRateDetails?.rateReel ?? FALLBACK_RATE_REEL);
      setFinancial(prev => ({
        ...prev,
        currency: country.currency,
        exchangeRate: prev.useAutoRate ? rate : prev.exchangeRate,
      }));
    }
  }, [sender.country, beneficiary.country, liveRateDetails]);

  // BF → USA : frais = (montant / taux_reel) - (montant / taux_paiement) → USD
  // taux_paiement = financial.exchangeRate (modifiable par l'utilisateur)
  // USA → BF : grille indicative en USD selon le montant envoyé (alignée sur le backend calculateFees)
  const computeAutoFees = (): number => {
    if (isBFtoUSA && financial.amountSent > 0) {
      const rr = liveRateDetails?.rateReel ?? FALLBACK_RATE_REEL;
      const rp = financial.exchangeRate;
      if (rp <= rr) return 0;
      return Math.round(((financial.amountSent / rr) - (financial.amountSent / rp)) * 100) / 100;
    }
    if (isUSAtoBF) {
      return calculateFees(financial.amountSent, 'USD');
    }
    return calculateFees(financial.amountSent, financial.currency);
  };

  const feeCurrency = isBFtoUSA ? 'USD' : financial.currency;

  useEffect(() => {
    if (financial.amountSent > 0 && !feesManuallyEdited) {
      const fees = computeAutoFees();
      setFinancial(prev => ({ ...prev, fees }));
    }
  }, [financial.amountSent, financial.currency, financial.exchangeRate, feesManuallyEdited, isBFtoUSA, isUSAtoBF, liveRateDetails]);

  useEffect(() => {
    if (isBFtoUSA) return;
    if (!feesManuallyEdited) {
      const f = financial.fees;
      setFeesText(Number.isFinite(f) ? String(f) : '0');
    }
  }, [financial.fees, feesManuallyEdited, isBFtoUSA]);

  // Calculs — direction du transfert
  let amountReceived: number;
  let currencyReceived: string;
  
  if (isUSAtoBF) {
    amountReceived = Math.round(financial.amountSent * financial.exchangeRate);
    currencyReceived = 'XOF';
  } else if (isBFtoUSA) {
    amountReceived = Math.round((financial.amountSent / financial.exchangeRate) * 100) / 100;
    currencyReceived = 'USD';
  } else {
    amountReceived = Math.round(financial.amountSent * financial.exchangeRate);
    currencyReceived = 'XOF';
  }
  
  // BF → USA : frais intégrés dans la marge du taux (pas d'ajout), USA → BF : frais ajoutés
  const totalWithFees = isBFtoUSA ? financial.amountSent : financial.amountSent + financial.fees;

  // Validation des étapes
  const isStep1Valid = sender.firstName && sender.lastName && sender.phone && sender.country;
  const isStep2Valid = beneficiary.firstName && beneficiary.lastName && beneficiary.phone && beneficiary.country && beneficiary.city;
  const isStep3Valid = financial.amountSent > 0 && financial.exchangeRate > 0;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /** Frais réellement envoyés : pour USA→BF on lit le champ texte (source de vérité affichée), évite tout décalage avec `financial.fees`. */
  const getFeesForApi = (): number => {
    if (isBFtoUSA) return financial.fees;
    if (isUSAtoBF) {
      const raw = feesText.replace(/\s/g, '').replace(',', '.');
      if (raw === '' || raw === '.') return financial.fees;
      const n = parseFloat(raw);
      return Number.isFinite(n) && n >= 0 ? n : financial.fees;
    }
    return financial.fees;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const feesForApi = getFeesForApi();

      const transferData: any = {
        sender: {
          firstName: sender.firstName,
          lastName: sender.lastName,
          phone: sender.phone,
          email: sender.email || undefined,
          country: sender.country
        },
        beneficiary: {
          firstName: beneficiary.firstName,
          lastName: beneficiary.lastName,
          phone: beneficiary.phone,
          country: beneficiary.country,
          city: beneficiary.city,
          idType: beneficiary.idType !== 'none' ? beneficiary.idType : undefined,
          idNumber: beneficiary.idNumber || undefined
        },
        amountSent: financial.amountSent,
        currency: financial.currency,
        exchangeRate: financial.exchangeRate,
        sendMethod: sender.sendMethod,
        currencyReceived: currencyReceived
      };
      
      if (isBFtoUSA) {
        // BF → USA : frais calculés par la marge du taux (toujours envoyés)
        transferData.fees = feesForApi;
        transferData.feeCurrency = 'USD';
      } else {
        // USA → BF : valeur affichée / saisie (grille = indicative uniquement côté API à jour)
        transferData.fees = feesForApi;
      }

      const result = await transfersAPI.create(transferData, beneficiaryIdProofFile);
      setTransactionRef(result.reference);
      setCurrentStep(5); // Étape de succès
    } catch (error: any) {
      console.error('Erreur création transfert:', error);
      const errorMessage = error.message || 'Erreur lors de la création du transfert';
      
      // Vérifier si c'est une erreur de connexion
      if (errorMessage.includes('connecter au serveur') || errorMessage.includes('Failed to fetch')) {
        alert('❌ Impossible de se connecter au serveur.\n\nVérifiez que le backend est démarré et accessible.\n\nErreur: ' + errorMessage);
      } else {
        alert('❌ Erreur: ' + errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transactionRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSendCountryFlag = () => {
    const country = COUNTRIES_SEND.find(c => c.code === sender.country);
    return country?.flag || '🌍';
  };

  const getReceiveCountryFlag = () => {
    const country = COUNTRIES_RECEIVE.find(c => c.code === beneficiary.country);
    return country?.flag || '🌍';
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 py-2 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Nouvelle Transaction</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Agent: {user.name} • {user.country || 'Non défini'}
        </p>
      </div>

      {/* Stepper - Responsive */}
      {currentStep <= 4 && (
        <div className="mb-4 sm:mb-8 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center justify-between min-w-[320px] sm:min-w-0">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-9 h-9 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : ''}
                      ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6" /> : <Icon className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6" />}
                    </div>
                    <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm font-medium text-center ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 rounded ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8">
        
        {/* ÉTAPE 1: Informations de l'expéditeur */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations de l'expéditeur</h2>
                <p className="text-sm text-gray-500">Personne qui envoie l'argent</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Choisir un expéditeur existant (liste)
              </label>
              <select
                value={selectedSenderId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedSenderId(id);
                  if (id) {
                    const s = sendersList.find((x) => x.id === id);
                    if (s) {
                      const c = s.country || sender.country;
                      setSender({
                        ...sender,
                        firstName: s.firstName,
                        lastName: s.lastName,
                        phone: s.phone,
                        email: s.email || '',
                        country: c,
                        sendMethod: getDefaultSendMethodForCountry(c),
                      });
                    }
                  }
                }}
                disabled={loadingSenders}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
              >
                <option value="">— Nouveau (saisie manuelle) —</option>
                {sendersList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} — {s.phone}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                En dessous : tapez prénom, nom ou téléphone — des propositions apparaissent automatiquement.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={sender.firstName}
                      onChange={(e) => {
                        setSelectedSenderId(null);
                        setSender({ ...sender, firstName: e.target.value });
                        setSenderSuggestionsOpen(true);
                      }}
                      onFocus={() => setSenderSuggestionsOpen(true)}
                      autoComplete="off"
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={sender.lastName}
                      onChange={(e) => {
                        setSelectedSenderId(null);
                        setSender({ ...sender, lastName: e.target.value });
                        setSenderSuggestionsOpen(true);
                      }}
                      onFocus={() => setSenderSuggestionsOpen(true)}
                      autoComplete="off"
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                {debouncedSenderSearch.length >= 2 && senderSuggestionsOpen && (
                  <div
                    className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-emerald-200 bg-white shadow-lg max-h-56 overflow-y-auto"
                    role="listbox"
                  >
                    {senderTypeaheadLoading && (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        Recherche…
                      </div>
                    )}
                    {!senderTypeaheadLoading &&
                      senderTypeahead.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          role="option"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-50 border-b border-gray-100 last:border-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySenderSuggestion(s)}
                        >
                          <span className="font-medium text-gray-900">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="text-gray-600"> — {s.phone}</span>
                          {s.email ? (
                            <span className="text-gray-500"> · {s.email}</span>
                          ) : null}
                        </button>
                      ))}
                    {!senderTypeaheadLoading && senderTypeahead.length === 0 && (
                      <div className="px-3 py-2.5 text-sm text-gray-500">Aucun expéditeur trouvé pour cette recherche.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={sender.phone}
                  onChange={(e) => {
                    setSelectedSenderId(null);
                    setSender({ ...sender, phone: e.target.value });
                    setSenderSuggestionsOpen(true);
                  }}
                  onFocus={() => setSenderSuggestionsOpen(true)}
                  autoComplete="off"
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email (optionnel)
              </label>
              <input
                type="email"
                value={sender.email}
                onChange={(e) => {
                  setSelectedSenderId(null);
                  setSender({ ...sender, email: e.target.value });
                }}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="john.smith@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Pays d'envoi * {user && (isAgentBF(user.country) ? '(Burkina Faso)' : '(États-Unis)')}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {getSenderCountriesForAgent(user?.country).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSender({ ...sender, country: country.code })}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation ${
                      sender.country === country.code
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{country.flag}</span>
                    <p className="text-xs sm:text-sm font-medium mt-1 truncate">{country.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{country.currency}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Mode de paiement *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {getSendMethodsForSenderCountry(sender.country).map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSender({ ...sender, sendMethod: method.id as any })}
                      className={`p-2.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center touch-manipulation ${
                        sender.sendMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${sender.sendMethod === method.id ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <span className="text-[10px] sm:text-sm font-medium mt-1.5 sm:mt-2 text-center">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Informations du bénéficiaire */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations du bénéficiaire</h2>
                <p className="text-sm text-gray-500">Personne qui reçoit l'argent</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Choisir un bénéficiaire existant (liste)
              </label>
              <select
                value={selectedBeneficiaryId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedBeneficiaryId(id);
                  if (id) {
                    const b = beneficiariesList.find((x) => x.id === id);
                    if (b)
                      setBeneficiary({
                        ...beneficiary,
                        firstName: b.firstName,
                        lastName: b.lastName,
                        phone: b.phone,
                        country: beneficiary.country,
                        city: b.city || '',
                        idType: mapApiIdTypeToForm((b as { idType?: string }).idType),
                        idNumber: (b as { idNumber?: string }).idNumber || '',
                      });
                  }
                }}
                disabled={loadingBeneficiaries}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
              >
                <option value="">— Nouveau (saisie manuelle) —</option>
                {beneficiariesList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.firstName} {b.lastName} — {b.phone} {b.city ? `(${b.city})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                En dessous : tapez prénom, nom ou téléphone — des propositions apparaissent automatiquement (base en ligne).
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={beneficiary.firstName}
                      onChange={(e) => {
                        setSelectedBeneficiaryId(null);
                        setBeneficiary({ ...beneficiary, firstName: e.target.value });
                        setBeneficiarySuggestionsOpen(true);
                      }}
                      onFocus={() => setBeneficiarySuggestionsOpen(true)}
                      autoComplete="off"
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="Amadou"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={beneficiary.lastName}
                      onChange={(e) => {
                        setSelectedBeneficiaryId(null);
                        setBeneficiary({ ...beneficiary, lastName: e.target.value });
                        setBeneficiarySuggestionsOpen(true);
                      }}
                      onFocus={() => setBeneficiarySuggestionsOpen(true)}
                      autoComplete="off"
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="Ouédraogo"
                    />
                  </div>
                </div>

                {debouncedBeneficiarySearch.length >= 2 && beneficiarySuggestionsOpen && (
                  <div
                    className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-blue-200 bg-white shadow-lg max-h-56 overflow-y-auto"
                    role="listbox"
                  >
                    {beneficiaryTypeaheadLoading && (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        Recherche…
                      </div>
                    )}
                    {!beneficiaryTypeaheadLoading &&
                      beneficiaryTypeahead.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          role="option"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyBeneficiarySuggestion(b)}
                        >
                          <span className="font-medium text-gray-900">
                            {b.firstName} {b.lastName}
                          </span>
                          <span className="text-gray-600"> — {b.phone}</span>
                          {b.city ? (
                            <span className="text-gray-500"> · {b.city}</span>
                          ) : null}
                        </button>
                      ))}
                    {!beneficiaryTypeaheadLoading && beneficiaryTypeahead.length === 0 && (
                      <div className="px-3 py-2.5 text-sm text-gray-500">Aucun bénéficiaire trouvé pour cette recherche.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={beneficiary.phone}
                  onChange={(e) => {
                    setSelectedBeneficiaryId(null);
                    setBeneficiary({ ...beneficiary, phone: e.target.value });
                    setBeneficiarySuggestionsOpen(true);
                  }}
                  onFocus={() => setBeneficiarySuggestionsOpen(true)}
                  autoComplete="off"
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="+226 70 12 34 56"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Type de pièce d'identité
                </label>
                <select
                  value={beneficiary.idType}
                  onChange={(e) => setBeneficiary({ ...beneficiary, idType: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white"
                >
                  <option value="none">Non fourni</option>
                  <option value="national_id">Carte d'identité nationale</option>
                  <option value="passport">Passeport</option>
                  <option value="driver_license">Permis de conduire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Numéro de pièce
                </label>
                <input
                  type="text"
                  value={beneficiary.idNumber}
                  onChange={(e) => setBeneficiary({ ...beneficiary, idNumber: e.target.value })}
                  disabled={beneficiary.idType === 'none'}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-base"
                  placeholder="B1234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Scan / photo de la pièce d&apos;identité (optionnel)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                JPG, PNG ou PDF — max. 5 Mo. Le fichier est associé au bénéficiaire pour ce transfert.
              </p>
              {!beneficiaryIdProofFile ? (
                <label className="flex flex-col sm:flex-row sm:items-center gap-2 cursor-pointer">
                  <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors w-full sm:w-auto">
                    Choisir un fichier
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setBeneficiaryIdProofFile(f ?? null);
                      e.target.value = '';
                    }}
                  />
                </label>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                  <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="text-sm text-gray-800 truncate flex-1 min-w-0">{beneficiaryIdProofFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setBeneficiaryIdProofFile(null)}
                    className="p-1.5 rounded-lg text-gray-600 hover:bg-white/80 hover:text-red-600 transition-colors"
                    aria-label="Retirer le fichier"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pays de réception *
              </label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {getReceiverCountriesForAgent(user?.country).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setBeneficiary({ ...beneficiary, country: country.code })}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation ${
                      beneficiary.country === country.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{country.flag}</span>
                    <p className="text-xs sm:text-sm font-medium mt-1 truncate">{country.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{country.currency}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={beneficiary.city}
                onChange={(e) => setBeneficiary({ ...beneficiary, city: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Ouagadougou"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Informations financières */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations financières</h2>
                <p className="text-sm text-gray-500">Montant et taux de change</p>
              </div>
            </div>

            {/* Résumé des acteurs - Mobile optimized */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{getSendCountryFlag()}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{sender.firstName} {sender.lastName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{sender.phone}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mx-1" />
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end">
                  <div className="text-right min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{beneficiary.firstName} {beneficiary.lastName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{beneficiary.city}</p>
                  </div>
                  <span className="text-xl sm:text-2xl flex-shrink-0">{getReceiveCountryFlag()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Montant à envoyer *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={financial.amountSent || ''}
                    onChange={(e) => setFinancial({ ...financial, amountSent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xl sm:text-2xl font-bold pr-16"
                    placeholder="100"
                  />
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                    {financial.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  {isBFtoUSA ? 'Taux paiement' : 'Taux'} ({sender.country === 'USA' ? `1 ${financial.currency} = X XOF` : `1 XOF = X ${currencyReceived}`})
                </label>
                {liveRateDetails && isBFtoUSA && (
                  <p className="text-xs text-gray-500 mb-1">Taux réel : {liveRateDetails.rateReel} · Majoration : +{(financial.exchangeRate - liveRateDetails.rateReel).toLocaleString()}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={financial.exchangeRate}
                    onChange={(e) => setFinancial({ 
                      ...financial, 
                      exchangeRate: parseFloat(e.target.value) || 0,
                      useAutoRate: false 
                    })}
                    className="flex-1 px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg sm:text-xl font-bold min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFinancial({ 
                        ...financial, 
                        exchangeRate: effectiveAutoRate,
                        useAutoRate: true 
                      });
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation flex-shrink-0 ${
                      financial.useAutoRate 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Calculs automatiques - Mobile optimized */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2 sm:mb-4">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Calcul automatique</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500">Montant envoyé</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {financial.amountSent.toLocaleString()} <span className="text-sm sm:text-base">{financial.currency}</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Frais {isBFtoUSA && <span className="text-gray-400">(marge taux)</span>}
                    </p>
                    {feesManuallyEdited && !isBFtoUSA && (
                      <button
                        type="button"
                        onClick={() => {
                          setFinancial(prev => ({ ...prev, fees: computeAutoFees() }));
                          setFeesManuallyEdited(false);
                        }}
                        className="text-[10px] sm:text-xs text-emerald-600 hover:text-emerald-700 underline"
                        title="Réinitialiser aux frais automatiques"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isBFtoUSA ? (
                      <span className="text-lg sm:text-2xl font-bold text-amber-600">
                        {financial.fees.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={feesText}
                        onFocus={() => setFeesManuallyEdited(true)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFeesText(v);
                          setFeesManuallyEdited(true);
                          const raw = v.replace(/\s/g, '').replace(',', '.');
                          if (raw === '' || raw === '.') {
                            setFinancial((prev) => ({ ...prev, fees: 0 }));
                            return;
                          }
                          const n = parseFloat(raw);
                          if (Number.isFinite(n) && n >= 0) {
                            setFinancial((prev) => ({ ...prev, fees: n }));
                          }
                        }}
                        onBlur={() => {
                          const raw = feesText.replace(/\s/g, '').replace(',', '.');
                          if (raw === '' || raw === '.') {
                            setFeesText('0');
                            setFinancial((prev) => ({ ...prev, fees: 0 }));
                            return;
                          }
                          const n = parseFloat(raw);
                          if (!Number.isFinite(n) || n < 0) {
                            setFeesText(String(financial.fees));
                            return;
                          }
                          setFeesText(String(n));
                          setFinancial((prev) => ({ ...prev, fees: n }));
                        }}
                        className="text-lg sm:text-2xl font-bold text-amber-600 bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      />
                    )}
                    <span className="text-sm sm:text-base text-amber-600">{feeCurrency}</span>
                  </div>
                  {!isBFtoUSA && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      Grille indicative : {computeAutoFees().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {feeCurrency} — montant libre
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Total payé par l'expéditeur</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {totalWithFees.toLocaleString()} {financial.currency}
                </p>
              </div>

              <div className="bg-emerald-600 rounded-xl p-4 sm:p-6 text-white">
                <p className="text-xs sm:text-sm text-emerald-100">Montant à remettre au bénéficiaire</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {amountReceived.toLocaleString()} <span className="text-lg sm:text-xl">{currencyReceived}</span>
                </p>
                <p className="text-xs sm:text-sm text-emerald-100 mt-2">
                  {isUSAtoBF 
                    ? `Taux: 1 ${financial.currency} = ${financial.exchangeRate.toLocaleString()} XOF`
                    : `Taux paiement: 1 USD = ${financial.exchangeRate.toLocaleString()} XOF`
                  }
                  {liveRateDetails && isBFtoUSA && (
                    <span className="block mt-0.5 text-emerald-200/90">
                      (réel {liveRateDetails.rateReel} + marge {(financial.exchangeRate - liveRateDetails.rateReel).toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Confirmation</h2>
                <p className="text-sm text-gray-500">Vérifiez avant de valider</p>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {/* Expéditeur */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-lg sm:text-xl">{getSendCountryFlag()}</span>
                  Expéditeur
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p><span className="text-gray-500">Nom:</span> {sender.firstName} {sender.lastName}</p>
                  <p><span className="text-gray-500">Tél:</span> {sender.phone}</p>
                  {sender.email && <p className="truncate"><span className="text-gray-500">Email:</span> {sender.email}</p>}
                  <p><span className="text-gray-500">Pays:</span> {COUNTRIES_SEND.find(c => c.code === sender.country)?.name}</p>
                  <p><span className="text-gray-500">Paiement:</span> {getSendMethodsForSenderCountry(sender.country).find(m => m.id === sender.sendMethod)?.label}</p>
                </div>
              </div>

              {/* Bénéficiaire */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="text-lg sm:text-xl">{getReceiveCountryFlag()}</span>
                  Bénéficiaire
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p><span className="text-gray-500">Nom:</span> {beneficiary.firstName} {beneficiary.lastName}</p>
                  <p><span className="text-gray-500">Tél:</span> {beneficiary.phone}</p>
                  <p><span className="text-gray-500">Ville:</span> {beneficiary.city}</p>
                  <p><span className="text-gray-500">Pays:</span> {COUNTRIES_RECEIVE.find(c => c.code === beneficiary.country)?.name}</p>
                  {beneficiary.idType !== 'none' && (
                    <p><span className="text-gray-500">ID:</span> {beneficiary.idNumber}</p>
                  )}
                  {beneficiaryIdProofFile && (
                    <p className="truncate">
                      <span className="text-gray-500">Pièce jointe:</span> {beneficiaryIdProofFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Taux de change */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                Taux de change
              </h3>
              {isBFtoUSA && liveRateDetails ? (
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taux réel</span>
                    <span className="font-semibold text-gray-900">1 USD = {liveRateDetails.rateReel.toLocaleString('fr-FR')} XOF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Majoration</span>
                    <span className="font-semibold text-amber-600">+ {(financial.exchangeRate - liveRateDetails.rateReel).toLocaleString('fr-FR')} XOF</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-700 font-medium">Taux paiement</span>
                    <span className="font-bold text-emerald-700">1 USD = {financial.exchangeRate.toLocaleString('fr-FR')} XOF</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Taux appliqué</span>
                  <span className="font-bold text-gray-900">1 USD = {financial.exchangeRate.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}
            </div>

            {/* Montants */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <p className="text-[10px] sm:text-sm text-emerald-100">Envoyé</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{financial.amountSent.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-200">{financial.currency}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-emerald-100">Frais</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{financial.fees.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-200">{feeCurrency}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-emerald-100">À remettre</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{amountReceived.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-200">{currencyReceived}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 text-center">
                <p className="text-xs sm:text-sm text-emerald-100">Total payé</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalWithFees.toLocaleString()} {financial.currency}</p>
              </div>
            </div>

            {/* Agent créateur */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Créé par</p>
                <p className="font-medium text-sm sm:text-base truncate">{user.name} • {new Date().toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Succès */}
        {currentStep === 5 && (
          <div className="text-center py-4 sm:py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Transaction créée!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">En attente de paiement par l'agent local.</p>

            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md mx-auto mb-4 sm:mb-8">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Numéro de référence</p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-emerald-600 break-all">{transactionRef}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-2 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                  title="Copier"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Communiquez cette référence au bénéficiaire</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-4 sm:mb-8">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">EN ATTENTE DE PAIEMENT</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
              <button
                onClick={() => navigate('/transfers')}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation order-2 sm:order-1"
              >
                Voir les transferts
              </button>
              <button
                onClick={() => {
                  const { send, receive } = getDefaultCountriesByAgent(user?.country);
                  setCurrentStep(1);
                  setSender({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    country: send,
                    sendMethod: getDefaultSendMethodForCountry(send),
                  });
                  setBeneficiary({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    idType: 'none',
                    idNumber: '',
                    country: receive,
                    city: '',
                  });
                  setFinancial({
                    amountSent: 0,
                    currency: send === 'BFA' ? 'XOF' : 'USD',
                    exchangeRate: effectiveAutoRate,
                    useAutoRate: true,
                    fees: 0,
                  });
                  setFeesManuallyEdited(false);
                  setFeesText('0');
                  setTransactionRef('');
                }}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 touch-manipulation order-1 sm:order-2"
              >
                <Send className="w-5 h-5" />
                Nouvelle transaction
              </button>
            </div>
          </div>
        )}

        {/* Navigation - Mobile optimized with sticky bottom on mobile */}
        {currentStep <= 4 && (
          <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden xs:inline">Retour</span>
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <span>Suivant</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 sm:px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Création...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Créer la transaction</span>
                    <span className="sm:hidden">Créer</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
