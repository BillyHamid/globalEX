import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { transfersAPI } from '@/services/api';
import { 
  ArrowLeft, ArrowRight, User, Phone, Mail, MapPin, 
  DollarSign, Calculator, CheckCircle, Send, Copy,
  CreditCard, Smartphone, Banknote, Hash, Calendar,
  Building, Globe, FileText
} from 'lucide-react';

// Types pour le formulaire
interface SenderInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  sendMethod: 'cash' | 'zelle' | 'orange_money' | 'wave' | 'bank_transfer';
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

// Taux de change - Only USA to BF
const EXCHANGE_RATES: Record<string, number> = {
  'USD_XOF': 615,
};

// Frais selon le montant - Only USD (USA to BF only)
// Structure: 
// - $1-$100: $5
// - $101-$200: $8
// - $201-$500: $10
// - $501-$800: $15
// - $801-$1000: $20
// - >$1000: $20 par tranche de $1000
const calculateFees = (amount: number, currency: string): number => {
  // Only USD supported
  if (currency !== 'USD') {
    return 5; // Fallback
  }
  
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
};

// Générer une référence unique
const generateReference = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `GX-${year}-${random}`;
};

const STEPS = [
  { id: 1, title: 'Expéditeur', icon: User },
  { id: 2, title: 'Bénéficiaire', icon: User },
  { id: 3, title: 'Montant', icon: DollarSign },
  { id: 4, title: 'Confirmation', icon: CheckCircle },
];

const COUNTRIES_SEND = [
  { code: 'USA', name: 'États-Unis', currency: 'USD', flag: '🇺🇸' },
];

const COUNTRIES_RECEIVE = [
  { code: 'BFA', name: 'Burkina Faso', currency: 'XOF', flag: '🇧🇫' },
];

const SEND_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'zelle', label: 'Zelle', icon: Smartphone },
  { id: 'orange_money', label: 'Orange Money', icon: Smartphone },
  { id: 'wave', label: 'Wave', icon: Smartphone },
  { id: 'bank_transfer', label: 'Virement', icon: Building },
];

