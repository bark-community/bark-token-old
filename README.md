# BARK Token Program
**Version 1.0.0 Alpha**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The BARK Token Program is a Solana-based smart contract designed to facilitate the creation, transfer, and management of BARK tokens on the Solana blockchain. BARK is a digital asset with advanced features, including a transfer fee mechanism and a burning mechanism.

## Features

- **Minting BARK Tokens**: Create new BARK tokens by initializing the BARK Mint Account.

- **Transfer with Fee**: Transfer BARK tokens from one account to another with an associated fee, calculated based on the configured basis points and a maximum fee.

- **Fee Harvesting**: Accumulated fees in fee accounts can be harvested and transferred back to the BARK Mint Account.

- **Burning Mechanism**: A burning mechanism burns a percentage of BARK tokens each quarter, starting from a specified quarter.

## Getting Started

### Prerequisites

- Node.js
- Solana CLI
- TypeScript

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

### Usage

1. **Initialize Connection**: Establish a connection to the Solana blockchain.

2. **Check Balance**: Verify the SOL balance of the wallet.

3. **Initialize Mint Account**: Create and initialize the BARK Mint Account.

   ```javascript
   // Example usage of initializeMintAccount function
   await initializeMintAccount();
   ```

4. **Initialize Solana Accounts**: Create source and destination token accounts for BARK tokens.

   ```javascript
   // Example usage of initializeSolanaAccounts function
   const [sourceTokenAccount, destinationTokenAccount] = await initializeSolanaAccounts();
   ```

5. **Transfer BARK with Fee**: Transfer BARK tokens from the source account to the destination account with an associated fee.

   To initiate a BARK transfer with an associated fee, use the `transferBarkWithFee` function. This function not only transfers BARK tokens but also charges a fee based on the configured fee structure.

   ```javascript
   // Example usage of transferBarkWithFee function
   await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, config.MINT_AMOUNT);
   ```

6. **Withdraw Fees**: Withdraw accumulated fees from the destination account.

   To manage accumulated fees associated with token transfers, use the `withdrawFees` function. This function identifies fee accounts linked to the destination account, withdraws accumulated fees, and transfers them back to the BARK Mint Account.

   ```javascript
   // Example usage of withdrawFees function
   await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);
   ```

7. **Transfer BARK Again**: Perform another BARK transfer.

   ```javascript
   // Example usage of transferBarkWithFee function for a second transfer
   await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, config.MINT_AMOUNT);
   ```

8. **Harvest Fees to Mint**: Harvest accumulated fees and transfer them back to the BARK Mint Account.

   ```javascript
   // Example usage of harvestWithheldTokensToMint function
   await harvestWithheldTokensToMint(mint, existingFeeAccount);
   ```

9. **Withdraw Fees Again**: Withdraw fees from the destination account.

   ```javascript
   // Example usage of withdrawFees function for a second withdrawal
   await withdrawFees(destinationTokenAccount, [], true);
   ```

10. **Burning Mechanism**: Check the current quarter, and if the burning quarter is reached, calculate and burn a percentage of BARK tokens.

   ```javascript
   // Example usage of burnTokens function
   await burnTokens(burnAccounts[0].pubkey, burnAmount);
   ```

### Documentation

For detailed documentation, architecture, and how the BARK Token Program works, refer to the [BARK Token Program Documentation](./docs/BARK_TOKEN_DOCUMENTATION.md).

Certainly! Here's an expanded version of your ToDo list with additional details and steps:

## ToDo List:

1. **Configuration Module:**
   - [ ] Create a new file (e.g., `config.js`) to act as the configuration module.
   - [ ] Export a configuration object containing all relevant constants and configuration parameters.

2. **Function Decomposition:**
   - [ ] Identify functions that can be broken down into smaller, focused functions.
   - [ ] Create new functions with clear responsibilities and names that reflect their purpose.
   - [ ] Ensure that each function has a single responsibility.

3. **Treasury Account / Wallet Logic:**
   - [ ] Define the Treasury Account/Wallet address in your code.
   - [ ] Create a new function (`sendToTreasury`) to handle the transfer of BARK tokens to the Treasury Account.
   - [ ] Integrate the `sendToTreasury` function where appropriate in your main process.

4. **Document Update:**
   - [ ] Open your project's documentation file (e.g., `README.md`).
   - [ ] Update the document with the latest changes, new features, and improvements.
   - [ ] Include details about the Treasury Account logic and any other significant updates.
   - [ ] Provide clear instructions for users on how to utilize the new features.

## Contributing

Feel free to contribute by opening issues, proposing new features, or submitting pull requests. Contributions are welcome!

## License

MIT License [LICENSE](./LICENSE)
