export enum WalletType {
  VESTING = 'Vesting Contract',
  MULTISIG = 'Multisig Wallet',
  GNOSIS = 'Gnosis Safe',
  TREASURY = 'Treasury Wallet',
  LARGE_HOLDER = 'Large Holder',
  CEX = 'CEX Wallet',
  DEX = 'DEX Pool',
  UNKNOWN = 'Unknown',
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum AlertSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum AlertStatus {
  NEW = 'New',
  REVIEWED = 'Reviewed',
  IGNORED = 'Ignored',
}

export interface Wallet {
  id: string;
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

export enum AlertRuleType {
  BALANCE_ABOVE = 'Balance Above',
  BALANCE_BELOW = 'Balance Below',
  LARGE_TRANSFER = 'Large Transfer',
  HIGH_FREQUENCY = 'High Frequency',
}

export interface AlertRule {
  id: string;
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
