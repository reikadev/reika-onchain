// Chain-related types
export interface ChainData {
  blockNumber: number;
  gasPrice: string;
  timestamp: number;
}

export interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
  balance?: string;
  price?: number;
}

// Wallet-related types
export interface WalletConfig {
  privateKey: string;
  rpcUrl: string;
  chainId: number;
}

export interface TransactionConfig {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
  blockNumber?: number;
  gasUsed?: string;
}

// AI Agent types
export interface AgentConfig {
  goalMetric: "PNL" | "YIELD" | "QUEST_COMPLETION";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timeframe: number; // in seconds
  startingBalance: string;
}

export interface AgentState {
  lastAnalysis: number;
  currentBalance: string;
  performanceMetrics: {
    startTime: number;
    initialValue: string;
    currentValue: string;
    roi: number;
  };
  activeStrategies: string[];
}

export interface AgentDecision {
  action:
    | "SWAP"
    | "PROVIDE_LIQUIDITY"
    | "REMOVE_LIQUIDITY"
    | "STAKE"
    | "UNSTAKE"
    | "NONE";
  reasoning: string;
  expectedOutcome: string;
  riskAssessment: string;
  transaction?: TransactionConfig;
}

// Memory system types
export interface MemoryItem {
  timestamp: number;
  type: "TRANSACTION" | "ANALYSIS" | "DECISION";
  data: any;
}

export interface MemoryStorage {
  transactions: TransactionResult[];
  decisions: AgentDecision[];
  preferences: Record<string, any>;
  commonAddresses: Record<string, string>;
}