export const NewTransfer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [copied, setCopied] = useState(false);

  // État du formulaire
  const [sender, setSender] = useState<SenderInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    country: 'USA',
    sendMethod: 'cash',
  });

  const [beneficiary, setBeneficiary] = useState<BeneficiaryInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    idType: 'none',
    idNumber: '',
    country: 'BFA',
    city: '',
  });

  const [financial, setFinancial] = useState<FinancialInfo>({
    amountSent: 0,
    currency: 'USD',
    exchangeRate: EXCHANGE_RATES['USD_XOF'],
    useAutoRate: true,
    fees: 0,
  });
  
  const [feesManuallyEdited, setFeesManuallyEdited] = useState(false);

  // Mettre à jour la devise selon le pays d'envoi
  useEffect(() => {
    const country = COUNTRIES_SEND.find(c => c.code === sender.country);
    if (country) {
      const rateKey = `${country.currency}_XOF`;
      setFinancial(prev => ({
        ...prev,
        currency: country.currency,
        exchangeRate: prev.useAutoRate ? (EXCHANGE_RATES[rateKey] || 600) : prev.exchangeRate,
      }));
    }
  }, [sender.country]);

  // Calculer les frais automatiquement (seulement si pas modifié manuellement)
  useEffect(() => {
    if (financial.amountSent > 0 && !feesManuallyEdited) {
      const fees = calculateFees(financial.amountSent, financial.currency);
      setFinancial(prev => ({ ...prev, fees }));
    }
  }, [financial.amountSent, financial.currency, feesManuallyEdited]);

  // Calculs
  const amountReceived = Math.round(financial.amountSent * financial.exchangeRate);
  const totalWithFees = financial.amountSent + financial.fees;

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Appeler l'API backend pour créer le transfert
      const calculatedFees = calculateFees(financial.amountSent, financial.currency);
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
        sendMethod: sender.sendMethod
      };
      
      // Ajouter les frais personnalisés seulement s'ils diffèrent des frais calculés
      if (feesManuallyEdited && financial.fees !== calculatedFees) {
        transferData.fees = financial.fees;
      }

      const result = await transfersAPI.create(transferData);
      setTransactionRef(result.reference);
      setCurrentStep(5); // Étape de succès
    } catch (error: any) {
      console.error('Erreur création transfert:', error);
      const errorMessage = error.message || 'Erreur lors de la création du transfert';
      
      // Vérifier si c'est une erreur de connexion
      if (errorMessage.includes('connecter au serveur') || errorMessage.includes('Failed to fetch')) {
        alert('❌ Impossible de se connecter au serveur.\n\nVérifiez que le backend est démarré sur le port 5000.\n\nErreur: ' + errorMessage);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={sender.firstName}
                  onChange={(e) => setSender({ ...sender, firstName: e.target.value })}
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
                  onChange={(e) => setSender({ ...sender, lastName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={sender.phone}
                  onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={sender.email}
                  onChange={(e) => setSender({ ...sender, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  placeholder="john.smith@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Pays d'envoi *
              </label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {COUNTRIES_SEND.map((country) => (
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
                {SEND_METHODS.map((method) => {
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={beneficiary.firstName}
                  onChange={(e) => setBeneficiary({ ...beneficiary, firstName: e.target.value })}
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
                  onChange={(e) => setBeneficiary({ ...beneficiary, lastName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Ouédraogo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Téléphone *
              </label>
              <input
                type="tel"
                value={beneficiary.phone}
                onChange={(e) => setBeneficiary({ ...beneficiary, phone: e.target.value })}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="+226 70 12 34 56"
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pays de réception *
              </label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {COUNTRIES_RECEIVE.map((country) => (
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
                  Taux (1 {financial.currency} = X FCFA)
                </label>
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
                      const rateKey = `${financial.currency}_XOF`;
                      setFinancial({ 
                        ...financial, 
                        exchangeRate: EXCHANGE_RATES[rateKey] || 600,
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
                    <p className="text-xs sm:text-sm text-gray-500">Frais</p>
                    {feesManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          const autoFees = calculateFees(financial.amountSent, financial.currency);
                          setFinancial(prev => ({ ...prev, fees: autoFees }));
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
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={calculateFees(financial.amountSent, financial.currency)}
                      step="0.01"
                      value={financial.fees}
                      onChange={(e) => {
                        const newFees = parseFloat(e.target.value) || 0;
                        const maxFees = calculateFees(financial.amountSent, financial.currency);
                        if (newFees <= maxFees && newFees >= 0) {
                          setFinancial(prev => ({ ...prev, fees: newFees }));
                          setFeesManuallyEdited(true);
                        }
                      }}
                      className="text-lg sm:text-2xl font-bold text-amber-600 bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                    <span className="text-sm sm:text-base text-amber-600">{financial.currency}</span>
                  </div>
                  {feesManuallyEdited && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      Max: {calculateFees(financial.amountSent, financial.currency)} {financial.currency}
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
                  {amountReceived.toLocaleString()} <span className="text-lg sm:text-xl">FCFA</span>
                </p>
                <p className="text-xs sm:text-sm text-emerald-100 mt-2">
                  Taux: 1 {financial.currency} = {financial.exchangeRate.toLocaleString()} FCFA
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
                  <p><span className="text-gray-500">Paiement:</span> {SEND_METHODS.find(m => m.id === sender.sendMethod)?.label}</p>
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
                </div>
              </div>
            </div>

            {/* Montants - Mobile optimized */}
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
                  <p className="text-[10px] sm:text-xs text-emerald-200">{financial.currency}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-emerald-100">À remettre</p>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold">{amountReceived.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-200">FCFA</p>
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
                  setCurrentStep(1);
                  setSender({ firstName: '', lastName: '', phone: '', email: '', country: 'USA', sendMethod: 'cash' });
                  setBeneficiary({ firstName: '', lastName: '', phone: '', idType: 'none', idNumber: '', country: 'BFA', city: '' });
                  setFinancial({ amountSent: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD_XOF'], useAutoRate: true, fees: 0 });
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
