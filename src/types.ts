export const WalletType = {
  VESTING: 'Vesting Contract',
  MULTISIG: 'Multisig Wallet',
  GNOSIS: 'Gnosis Safe',
  TREASURY: 'Treasury Wallet',
  LARGE_HOLDER: 'Large Holder',
  CEX: 'CEX Wallet',
  DEX: 'DEX Pool',
  UNKNOWN: 'Unknown',
} as const;
export type WalletType = typeof WalletType[keyof typeof WalletType];

export const RiskLevel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

export const AlertSeverity = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const AlertStatus = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  IGNORED: 'Ignored',
} as const;
export type AlertStatus = typeof AlertStatus[keyof typeof AlertStatus];

// ... inside Transaction interface ...
// (Wait, I should replace them one by one if they are scattered, but they are at the top)

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  label: string;
  walletType: WalletType;
  isActive: boolean;
  alertsEnabled: boolean;
  naorisBalance: string;
  ethBalance: string;
  lastActivityAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  amountRaw: string;
  amountFormatted: number;
  percentTotalSupply: number;
  tokenContract: string;
  direction: 'Inbound' | 'Outbound';
  riskLevel: RiskLevel;
  status: 'Confirmed' | 'Pending';
  usdValue?: number;
  walletLabel?: string;
}

export const AlertRuleType = {
  BALANCE_ABOVE: 'Balance Above',
  BALANCE_BELOW: 'Balance Below',
  LARGE_TRANSFER: 'Large Transfer',
  HIGH_FREQUENCY: 'High Frequency',
} as const;
export type AlertRuleType = typeof AlertRuleType[keyof typeof AlertRuleType];

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  ruleType: AlertRuleType;
  threshold: number;
  comparison: 'greater_than' | 'less_than';
  severity: AlertSeverity;
  isActive: boolean;
  targetWalletId?: string; // Optional: specific wallet, or all if null
  createdAt: number;
  updatedAt: number;
}

export interface Alert {
  id: string;
  userId: string;
  alertType: string;
  severity: AlertSeverity;
  walletAddress: string;
  walletLabel: string;
  txHash: string;
  amount: number;
  reason: string;
  recommendedAction: string;
  status: AlertStatus;
  createdAt: number;
  // Professional Telemetry
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  networkHealth?: string;
}

export interface NotificationSettings {
  userId: string;
  inApp: boolean;
  email: {
    enabled: boolean;
    recipient: string;
  };
  telegram: {
    enabled: boolean;
    chatId: string;
  };
  discord: {
    enabled: boolean;
    webhookUrl: string;
  };
  minSeverity: AlertSeverity;
}

export interface RiskScore {
  score: number; // 0-1000
  lastUpdated: number;
  factors: {
    label: string;
    impact: number;
  }[];
}
