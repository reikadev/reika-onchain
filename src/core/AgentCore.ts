import { EventEmitter } from 'events';
import {
  AgentConfig,
  AgentState,
  AgentDecision,
  WalletConfig,
  TransactionResult
} from '../types';
import { WalletManager } from '../wallet/WalletManager';
import { ChainAnalyzer } from './ChainAnalyzer';
import { DecisionEngine } from './DecisionEngine';
import { LLMService } from './LLMService';

export class AgentCore extends EventEmitter {
  private isRunning: boolean = false;
  private state: AgentState;
  private lastAnalysisTime: number = 0;
  private readonly analysisInterval: number = 60000; // 1 minute
  private walletManager: WalletManager;
  private chainAnalyzer: ChainAnalyzer;
  private decisionEngine: DecisionEngine;
  private llmService: LLMService;

  constructor(
    private readonly agentConfig: AgentConfig,
    walletConfig: WalletConfig,
    secretKey: string,
    priceOracleAddresses: Record<string, string>,
    supportedPools: string[],
    supportedTokens: string[]
  ) {
    super();

    // Initialize components
    this.walletManager = new WalletManager(walletConfig, secretKey);
    this.chainAnalyzer = new ChainAnalyzer(
      this.walletManager.getNetworkManager(),
      priceOracleAddresses
    );
    this.llmService = new LLMService();
    this.decisionEngine = new DecisionEngine(
      agentConfig,
      this.chainAnalyzer,
      supportedPools,
      supportedTokens
    );

    // Initialize state
    this.state = {
      lastAnalysis: 0,
      currentBalance: '0',
      performanceMetrics: {
        startTime: Date.now(),
        initialValue: '0',
        currentValue: '0',
        roi: 0,
      },
      activeStrategies: [],
    };
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    try {
      // Validate connection
      const isConnected = await this.walletManager.validateConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to network');
      }

      // Initialize state with current balance
      const balance = await this.walletManager.getBalance();
      this.state.currentBalance = balance;
      this.state.performanceMetrics.initialValue = balance;
      this.state.performanceMetrics.currentValue = balance;

      this.isRunning = true;
      this.emit('started', {
        address: this.walletManager.getAddress(),
        balance,
        timestamp: Date.now(),
      });

      // Start the main loop
      this.runMainLoop();
    } catch (error: any) {
      this.emit('error', {
        message: error?.message || 'Failed to start agent',
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.emit('stopped', {
      timestamp: Date.now(),
    });
  }

  private async runMainLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.runAnalysisIteration();
      } catch (error: any) {
        this.emit('error', {
          message: error?.message || 'Error in main loop',
          timestamp: Date.now(),
        });
      }

      // Wait for the next interval
      await new Promise(resolve => setTimeout(resolve, this.analysisInterval));
    }
  }

  private async runAnalysisIteration(): Promise<void> {
    const now = Date.now();

    // Update state
    const balance = await this.walletManager.getBalance();
    this.state.currentBalance = balance;
    this.state.performanceMetrics.currentValue = balance;
    this.updatePerformanceMetrics();

    // Make decision
    const decision = await this.decisionEngine.makeDecision(this.state);

    // Log decision with AI reasoning
    this.emit('decision', {
      decision,
      timestamp: now,
      aiAnalysis: {
        reasoning: decision.reasoning,
        expectedOutcome: decision.expectedOutcome,
        riskAssessment: decision.riskAssessment,
      },
    });

    // Execute decision if needed
    if (decision.action !== 'NONE' && decision.transaction) {
      await this.executeDecision(decision);
    }

    // Update state
    this.state.lastAnalysis = now;
    this.lastAnalysisTime = now;
  }

  private async executeDecision(decision: AgentDecision): Promise<void> {
    try {
      if (!decision.transaction) {
        throw new Error('No transaction config provided with decision');
      }

      this.emit('executing', {
        decision,
        timestamp: Date.now(),
      });

      const result = await this.walletManager.sendTransaction(decision.transaction);

      if (result.success) {
        this.handleSuccessfulExecution(decision, result);
      } else {
        this.handleFailedExecution(decision, result);
      }
    } catch (error: any) {
      this.emit('error', {
        message: `Failed to execute decision: ${error?.message || 'Unknown error'}`,
        decision,
        timestamp: Date.now(),
      });
    }
  }

  private handleSuccessfulExecution(decision: AgentDecision, result: TransactionResult): void {
    // Update active strategies if applicable
    if (decision.action === 'PROVIDE_LIQUIDITY') {
      this.state.activeStrategies.push(`LP_${result.hash}`);
    }

    this.emit('executed', {
      decision,
      result,
      timestamp: Date.now(),
      aiAnalysis: {
        reasoning: decision.reasoning,
        outcome: decision.expectedOutcome,
      },
    });
  }

  private handleFailedExecution(decision: AgentDecision, result: TransactionResult): void {
    this.emit('executionFailed', {
      decision,
      result,
      timestamp: Date.now(),
      aiAnalysis: {
        reasoning: decision.reasoning,
        failureImpact: 'AI will analyze this failure for future decisions',
      },
    });
  }

  private updatePerformanceMetrics(): void {
    const initial = BigInt(this.state.performanceMetrics.initialValue);
    const current = BigInt(this.state.performanceMetrics.currentValue);

    if (initial === BigInt(0)) {
      this.state.performanceMetrics.roi = 0;
    } else {
      // Calculate ROI as percentage
      const roi = Number((current - initial) * BigInt(10000) / initial);
      this.state.performanceMetrics.roi = roi / 100;
    }
  }

  public getState(): AgentState {
    return { ...this.state };
  }

  public getTransactionHistory(): TransactionResult[] {
    return this.walletManager.getTransactionHistory();
  }

  public getWalletAddress(): string {
    return this.walletManager.getAddress();
  }
}
