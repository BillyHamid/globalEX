# 💱 GLOBAL EXCHANGE - Plateforme de Gestion de Transferts

Application web de gestion de transferts d'argent entre agents internationaux, avec suivi complet des transactions, notifications automatiques et confirmation de paiement au bénéficiaire.

## 📌 Description

Le système permet :
- La création de transactions par un agent expéditeur
- La notification automatique de l'agent local
- La validation du paiement
- L'archivage et la traçabilité des opérations

## 🎯 Objectifs

- ✅ Digitaliser le processus de transfert
- ✅ Éviter les pertes d'information
- ✅ Suivre toutes les transactions
- ✅ Notifier automatiquement les agents
- ✅ Sécuriser la remise d'argent

## 🚀 Technologies

- **React 18** avec **TypeScript**
- **Vite** pour le build et le développement
- **React Router** pour la navigation
- **Tailwind CSS** pour le style
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes

## 👥 Acteurs du système

| Rôle | Description |
|------|-------------|
| **Administrateur** | Gestion complète du système, utilisateurs, paramètres |
| **Agent Expéditeur** | Création des transactions de transfert (ex: USA) |
| **Agent Payeur** | Réception et paiement des transferts (ex: Burkina Faso) |
| **Superviseur** | Supervision des opérations et validation |

## ⚙️ Fonctionnalités principales

### ✅ Gestion des transactions
- Création de transaction avec référence unique
- Calcul automatique montant + frais
- Suivi de statut en temps réel
- Historique complet

### ✅ Notifications
- Notification à l'agent payeur lors d'un nouveau transfert
- Notification après confirmation de paiement
- Notifications via WhatsApp / Push (prévues)

### ✅ Confirmation de paiement
- Vérification du bénéficiaire
- Enregistrement du paiement
- Preuve de remise d'argent
- Changement de statut automatique

### ✅ Tableau de bord
- Transactions en attente
- Transactions payées
- Statistiques journalières
- Suivi des agents

## 🔄 Flux de transaction

```
1. Agent USA crée transaction
2. Transaction en attente
3. Notification agent Burkina
4. Bénéficiaire se présente
5. Vérification identité
6. Paiement effectué
7. Confirmation par agent
8. Notification envoyée
9. Archivage transaction
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

## 🔑 Comptes de démonstration

Connectez-vous avec n'importe quel de ces emails (n'importe quel mot de passe fonctionne pour la démo) :

| Email | Rôle |
|-------|------|
| `admin@globalexchange.com` | Administrateur |
| `superviseur@globalexchange.com` | Superviseur |
| `agent.usa@globalexchange.com` | Agent Expéditeur (USA) |
| `agent.burkina@globalexchange.com` | Agent Payeur (Burkina Faso) |
| `agent.france@globalexchange.com` | Agent Expéditeur (France) |
| `agent.cote@globalexchange.com` | Agent Payeur (Côte d'Ivoire) |

## 📁 Structure du projet

```
src/
├── components/
│   ├── Layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopNavbar.tsx
│   ├── common/
│   │   ├── DataTable.tsx
│   │   ├── KPICard.tsx
│   │   └── StatusBadge.tsx
│   └── transfers/
│       └── TransferManager.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Transfers.tsx
│   ├── Agents.tsx
│   ├── Beneficiaries.tsx
│   └── Reports.tsx
├── types/
│   └── index.ts
├── utils/
│   └── roleConfig.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 🔐 Sécurité

- Authentification des agents
- Journal des actions
- Historique des transactions
- Permissions par rôle (RBAC)

## 📝 Notes

- Cette application est une **simulation frontend uniquement** (MVP)
- Les données sont **mockées** (pas de backend pour l'instant)
- L'authentification est **simulée** (pas de sécurité réelle)
- Parfait pour démonstration et prototypage

## 🚧 Évolutions futures

- [ ] Backend API (Node.js / NestJS)
- [ ] Base de données PostgreSQL
- [ ] Intégration WhatsApp API
- [ ] Notifications Push
- [ ] Application mobile
