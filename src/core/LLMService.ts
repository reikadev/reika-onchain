import axios from 'axios';
import { OPENROUTER_CONFIG } from '../config';
import { AgentConfig, AgentState, ChainData } from '../types';

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class LLMService {
  private readonly headers: Record<string, string>;

  constructor() {
    this.headers = {
      'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
      'HTTP-Referer': 'https://github.com/yourusername/reika-onchain', // Update with your repo
      'Content-Type': 'application/json',
    };
  }

  public async analyzeMarketConditions(
    chainData: ChainData,
    agentState: AgentState,
    agentConfig: AgentConfig,
    poolsData: any[],
    tokensData: any[]
  ): Promise<string> {
    const prompt = this.createMarketAnalysisPrompt(
      chainData,
      agentState,
      agentConfig,
      poolsData,
      tokensData
    );

    return await this.queryLLM(prompt);
  }

  public async generateStrategy(
    marketAnalysis: string,
    agentConfig: AgentConfig,
    currentState: AgentState
  ): Promise<string> {
    const prompt = this.createStrategyPrompt(
      marketAnalysis,
      agentConfig,
      currentState
    );

    return await this.queryLLM(prompt);
  }

  private async queryLLM(prompt: string): Promise<string> {
    try {
      const response = await axios.post<LLMResponse>(
        `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
        {
          model: OPENROUTER_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: OPENROUTER_CONFIG.temperature,
        },
        { headers: this.headers }
      );

      if (!response.data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from LLM');
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`LLM query failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private getSystemPrompt(): string {
    return `You are an advanced AI agent specialized in analyzing blockchain market conditions and making strategic DeFi decisions. Your goal is to optimize for the specified metrics while adhering to risk parameters.

Key responsibilities:
1. Analyze market conditions including token prices, liquidity pools, and gas markets
2. Identify profitable opportunities while considering risk levels
3. Generate detailed strategies with clear reasoning
4. Provide specific transaction parameters when needed

Please provide your analysis and recommendations in a structured format that can be parsed programmatically.`;
  }

  private createMarketAnalysisPrompt(
    chainData: ChainData,
    agentState: AgentState,
    agentConfig: AgentConfig,
    poolsData: any[],
    tokensData: any[]
  ): string {
    return `Please analyze the current market conditions with the following data:

Chain Data:
${JSON.stringify(chainData, null, 2)}

Agent State:
${JSON.stringify(agentState, null, 2)}

Agent Configuration:
${JSON.stringify(agentConfig, null, 2)}

Liquidity Pools Data:
${JSON.stringify(poolsData, null, 2)}

Tokens Data:
${JSON.stringify(tokensData, null, 2)}

Please provide a detailed analysis of:
1. Current market trends
2. Liquidity pool opportunities
3. Risk factors
4. Gas market conditions
5. Potential arbitrage opportunities

Format your response in a structured way that can be parsed programmatically.`;
  }

  private createStrategyPrompt(
    marketAnalysis: string,
    agentConfig: AgentConfig,
    currentState: AgentState
  ): string {
    return `Based on the following market analysis and configuration, please generate a detailed strategy:

Market Analysis:
${marketAnalysis}

Agent Configuration:
${JSON.stringify(agentConfig, null, 2)}

Current State:
${JSON.stringify(currentState, null, 2)}

Please provide:
1. Recommended action (SWAP, PROVIDE_LIQUIDITY, REMOVE_LIQUIDITY, STAKE, UNSTAKE, or NONE)
2. Detailed reasoning for the recommendation
3. Expected outcome and potential risks
4. Specific transaction parameters if action is needed

Format your response in a structured way that can be parsed programmatically, including exact values for any transaction parameters.`;
  }

  public async parseStrategyResponse(response: string): Promise<{
    action: string;
    reasoning: string;
    expectedOutcome: string;
    riskAssessment: string;
    transactionParams?: any;
  }> {
    try {
      // Use Claude to parse its own response into a structured format
      const parsePrompt = `Please parse the following strategy response into a structured format with action, reasoning, expectedOutcome, riskAssessment, and optional transactionParams:

${response}

Return only valid JSON without any additional text.`;

      const parsedResponse = await this.queryLLM(parsePrompt);
      return JSON.parse(parsedResponse);
    } catch (error: any) {
      throw new Error(`Failed to parse strategy response: ${error?.message || 'Unknown error'}`);
    }
  }
}
