import { ethers } from "ethers";
import { KeyManager } from "./KeyManager";
import { NetworkManager } from "./NetworkManager";
import {
  WalletConfig,
  TransactionConfig,
  TransactionResult,
} from "../types";

export class WalletManager {
  private wallet!: ethers.Wallet; // Using definite assignment assertion
  private keyManager: KeyManager;
  private networkManager: NetworkManager;
  private transactionHistory: TransactionResult[] = [];

  constructor(private config: WalletConfig, secretKey: string) {
    this.keyManager = new KeyManager(secretKey);
    this.networkManager = new NetworkManager(
      config.rpcUrl,
      config.chainId
    );
    this.initializeWallet();
  }

  private initializeWallet(): void {
    if (!this.keyManager.validatePrivateKey(this.config.privateKey)) {
      throw new Error("Invalid private key provided");
    }

    this.keyManager.encryptPrivateKey(this.config.privateKey);
    const decryptedKey = this.keyManager.decryptPrivateKey();
    this.wallet = new ethers.Wallet(
      decryptedKey,
      this.networkManager.getProvider()
    );
  }

  public async getBalance(): Promise<string> {
    try {
      const balance = await this.networkManager.getBalance(
        this.wallet.address
      );
      return balance.toString();
    } catch (error: any) {
      throw new Error(
        `Failed to get wallet balance: ${
          error?.message || "Unknown error"
        }`
      );
    }
  }

  public getAddress(): string {
    return this.wallet.address;
  }

  public async sendTransaction(
    config: TransactionConfig
  ): Promise<TransactionResult> {
    try {
      if (!this.networkManager.isHealthy()) {
        throw new Error("Network connection is unhealthy");
      }

      // Prepare transaction
      const tx: ethers.TransactionRequest = {
        to: config.to,
        value: config.value
          ? ethers.parseEther(config.value)
          : undefined,
        data: config.data,
        gasLimit: config.gasLimit
          ? ethers.parseUnits(config.gasLimit, "wei")
          : undefined,
      };

      // Estimate gas if not provided
      if (!tx.gasLimit) {
        tx.gasLimit = await this.networkManager.estimateGas(tx);
      }

      // Get gas price if not provided
      if (!config.gasPrice) {
        const feeData = await this.networkManager
          .getProvider()
          .getFeeData();
        tx.gasPrice = feeData.gasPrice;
      } else {
        tx.gasPrice = ethers.parseUnits(config.gasPrice, "wei");
      }

      // Send transaction
      const transaction = await this.wallet.sendTransaction(tx);

      // Wait for confirmation
      const receipt = await this.networkManager.waitForTransaction(
        transaction.hash
      );

      const result: TransactionResult = {
        hash: transaction.hash,
        success: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };

      this.transactionHistory.push(result);
      return result;
    } catch (error: any) {
      const failedResult: TransactionResult = {
        hash: "",
        success: false,
        error: error?.message || "Unknown error",
      };
      this.transactionHistory.push(failedResult);
      throw new Error(
        `Transaction failed: ${error?.message || "Unknown error"}`
      );
    }
  }

  public async signMessage(message: string): Promise<string> {
    try {
      return await this.wallet.signMessage(message);
    } catch (error: any) {
      throw new Error(
        `Failed to sign message: ${error?.message || "Unknown error"}`
      );
    }
  }

  public getTransactionHistory(): TransactionResult[] {
    return [...this.transactionHistory];
  }

  public async validateConnection(): Promise<boolean> {
    try {
      await this.networkManager.getChainData();
      return true;
    } catch {
      return false;
    }
  }

  public clearTransactionHistory(): void {
    this.transactionHistory = [];
  }

  public getNetworkManager(): NetworkManager {
    return this.networkManager;
  }
}
