# Reika OnChain - AI-Powered DeFi Agent for Avalanche

Reika OnChain is an autonomous AI agent that leverages Claude 3.5 Sonnet through OpenRouter to make intelligent decisions for DeFi operations on the Avalanche network. The agent analyzes on-chain data and market conditions to execute optimal transactions based on configurable goals and risk parameters.

## Features

- 🧠 Advanced AI decision-making using Claude 3.5 Sonnet
- 🤖 Autonomous market analysis and strategy generation
- 🔒 Secure wallet management and transaction handling
- 📊 Real-time market data analysis
- ⚡ Support for multiple DeFi strategies
- 🛡️ Configurable risk parameters
- 📈 Performance tracking and reporting

## Architecture

The project is structured into several core components:

### Core Components

1. **LLMService**: AI-powered decision making
   - Integrates with Claude 3.5 Sonnet through OpenRouter
   - Analyzes market conditions and generates strategies
   - Provides detailed reasoning for decisions
   - Parses and structures AI responses

2. **AgentCore**: Main coordinator that manages the autonomous system
   - Handles the main decision loop
   - Coordinates between other components
   - Manages system state and events

3. **DecisionEngine**: Makes strategic decisions using AI analysis
   - Leverages LLMService for market analysis
   - Evaluates strategies using AI insights
   - Risk assessment and transaction planning

4. **ChainAnalyzer**: Analyzes on-chain data and market conditions
   - Token price monitoring
   - Liquidity pool analysis
   - Gas market analysis

5. **WalletManager**: Handles all wallet-related operations
   - Secure private key management
   - Transaction signing and execution
   - Balance tracking and gas estimation

## AI Integration

The agent uses Claude 3.5 Sonnet through OpenRouter for intelligent decision-making:

### Market Analysis
- Analyzes current market conditions
- Identifies trends and patterns
- Evaluates liquidity pool opportunities
- Assesses risk factors
- Spots arbitrage opportunities

### Strategy Generation
- Creates optimal strategies based on goals
- Provides detailed reasoning
- Considers multiple factors:
  - Market conditions
  - Risk parameters
  - Gas costs
  - Historical performance
  - Pool liquidity
  - Token volatility

### Decision Process
1. Gathers market data and chain state
2. Sends data to Claude for analysis
3. Receives structured market analysis
4. Requests strategy generation based on analysis
5. Parses AI response into actionable decisions
6. Executes transactions if conditions are met

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- An Avalanche wallet with AVAX for transactions
- OpenRouter API key (get from https://openrouter.ai/)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/reika-onchain.git
cd reika-onchain
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
WALLET_PRIVATE_KEY=your-wallet-private-key
WALLET_SECRET_KEY=your-secure-secret-key
AVALANCHE_RPC_URL=your-rpc-url
CHAIN_ID=43114
GOAL_METRIC=PNL
RISK_LEVEL=MEDIUM
TIMEFRAME=3600
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Usage

1. Build the project:
```bash
npm run build
```

2. Start the agent:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Configuration

### Agent Configuration

The agent can be configured with different goals and risk parameters:

- **Goal Metrics**:
  - `PNL`: Optimize for profit and loss
  - `YIELD`: Optimize for yield farming returns
  - `QUEST_COMPLETION`: Focus on completing on-chain quests

- **Risk Levels**:
  - `LOW`: Conservative strategies
  - `MEDIUM`: Balanced approach
  - `HIGH`: Aggressive strategies

### AI Configuration

The LLM service can be configured through environment variables:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- Model: Claude 3.5 Sonnet (configurable in src/config/index.ts)
- Temperature: 0.7 (configurable for strategy variation)

### Supported Operations

- Token swaps
- Liquidity provision
- Yield farming
- Quest completion

## Security

The system implements several security measures:

- Encrypted private key storage
- Gas limit controls
- Slippage protection
- Transaction validation
- Error handling and recovery

## Event System

The agent emits various events that can be monitored:

- `started`: When the agent starts running
- `decision`: When a new AI-driven decision is made
- `executing`: When executing a transaction
- `executed`: When a transaction is completed
- `error`: When an error occurs

## Development

### Project Structure

```
src/
├── core/
│   ├── AgentCore.ts
│   ├── ChainAnalyzer.ts
│   ├── DecisionEngine.ts
│   └── LLMService.ts
├── wallet/
│   ├── KeyManager.ts
│   ├── NetworkManager.ts
│   └── WalletManager.ts
├── config/
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

### Adding New Strategies

To add new strategies:

1. Define the strategy interface in `types/index.ts`
2. Add strategy analysis prompts in `LLMService.ts`
3. Implement analysis in `ChainAnalyzer.ts`
4. Update configuration in `config/index.ts`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is for educational purposes only. Use at your own risk. The creators are not responsible for any financial losses incurred through the use of this software.

## Support

For support, please open an issue in the GitHub repository.
