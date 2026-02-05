import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

// Taux de change mockés
const EXCHANGE_RATES: Record<string, number> = {
  'USD_XOF': 615,
  'EUR_XOF': 655.957,
  'CAD_XOF': 450,
  'GBP_XOF': 780,
};

// Frais selon le montant
const calculateFees = (amount: number, currency: string): number => {
  if (amount <= 100) return currency === 'USD' ? 5 : currency === 'EUR' ? 4 : 5;
  if (amount <= 500) return currency === 'USD' ? 10 : currency === 'EUR' ? 8 : 10;
  if (amount <= 1000) return currency === 'USD' ? 15 : currency === 'EUR' ? 12 : 15;
  return Math.round(amount * 0.015); // 1.5% pour les gros montants
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
  { code: 'FRA', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'CAN', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'GBR', name: 'Royaume-Uni', currency: 'GBP', flag: '🇬🇧' },
];

const COUNTRIES_RECEIVE = [
  { code: 'BFA', name: 'Burkina Faso', currency: 'XOF', flag: '🇧🇫' },
  { code: 'CIV', name: 'Côte d\'Ivoire', currency: 'XOF', flag: '🇨🇮' },
  { code: 'MLI', name: 'Mali', currency: 'XOF', flag: '🇲🇱' },
  { code: 'SEN', name: 'Sénégal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'TGO', name: 'Togo', currency: 'XOF', flag: '🇹🇬' },
  { code: 'BEN', name: 'Bénin', currency: 'XOF', flag: '🇧🇯' },
  { code: 'NER', name: 'Niger', currency: 'XOF', flag: '🇳🇪' },
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

  // Calculer les frais automatiquement
  useEffect(() => {
    if (financial.amountSent > 0) {
      const fees = calculateFees(financial.amountSent, financial.currency);
      setFinancial(prev => ({ ...prev, fees }));
    }
  }, [financial.amountSent, financial.currency]);

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
    
    // Simuler l'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Générer la référence
    const ref = generateReference();
    setTransactionRef(ref);
    setIsSubmitting(false);
    setCurrentStep(5); // Étape de succès
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle Transaction</h1>
        <p className="text-gray-600 mt-1">
          Agent: {user.name} • {user.country || 'Non défini'}
        </p>
      </div>

      {/* Stepper */}
      {currentStep <= 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : ''}
                      ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        
        {/* ÉTAPE 1: Informations de l'expéditeur */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informations de l'expéditeur</h2>
                <p className="text-gray-500">Personne qui envoie l'argent</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={sender.firstName}
                  onChange={(e) => setSender({ ...sender, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={sender.lastName}
                  onChange={(e) => setSender({ ...sender, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={sender.phone}
                  onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={sender.email}
                  onChange={(e) => setSender({ ...sender, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john.smith@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Pays d'envoi *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COUNTRIES_SEND.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSender({ ...sender, country: country.code })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      sender.country === country.code
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <p className="text-sm font-medium mt-1">{country.name}</p>
                    <p className="text-xs text-gray-500">{country.currency}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Mode de paiement *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {SEND_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSender({ ...sender, sendMethod: method.id as any })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                        sender.sendMethod === method.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${sender.sendMethod === method.id ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium mt-2">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Informations du bénéficiaire */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informations du bénéficiaire</h2>
                <p className="text-gray-500">Personne qui reçoit l'argent</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={beneficiary.firstName}
                  onChange={(e) => setBeneficiary({ ...beneficiary, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amadou"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={beneficiary.lastName}
                  onChange={(e) => setBeneficiary({ ...beneficiary, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ouédraogo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Téléphone *
              </label>
              <input
                type="tel"
                value={beneficiary.phone}
                onChange={(e) => setBeneficiary({ ...beneficiary, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+226 70 12 34 56"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Type de pièce d'identité (optionnel)
                </label>
                <select
                  value={beneficiary.idType}
                  onChange={(e) => setBeneficiary({ ...beneficiary, idType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Non fourni</option>
                  <option value="national_id">Carte d'identité nationale</option>
                  <option value="passport">Passeport</option>
                  <option value="driver_license">Permis de conduire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de pièce
                </label>
                <input
                  type="text"
                  value={beneficiary.idNumber}
                  onChange={(e) => setBeneficiary({ ...beneficiary, idNumber: e.target.value })}
                  disabled={beneficiary.idType === 'none'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="B1234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pays de réception *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COUNTRIES_RECEIVE.slice(0, 4).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setBeneficiary({ ...beneficiary, country: country.code })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      beneficiary.country === country.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <p className="text-sm font-medium mt-1">{country.name}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {COUNTRIES_RECEIVE.slice(4).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setBeneficiary({ ...beneficiary, country: country.code })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      beneficiary.country === country.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <p className="text-xs font-medium mt-1">{country.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={beneficiary.city}
                onChange={(e) => setBeneficiary({ ...beneficiary, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ouagadougou"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Informations financières */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informations financières</h2>
                <p className="text-gray-500">Montant et taux de change</p>
              </div>
            </div>

            {/* Résumé des acteurs */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getSendCountryFlag()}</span>
                <div>
                  <p className="font-medium">{sender.firstName} {sender.lastName}</p>
                  <p className="text-sm text-gray-500">{sender.phone}</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium">{beneficiary.firstName} {beneficiary.lastName}</p>
                  <p className="text-sm text-gray-500">{beneficiary.city}</p>
                </div>
                <span className="text-2xl">{getReceiveCountryFlag()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à envoyer *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={financial.amountSent || ''}
                    onChange={(e) => setFinancial({ ...financial, amountSent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-2xl font-bold"
                    placeholder="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {financial.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de change (1 {financial.currency} = X FCFA)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={financial.exchangeRate}
                    onChange={(e) => setFinancial({ 
                      ...financial, 
                      exchangeRate: parseFloat(e.target.value) || 0,
                      useAutoRate: false 
                    })}
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xl font-bold"
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      financial.useAutoRate 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Calculs automatiques */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-4">
                <Calculator className="w-5 h-5" />
                <span className="font-semibold">Calcul automatique</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-gray-500">Montant envoyé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {financial.amountSent.toLocaleString()} {financial.currency}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-gray-500">Frais de transfert</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {financial.fees.toLocaleString()} {financial.currency}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Total payé par l'expéditeur</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalWithFees.toLocaleString()} {financial.currency}
                </p>
              </div>

              <div className="bg-emerald-600 rounded-xl p-6 text-white">
                <p className="text-sm text-emerald-100">Montant à remettre au bénéficiaire</p>
                <p className="text-4xl font-bold">
                  {amountReceived.toLocaleString()} FCFA
                </p>
                <p className="text-sm text-emerald-100 mt-2">
                  Taux appliqué: 1 {financial.currency} = {financial.exchangeRate.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Confirmation de la transaction</h2>
                <p className="text-gray-500">Vérifiez les informations avant de valider</p>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expéditeur */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">{getSendCountryFlag()}</span>
                  Expéditeur
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Nom:</span> {sender.firstName} {sender.lastName}</p>
                  <p><span className="text-gray-500">Téléphone:</span> {sender.phone}</p>
                  {sender.email && <p><span className="text-gray-500">Email:</span> {sender.email}</p>}
                  <p><span className="text-gray-500">Pays:</span> {COUNTRIES_SEND.find(c => c.code === sender.country)?.name}</p>
                  <p><span className="text-gray-500">Mode de paiement:</span> {SEND_METHODS.find(m => m.id === sender.sendMethod)?.label}</p>
                </div>
              </div>

              {/* Bénéficiaire */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">{getReceiveCountryFlag()}</span>
                  Bénéficiaire
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Nom:</span> {beneficiary.firstName} {beneficiary.lastName}</p>
                  <p><span className="text-gray-500">Téléphone:</span> {beneficiary.phone}</p>
                  <p><span className="text-gray-500">Ville:</span> {beneficiary.city}</p>
                  <p><span className="text-gray-500">Pays:</span> {COUNTRIES_RECEIVE.find(c => c.code === beneficiary.country)?.name}</p>
                  {beneficiary.idType !== 'none' && (
                    <p><span className="text-gray-500">Pièce ID:</span> {beneficiary.idNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Montants */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-emerald-100">Montant envoyé</p>
                  <p className="text-2xl font-bold">{financial.amountSent.toLocaleString()} {financial.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100">Frais</p>
                  <p className="text-2xl font-bold">{financial.fees.toLocaleString()} {financial.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100">Montant à remettre</p>
                  <p className="text-2xl font-bold">{amountReceived.toLocaleString()} FCFA</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 text-center">
                <p className="text-sm text-emerald-100">Total payé par l'expéditeur</p>
                <p className="text-3xl font-bold">{totalWithFees.toLocaleString()} {financial.currency}</p>
              </div>
            </div>

            {/* Agent créateur */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Créé par</p>
                <p className="font-medium">{user.name} • {new Date().toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Succès */}
        {currentStep === 5 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction créée avec succès!</h2>
            <p className="text-gray-600 mb-6">La transaction est en attente de paiement par l'agent local.</p>

            <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto mb-8">
              <p className="text-sm text-gray-500 mb-2">Numéro de référence</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-emerald-600">{transactionRef}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copier"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Communiquez cette référence au bénéficiaire</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center gap-2 text-amber-700">
                <Hash className="w-5 h-5" />
                <span className="font-medium">Statut: EN ATTENTE DE PAIEMENT</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/transfers')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
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
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Nouvelle transaction
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep <= 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Créer la transaction
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
