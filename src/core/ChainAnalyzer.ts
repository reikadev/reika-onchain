import { ethers } from "ethers";
import { ChainData, TokenData } from "../types";
import { NetworkManager } from "../wallet/NetworkManager";

interface TokenPrice {
  price: number;
  timestamp: number;
}

export class ChainAnalyzer {
  private tokenPriceHistory: Map<string, TokenPrice[]> = new Map();
  private readonly PRICE_HISTORY_LIMIT = 1000;

  constructor(
    private networkManager: NetworkManager,
    private readonly priceOracleAddresses: Record<string, string>
  ) {}

  public async analyzeChainState(): Promise<ChainData> {
    return await this.networkManager.getChainData();
  }

  public async getTokenData(
    tokenAddress: string
  ): Promise<TokenData> {
    try {
      const provider = this.networkManager.getProvider();
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)",
        ],
        provider
      );

      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      const price = await this.getTokenPrice(tokenAddress);

      return {
        address: tokenAddress,
        symbol,
        decimals,
        price,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to get token data: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  private async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      const oracleAddress = this.priceOracleAddresses[tokenAddress];
      if (!oracleAddress) {
        throw new Error(
          `No price oracle found for token: ${tokenAddress}`
        );
      }

      const provider = this.networkManager.getProvider();
      const oracleContract = new ethers.Contract(
        oracleAddress,
        ["function latestAnswer() view returns (int256)"],
        provider
      );

      const price = await oracleContract.latestAnswer();
      const normalizedPrice = Number(price) / 1e8; // Assuming Chainlink's 8 decimal places

      this.updatePriceHistory(tokenAddress, normalizedPrice);
      return normalizedPrice;
    } catch (error: any) {
      throw new Error(
        `Failed to get token price: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  private updatePriceHistory(
    tokenAddress: string,
    price: number
  ): void {
    const history = this.tokenPriceHistory.get(tokenAddress) || [];
    history.push({
      price,
      timestamp: Math.floor(Date.now() / 1000),
    });

    // Keep history size limited
    if (history.length > this.PRICE_HISTORY_LIMIT) {
      history.shift();
    }

    this.tokenPriceHistory.set(tokenAddress, history);
  }

  public getPriceHistory(tokenAddress: string): TokenPrice[] {
    return this.tokenPriceHistory.get(tokenAddress) || [];
  }

  public async analyzeLiquidityPool(
    poolAddress: string,
    token0Address: string,
    token1Address: string
  ): Promise<{
    totalLiquidity: string;
    token0Reserve: string;
    token1Reserve: string;
    token0Price: number;
    token1Price: number;
    apr: number;
  }> {
    try {
      const provider = this.networkManager.getProvider();
      const poolContract = new ethers.Contract(
        poolAddress,
        [
          "function getReserves() view returns (uint112, uint112, uint32)",
          "function totalSupply() view returns (uint256)",
        ],
        provider
      );

      const [reserves, totalSupply] = await Promise.all([
        poolContract.getReserves(),
        poolContract.totalSupply(),
      ]);

      const [token0Data, token1Data] = await Promise.all([
        this.getTokenData(token0Address),
        this.getTokenData(token1Address),
      ]);

      const token0Reserve = reserves[0].toString();
      const token1Reserve = reserves[1].toString();

      // Calculate pool metrics
      const totalLiquidity = totalSupply.toString();
      const token0Price = token0Data.price || 0;
      const token1Price = token1Data.price || 0;

      // Simple APR calculation (this should be enhanced based on specific DEX mechanics)
      const apr = await this.estimatePoolAPR(
        poolAddress,
        token0Price,
        token1Price
      );

      return {
        totalLiquidity,
        token0Reserve,
        token1Reserve,
        token0Price,
        token1Price,
        apr,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to analyze liquidity pool: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  private async estimatePoolAPR(
    poolAddress: string,
    token0Price: number,
    token1Price: number
  ): Promise<number> {
    try {
      // This is a simplified APR calculation
      // In a real implementation, you would:
      // 1. Get historical trading volume
      // 2. Calculate fee revenue
      // 3. Consider reward tokens if any
      // 4. Account for impermanent loss

      // For now, returning a mock APR
      return 10.5; // 10.5% APR
    } catch (error: any) {
      console.error(`Failed to estimate pool APR: ${error?.message}`);
      return 0;
    }
  }

  public async analyzeGasMarket(): Promise<{
    currentGasPrice: string;
    estimatedBaseFee: string;
    gasMarketTrend: "increasing" | "decreasing" | "stable";
  }> {
    try {
      const provider = this.networkManager.getProvider();
      const feeData = await provider.getFeeData();
      const block = await provider.getBlock("latest");

      if (!block || !feeData.gasPrice) {
        throw new Error("Failed to fetch gas market data");
      }

      // Simple trend analysis based on base fee
      const baseFee = block.baseFeePerGas || BigInt(0);
      const gasMarketTrend = this.analyzeGasTrend(baseFee);

      return {
        currentGasPrice: feeData.gasPrice.toString(),
        estimatedBaseFee: baseFee.toString(),
        gasMarketTrend,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to analyze gas market: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  private analyzeGasTrend(
    currentBaseFee: bigint
  ): "increasing" | "decreasing" | "stable" {
    // This is a simplified trend analysis
    // In a real implementation, you would:
    // 1. Keep historical gas prices
    // 2. Use moving averages
    // 3. Consider network congestion
    // 4. Account for time of day patterns

    // For now, returning a mock trend
    return "stable";
  }
}
