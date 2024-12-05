import dotenv from 'dotenv';
import { AgentConfig, WalletConfig } from '../types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'WALLET_PRIVATE_KEY',
  'AVALANCHE_RPC_URL',
  'CHAIN_ID',
  'WALLET_SECRET_KEY',
  'OPENROUTER_API_KEY', // Added OpenRouter API key requirement
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Network Configuration
export const AVALANCHE_CONFIG = {
  rpcUrl: process.env.AVALANCHE_RPC_URL!,
  chainId: parseInt(process.env.CHAIN_ID!),
  networkName: 'Avalanche',
};

// Wallet Configuration
export const WALLET_CONFIG: WalletConfig = {
  privateKey: process.env.WALLET_PRIVATE_KEY!,
  rpcUrl: AVALANCHE_CONFIG.rpcUrl,
  chainId: AVALANCHE_CONFIG.chainId,
};

// Agent Configuration
export const AGENT_CONFIG: AgentConfig = {
  goalMetric: (process.env.GOAL_METRIC as AgentConfig['goalMetric']) || 'PNL',
  riskLevel: (process.env.RISK_LEVEL as AgentConfig['riskLevel']) || 'MEDIUM',
  timeframe: parseInt(process.env.TIMEFRAME || '3600'), // Default 1 hour
  startingBalance: '0', // Will be set when agent starts
};

// OpenRouter Configuration
export const OPENROUTER_CONFIG = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'anthropic/claude-3-sonnet-20240229',
  baseUrl: 'https://openrouter.ai/api/v1',
  maxRetries: 3,
  temperature: 0.7,
};

// Oracle Addresses
export const PRICE_ORACLE_ADDRESSES: Record<string, string> = {
  // Avalanche Mainnet Price Feeds
  'AVAX': '0x0A77230d17318075983913bC2145DB16C7366156', // AVAX/USD
  'USDC': '0xF096872672F44d6EBA71458D74fe67F9a77a23B9', // USDC/USD
  'USDT': '0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a', // USDT/USD
  'WETH': '0x976B3D034E162d8bD72D6b9C989d545b839003b0', // WETH/USD
  'WBTC': '0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743', // WBTC/USD
};

// Supported DEX Pools
export const SUPPORTED_POOLS = [
  // Trader Joe v2.1 Pools
  '0x7c05d54fc5CB6e4Ad87c6f5db3b807C94BB89d66', // AVAX-USDC
  '0x62475c90D2E1f0080B86A8B0E3817F738650e3B4', // AVAX-USDT
  // Add more pools as needed
];

// Supported Tokens
export const SUPPORTED_TOKENS = [
  // Native and wrapped tokens
  '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
  '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // WETH.e
  '0x50b7545627a5162F82A992c33b87aDc75187B218', // WBTC.e
  // Stablecoins
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
  '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
];

// Security Configuration
export const SECURITY_CONFIG = {
  maxGasLimit: BigInt('500000'), // Maximum gas limit for transactions
  maxSlippage: 0.5, // Maximum allowed slippage (0.5%)
  minLiquidity: BigInt('1000000000000000000'), // Minimum pool liquidity (in wei)
};

// Memory Configuration
export const MEMORY_CONFIG = {
  maxTransactionHistory: 1000,
  maxDecisionHistory: 100,
  persistPath: './data/memory.json',
};

// API Configuration
export const API_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
};

// Validation functions
export function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validatePrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

// Helper function to get token address
export function getTokenAddress(symbol: string): string {
  const token = SUPPORTED_TOKENS.find(address =>
    address.toLowerCase() === symbol.toLowerCase()
  );
  if (!token) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return token;
}

// Helper function to get pool address
export function getPoolAddress(token0: string, token1: string): string {
  const pool = SUPPORTED_POOLS.find(address => {
    // In a real implementation, you would query the pool contract
    // to verify it's the correct pool for these tokens
    return true;
  });
  if (!pool) {
    throw new Error(`No supported pool found for ${token0}/${token1}`);
  }
  return pool;
}
