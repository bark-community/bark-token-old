# BARK Token Program
**Version 1.0.0 Alpha**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The BARK Token Program is a smart contract built on the Solana blockchain, facilitating the creation, transfer, and management of BARK tokens. BARK is a digital asset featuring additional functionalities such as a transfer fee mechanism and a burning mechanism.

## Features

- **Minting BARK Tokens**: Create new BARK tokens by initializing the BARK Mint Account.

- **Transfer with Fee**: Transfer BARK tokens with an associated fee, calculated based on the configured basis points and a maximum fee.

- **Fee Harvesting**: Accumulated fees in fee accounts can be harvested and transferred back to the BARK Mint Account.

- **Burning Mechanism**: A burning mechanism burns a percentage of BARK tokens each quarter, starting from a specified quarter.

Certainly! The function `withdrawFees` in the code is responsible for withdrawing accumulated fees from the destination account. Let me provide a more detailed explanation:

### Withdraw Fees

In the BARK Token Program, fees are associated with token transfers. These fees are accumulated in a designated fee account, and the `withdrawFees` function is designed to withdraw these fees from the fee account and transfer them back to the BARK Mint Account.

Here's how the process works:

1. **Fee Accumulation**: When BARK tokens are transferred, a fee is charged based on the configured fee structure (basis points and maximum fee). The collected fees are stored in a fee account associated with the destination account.

2. **Withdrawal**: The `withdrawFees` function identifies the fee accounts associated with the destination account and withdraws the accumulated fees.

3. **Transfer to Mint Account**: After withdrawing the fees, the function initiates a transfer of the withdrawn fees from the fee account to the BARK Mint Account. This ensures that the fees are consolidated back into the main Mint Account for further management or redistribution.

The overall purpose of this process is to centralize and manage the fees collected during token transfers. It provides a mechanism to handle and redistribute fees, contributing to the overall governance and sustainability of the BARK Token Program.

Certainly! Here's an updated section in the documentation to include an explanation of the "Withdraw Fees Again" process:

```markdown
## Usage

...

7. **Transfer BARK Again**: Perform another BARK transfer.

8. **Harvest Fees to Mint**: Harvest accumulated fees and transfer them back to the BARK Mint Account.

9. **Withdraw Fees Again**: Withdraw fees from the destination account.

   The `withdrawFees` function is responsible for withdrawing accumulated fees from the destination account. Fees associated with token transfers are accumulated in a designated fee account, and this function identifies the fee accounts associated with the destination account. It then withdraws the accumulated fees and transfers them back to the BARK Mint Account. This ensures that fees are centrally managed and can be redistributed or used for further governance purposes.

   ```javascript
   // Example usage of withdrawFees function
   await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);
   ```

10. **Burning Mechanism**: Check the current quarter, and if the burning quarter is reached, calculate and burn a percentage of BARK tokens.

...
```

## Getting Started

### Prerequisites

- Node.js
- Solana CLI
- TypeScript

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bark-community/bark-token.git
   cd bark-token
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

### Usage

1. **Initialize Connection**: Establish a connection to the Solana blockchain.

2. **Check Balance**: Verify the SOL balance of the wallet.

3. **Initialize Mint Account**: Create and initialize the BARK Mint Account.

4. **Initialize Solana Accounts**: Create source and destination token accounts for BARK tokens.

5. **Transfer BARK with Fee**: Transfer BARK tokens from the source account to the destination account with an associated fee.

6. **Withdraw Fees**: Withdraw accumulated fees from the destination account.

7. **Transfer BARK Again**: Perform another BARK transfer.

8. **Harvest Fees to Mint**: Harvest accumulated fees and transfer them back to the BARK Mint Account.

9. **Withdraw Fees Again**: Withdraw fees from the destination account.

10. **Burning Mechanism**: Check the current quarter, and if the burning quarter is reached, calculate and burn a percentage of BARK tokens.

### Documentation

For detailed documentation, architecture, and how the BARK Token Program works, refer to the [BARK Token Program Documentation](./docs/BARK_TOKEN_DOCUMENTATION.md).

## Contributing

Feel free to contribute by opening issues, proposing new features, or submitting pull requests. Contributions are welcome!

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

