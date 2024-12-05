import axios from "axios";
import { AVALANCHE_CONFIG } from "../config";

interface ProtocolData {
  name: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
}

interface MarketEvent {
  type: "transaction" | "contract_interaction" | "token_transfer";
  hash: string;
  timestamp: number;
  value: string;
  from: string;
  to: string;
  details?: any;
}

export class OnChainDataService {
  private readonly DEFILLAMA_API = "https://api.llama.fi";
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly SNOWTRACE_API = "https://api.snowtrace.io/api";

  constructor(private readonly snowtraceApiKey?: string) {}

  public async getProtocolData(): Promise<ProtocolData[]> {
    try {
      const response = await axios.get(
        `${this.DEFILLAMA_API}/protocols`
      );
      const allProtocols = response.data;

      // Filter for Avalanche protocols
      return allProtocols
        .filter((p: any) => p.chains.includes("Avalanche"))
        .map((p: any) => ({
          name: p.name,
          tvl: p.tvl || 0,
          tvlChange24h: p.change_1d || 0,
          volume24h: p.volume24h || 0,
        }));
    } catch (error) {
      console.error("Failed to fetch protocol data:", error);
      return [];
    }
  }

  public async getSignificantTransactions(): Promise<MarketEvent[]> {
    if (!this.snowtraceApiKey) {
      console.warn("Snowtrace API key not provided");
      return [];
    }

    try {
      // Get recent transactions with value > 100 AVAX
      const response = await axios.get(`${this.SNOWTRACE_API}`, {
        params: {
          module: "account",
          action: "txlist",
          address: AVALANCHE_CONFIG.rpcUrl,
          startblock: 0,
          endblock: 99999999,
          sort: "desc",
          apikey: this.snowtraceApiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          response.data.message || "Failed to fetch transactions"
        );
      }

      return response.data.result
        .filter((tx: any) => parseFloat(tx.value) > 100e18) // Filter for significant transactions
        .map((tx: any) => ({
          type: "transaction",
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          value: tx.value,
          from: tx.from,
          to: tx.to,
          details: {
            gasPrice: tx.gasPrice,
            gasUsed: tx.gasUsed,
            methodId: tx.methodId,
          },
        }));
    } catch (error) {
      console.error(
        "Failed to fetch significant transactions:",
        error
      );
      return [];
    }
  }

  public async getMarketData(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.COINGECKO_API}/simple/price`,
        {
          params: {
            ids: "avalanche-2",
            vs_currencies: "usd",
            include_24hr_vol: true,
            include_24hr_change: true,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return null;
    }
  }

  public async getRecentContractInteractions(
    contractAddress: string
  ): Promise<MarketEvent[]> {
    if (!this.snowtraceApiKey) {
      console.warn("Snowtrace API key not provided");
      return [];
    }

    try {
      const response = await axios.get(`${this.SNOWTRACE_API}`, {
        params: {
          module: "account",
          action: "txlist",
          address: contractAddress,
          startblock: 0,
          endblock: 99999999,
          sort: "desc",
          apikey: this.snowtraceApiKey,
        },
      });

      if (response.data.status !== "1") {
        throw new Error(
          response.data.message ||
            "Failed to fetch contract interactions"
        );
      }

      return response.data.result.map((tx: any) => ({
        type: "contract_interaction",
        hash: tx.hash,
        timestamp: parseInt(tx.timeStamp) * 1000,
        value: tx.value,
        from: tx.from,
        to: tx.to,
        details: {
          methodId: tx.methodId,
          functionName: tx.functionName,
          gasUsed: tx.gasUsed,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch contract interactions:", error);
      return [];
    }
  }
}
