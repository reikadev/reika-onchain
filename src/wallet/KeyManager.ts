import { ethers } from "ethers";
import * as crypto from "crypto";

export class KeyManager {
  private encryptedKey: string | null = null;
  private algorithm = "aes-256-cbc";

  constructor(private secretKey: string) {
    if (!secretKey || secretKey.length < 32) {
      throw new Error(
        "Secret key must be at least 32 characters long"
      );
    }
  }

  private getEncryptionKey(): Buffer {
    return crypto.scryptSync(this.secretKey, "salt", 32);
  }

  public encryptPrivateKey(privateKey: string): void {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv
      );

      let encrypted = cipher.update(privateKey, "utf8", "hex");
      encrypted += cipher.final("hex");

      this.encryptedKey = `${iv.toString("hex")}:${encrypted}`;
    } catch (error) {
      throw new Error("Failed to encrypt private key");
    }
  }

  public decryptPrivateKey(): string {
    if (!this.encryptedKey) {
      throw new Error("No encrypted key available");
    }

    try {
      const [ivHex, encryptedData] = this.encryptedKey.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv
      );

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      // Validate that the decrypted key is a valid private key
      new ethers.Wallet(decrypted);

      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt private key");
    }
  }

  public isKeyStored(): boolean {
    return this.encryptedKey !== null;
  }

  public clearStoredKey(): void {
    this.encryptedKey = null;
  }

  public validatePrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }
}
