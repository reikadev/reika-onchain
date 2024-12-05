import { AgentConfig, AgentDecision, AgentState, TransactionConfig } from '../types';
import { ChainAnalyzer } from './ChainAnalyzer';
import { LLMService } from './LLMService';

export class DecisionEngine {
  private lastDecisionTimestamp: number = 0;
  private readonly MIN_DECISION_INTERVAL = 60; // Minimum seconds between decisions
  private llmService: LLMService;

  constructor(
    private config: AgentConfig,
    private chainAnalyzer: ChainAnalyzer,
    private readonly supportedPools: string[],
    private readonly supportedTokens: string[]
  ) {
    this.llmService = new LLMService();
  }

  public async makeDecision(currentState: AgentState): Promise<AgentDecision> {
    try {
      // Enforce minimum interval between decisions
      const now = Math.floor(Date.now() / 1000);
      if (now - this.lastDecisionTimestamp < this.MIN_DECISION_INTERVAL) {
        return {
          action: 'NONE',
          reasoning: 'Minimum decision interval not reached',
          expectedOutcome: 'Maintain current position',
          riskAssessment: 'Low - No action taken',
        };
      }

      // Gather market data
      const chainData = await this.chainAnalyzer.analyzeChainState();
      const gasMarket = await this.chainAnalyzer.analyzeGasMarket();

      // Gather pools and tokens data
      const poolsData = await this.gatherPoolsData();
      const tokensData = await this.gatherTokensData();

      // Use LLM to analyze market conditions
      const marketAnalysis = await this.llmService.analyzeMarketConditions(
        chainData,
        currentState,
        this.config,
        poolsData,
        tokensData
      );

      // Generate strategy using LLM
      const strategyResponse = await this.llmService.generateStrategy(
        marketAnalysis,
        this.config,
        currentState
      );

      // Parse the strategy response
      const parsedStrategy = await this.llmService.parseStrategyResponse(strategyResponse);

      // Create decision from parsed strategy
      const decision = this.createDecisionFromStrategy(parsedStrategy);

      this.lastDecisionTimestamp = now;
      return decision;
    } catch (error: any) {
      console.error('Decision making failed:', error);
      return {
        action: 'NONE',
        reasoning: `Error in decision making: ${error?.message || 'Unknown error'}`,
        expectedOutcome: 'Maintain current position',
        riskAssessment: 'High - Error occurred',
      };
    }
  }

  private async gatherPoolsData(): Promise<any[]> {
    const poolsData = [];

    for (const poolAddress of this.supportedPools) {
      try {
        const [token0Address, token1Address] = await this.getPoolTokens(poolAddress);
        const poolAnalysis = await this.chainAnalyzer.analyzeLiquidityPool(
          poolAddress,
          token0Address,
          token1Address
        );
        poolsData.push({
          address: poolAddress,
          ...poolAnalysis,
        });
      } catch (error) {
        console.error(`Failed to gather data for pool ${poolAddress}:`, error);
      }
    }

    return poolsData;
  }

  private async gatherTokensData(): Promise<any[]> {
    const tokensData = [];

    for (const tokenAddress of this.supportedTokens) {
      try {
        const tokenData = await this.chainAnalyzer.getTokenData(tokenAddress);
        tokensData.push(tokenData);
      } catch (error) {
        console.error(`Failed to gather data for token ${tokenAddress}:`, error);
      }
    }

    return tokensData;
  }

  private async getPoolTokens(poolAddress: string): Promise<[string, string]> {
    // Mock implementation - in real world, would query the pool contract
    return [this.supportedTokens[0], this.supportedTokens[1]];
  }

  private createDecisionFromStrategy(
    strategy: {
      action: string;
      reasoning: string;
      expectedOutcome: string;
      riskAssessment: string;
      transactionParams?: any;
    }
  ): AgentDecision {
    let transaction: TransactionConfig | undefined;

    if (strategy.transactionParams) {
      transaction = {
        to: strategy.transactionParams.to,
        value: strategy.transactionParams.value,
        data: strategy.transactionParams.data,
        gasLimit: strategy.transactionParams.gasLimit,
        gasPrice: strategy.transactionParams.gasPrice,
      };
    }

    return {
      action: strategy.action as any,
      reasoning: strategy.reasoning,
      expectedOutcome: strategy.expectedOutcome,
      riskAssessment: strategy.riskAssessment,
      transaction,
    };
  }
}
