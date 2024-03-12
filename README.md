# BARK Token Program with TypeScript and Anchor Integration
**Version 1.0.2 Alpha**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The BARK Token Program is a sophisticated Solana-based smart contract designed to streamline the creation, transfer, and management of BARK tokens on the Solana blockchain. This version includes integration with the TypeScript language and the Anchor framework for improved type safety and efficient program development.

## Networks

- **Devnet:** BARKhLzdWbyZiP3LNoD9boy7MrAy4CVXEToDyYGeEBKF
- **Testnet:**
- **Mainnet:**

*Notice: This program is developed on the Devnet and tested on Solana Playground.*

## Features

- **Minting BARK Tokens**: Create new BARK tokens by initializing the BARK Mint Account.

- **Transfer with Fee**: Transfer BARK tokens from one account to another with an associated fee, calculated based on the configured basis points and a maximum fee.

- **Fee Harvesting**: Accumulated fees in fee accounts can be harvested and transferred back to the BARK Mint Account.

- **Metadata Integration**: Add detailed information about the BARK token, such as name, symbol, URI, and extensions.

- **Burning Mechanism**: A burning mechanism burns a percentage of BARK tokens each quarter, starting from a specified quarter.

- **Keypair Generation**: Generate Solana Keypairs for various accounts if not implemented or created.

## Implement:

- **CoinMarketCap API Integration**: Retrieve real-time market data for the BARK token using the Coincecho or CoinMarketCap API.

## Getting Started

### Prerequisites

- Node.js
- Solana CLI
- TypeScript
- Anchor
- Rust

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/bark-community/bark-token.git
   cd bark-token
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

4. **Configure API Keys:**

   Create a `config` folder in the `src` directory and add an `index.ts` file to store API keys:

   ```typescript
   // src/config/index.ts
   export const COINMARKETCAP_API_KEY = 'YOUR_COINMARKETCAP_API_KEY';
   ```

### Usage

1. **Initialize Connection**: Establish a connection to the Solana blockchain.

2. **Check Balance**: Verify the SOL balance of the wallet.

3. **Initialize Mint Account**: Create and initialize the BARK Mint Account.

   ```typescript
   // Example usage of initializeMintAccount function
   await initializeMintAccount();
   ```

4. **Initialize Solana Accounts**: Create source and destination token accounts for BARK tokens.

   ```typescript
   // Example usage of initializeSolanaAccounts function
   const [sourceTokenAccount, destinationTokenAccount] = await initializeSolanaAccounts();
   ```

5. **Transfer BARK with Fee**: Transfer BARK tokens from the source account to the destination account with an associated fee.

   To initiate a BARK transfer with an associated fee, use the `transferBarkWithFee` function. This function not only transfers BARK tokens but also charges a fee based on the configured fee structure.

   ```typescript
   // Example usage of transferBarkWithFee function
   await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, config.MINT_AMOUNT);
   ```

6. **Withdraw Fees**: Withdraw accumulated fees from the destination account.

   To manage accumulated fees associated with token transfers, use the `withdrawFees` function. This function identifies fee accounts linked to the destination account, withdraws accumulated fees, and transfers them back to the BARK Mint Account.

   ```typescript
   // Example usage of withdrawFees function
   await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);
   ```

7. **Transfer BARK Again**: Perform another BARK transfer.

   ```typescript
   // Example usage of transferBarkWithFee function for a second transfer
   await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, config.MINT_AMOUNT);
   ```

8. **Harvest Fees to Mint**: Harvest accumulated fees and transfer them back to the BARK Mint Account.

   ```typescript
   // Example usage of harvestWithheldTokensToMint function
   await harvestWithheldTokensToMint(mint, existingFeeAccount);
   ```

9. **Withdraw Fees Again**: Withdraw fees from the destination account.

   ```typescript
   // Example usage of withdrawFees function for a second withdrawal
   await withdrawFees(destinationTokenAccount, [], true);
   ```

10. **Burning Mechanism**: Check the current quarter, and if the burning quarter is reached, calculate and burn a percentage of BARK tokens.

    - Token Burn Rate: 2% Quarterly
    - Burning will start from Quarter 3. Current Quarter: 1

   ```typescript
   // Example usage of burnTokens function
   await burnTokens(burnAccounts[0].pubkey, burnAmount);
   ```

11. **Keypair Generation**: Generate Solana Keypairs for various accounts.

   ```typescript
   // Example usage of keypair generation
   const keypair = generateKeypair();
   ```

12. **Anchor Program Integration ToDo**

   - [ ] Create a new Anchor program file (e.g., `bark-token.ts`).
   - [ ] Define the necessary instructions, state, and accounts for the BARK Token program.
   - [ ] Implement the integration logic with the existing BARK Token program.

13. **Metadata Pointer**: Update the Metadata section with the correct implementation.

14. **Features to Update**: Include new features and improvements.

15. **Controlling Tokens**: [To be updated]

### TypeScript Integration ToDo

   - [ ] Update the project to use TypeScript for improved type safety and code clarity.
   - [ ] Create TypeScript configurations (tsconfig.json).
   - [ ] Refactor existing code to TypeScript (.ts files).
   - [ ] Ensure TypeScript types are used wherever applicable.

### Documentation

For detailed documentation, architecture, and how the BARK Token Program works with the Anchor framework and Sealevel, refer to the [BARK Token Program Documentation](./docs/BARK_TOKEN_DOCUMENTATION.md).

## ToDo List:

1. **Configuration Module:**
   - [ ] Create a new file (e.g., `config.ts`) to act as the configuration module.
   - [ ] Export a configuration object containing all relevant constants and configuration parameters.

2. **Function Decomposition:**
   - [ ] Identify functions that can be broken down into smaller, focused functions.
   - [ ] Create new functions with clear responsibilities and names that reflect their purpose.
   - [ ] Ensure that each function has a single responsibility.
   - [ ] Develop BARK (BRK) Token Standard

3. **Treasury Account / Wallet Logic:**
   - [ ] Define the Treasury Account/Wallet address in your code.
   - [ ] Create a new function (`sendToTreasury`) to handle the transfer of BARK tokens to the Treasury Account.
   - [ ] Integrate the `sendToTreasury` function where appropriate in your main process.

4. **Documentation:**
   - [ ] Add changes, new features, and improvements.
   - [ ] Provide clear instructions for users on how to utilize the new features.

## Contributing

Feel free to contribute by opening issues, proposing new features, or submitting pull requests. Contributions are welcome!

## License

MIT License [LICENSE](./LICENSE)
