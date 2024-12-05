import { ethers } from "ethers";
import { ChainData } from "../types";

export class NetworkManager {
  private provider: ethers.JsonRpcProvider;
  private lastBlockNumber: number = 0;
  private networkHealth: boolean = false;

  constructor(
    private rpcUrl: string,
    private chainId: number,
    private readonly reconnectAttempts: number = 3,
    private readonly reconnectDelay: number = 1000
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.validateNetwork();
      this.startBlockMonitoring();
    } catch (error: any) {
      throw new Error(
        `Failed to initialize network connection: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  private async validateNetwork(): Promise<void> {
    try {
      const network = await this.provider.getNetwork();
      const actualChainId = Number(network.chainId);

      if (actualChainId !== this.chainId) {
        throw new Error(
          `Chain ID mismatch. Expected ${this.chainId}, got ${actualChainId}`
        );
      }

      this.networkHealth = true;
    } catch (error: any) {
      this.networkHealth = false;
      throw error;
    }
  }

  private startBlockMonitoring(): void {
    this.provider.on("block", (blockNumber: number) => {
      this.lastBlockNumber = blockNumber;
      this.networkHealth = true;
    });

    this.provider.on("error", async (error: Error) => {
      console.error("Provider error:", error);
      this.networkHealth = false;
      await this.reconnect();
    });
  }

  private async reconnect(): Promise<void> {
    for (let i = 0; i < this.reconnectAttempts; i++) {
      try {
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        await this.validateNetwork();
        this.startBlockMonitoring();
        return;
      } catch (error: any) {
        console.error(
          `Reconnection attempt ${i + 1} failed:`,
          error?.message || "Unknown error"
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.reconnectDelay)
        );
      }
    }
    throw new Error(
      "Failed to reconnect to network after multiple attempts"
    );
  }

  public async getChainData(): Promise<ChainData> {
    try {
      const [blockNumber, block, gasPrice] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getBlock("latest"),
        this.provider.getFeeData(),
      ]);

      return {
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString() || "0",
        timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch chain data: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  public getProvider(): ethers.JsonRpcProvider {
    if (!this.networkHealth) {
      throw new Error("Network connection is unhealthy");
    }
    return this.provider;
  }

  public isHealthy(): boolean {
    return this.networkHealth;
  }

  public getLastBlockNumber(): number {
    return this.lastBlockNumber;
  }

  public async estimateGas(
    transaction: ethers.TransactionRequest
  ): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error: any) {
      throw new Error(
        `Failed to estimate gas: ${error?.message || "Unknown error"}`
      );
    }
  }

  public async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error: any) {
      throw new Error(
        `Failed to get balance: ${error?.message || "Unknown error"}`
      );
    }
  }

  public async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        confirmations
      );
      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }
      return receipt;
    } catch (error: any) {
      throw new Error(
        `Failed to wait for transaction: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }
}
