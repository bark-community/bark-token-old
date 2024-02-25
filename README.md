
![BARK Hero Image](https://github.com/bark-community/bark-token/assets/bark-banner.png)


# BARK Programs
v1.0.0 Alpha

<small>[![License: MIT](https://img.shields.io/badge/License-mit-blue.svg)](https://opensource.org/licenses/MIT)</small>

The BARK Token Program is a Solana-based smart contract that facilitates the creation, transfer, and management of BARK tokens on the Solana blockchain. BARK is a digital asset with additional features, including a transfer fee mechanism and a burning mechanism.

## Features

- **Minting BARK Tokens**: Create new BARK tokens by initializing the BARK Mint Account.

- **Transfer with Fee**: Transfer BARK tokens with an associated fee, calculated based on the configured basis points and a maximum fee.

- **Fee Harvesting**: Accumulated fees in fee accounts can be harvested and transferred back to the BARK Mint Account.

- **Burning Mechanism**: A burning mechanism burns a percentage of BARK tokens each quarter, starting from a specified quarter.

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
