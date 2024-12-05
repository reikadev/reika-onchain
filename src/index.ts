import { AgentCore } from "./core/AgentCore";
import {
  AGENT_CONFIG,
  WALLET_CONFIG,
  PRICE_ORACLE_ADDRESSES,
  SUPPORTED_POOLS,
  SUPPORTED_TOKENS,
} from "./config";

async function main() {
  try {
    if (!process.env.WALLET_SECRET_KEY) {
      throw new Error(
        "WALLET_SECRET_KEY environment variable is required"
      );
    }

    // Initialize the AI agent
    const agent = new AgentCore(
      AGENT_CONFIG,
      WALLET_CONFIG,
      process.env.WALLET_SECRET_KEY,
      PRICE_ORACLE_ADDRESSES,
      SUPPORTED_POOLS,
      SUPPORTED_TOKENS
    );

    // Set up event listeners
    agent.on("started", (data) => {
      console.log("Agent started:", {
        address: data.address,
        balance: data.balance,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    agent.on("decision", (data) => {
      console.log("New decision:", {
        action: data.decision.action,
        reasoning: data.decision.reasoning,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    agent.on("executing", (data) => {
      console.log("Executing decision:", {
        action: data.decision.action,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    agent.on("executed", (data) => {
      console.log("Decision executed:", {
        action: data.decision.action,
        transactionHash: data.result.hash,
        success: data.result.success,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    agent.on("executionFailed", (data) => {
      console.error("Decision execution failed:", {
        action: data.decision.action,
        error: data.result.error,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    agent.on("error", (data) => {
      console.error("Agent error:", {
        message: data.message,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    });

    // Start the agent
    await agent.start();

    // Handle process termination
    process.on("SIGINT", async () => {
      console.log("\nGracefully shutting down...");
      agent.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\nGracefully shutting down...");
      agent.stop();
      process.exit(0);
    });
  } catch (error: any) {
    console.error(
      "Failed to start agent:",
      error?.message || "Unknown error"
    );
    process.exit(1);
  }
}

// Run the agent
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
