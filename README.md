
![BARK Hero Image](https://github.com/bark-community/bark-token/assets/bark-banner.png)


# BARK Programs
v1.0.0 Alpha

<small>[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)</small>


The BARK Program is developed to support the ecosystem of a decentralized application (DApp), supporting the Solana 2022 Token Standard (Extension). It is built on the Solana blockchain, facilitating the creation, transfer, and management of the BARK tokens and transaction fees. BARK is a digital asset on the Solana blockchain driven by community contributions.

## Table of Contents

- [Architecture](#architecture)
- [Frameworks and Libraries](#frameworks-and-libraries)
- [Features](#features)
- [Fee Structure](#fee-structure)
- [How it Works](#how-it-works)
- [Getting Started](#getting-started)
- [Solana 2022 Token Standard](#solana-2022-token-standard)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture<a name="architecture"></a>

The BARK Program follows a modular and scalable architecture on the Solana blockchain, implemented using TypeScript, Rust, and the Anchor frameworks.

### Solana Blockchain

The BARK Program leverages the Solana blockchain for its decentralized infrastructure. Solana's high-performance architecture provides fast and cost-effective transactions.

### Rust Implementation

The core logic of the BARK Program is implemented in Rust, a powerful and efficient programming language for building programs (smart contracts) on Solana.

### Anchor: Solana Sealevel Framework

The Anchor framework is utilized to enhance the modularity and simplicity of the BARK Token Program. Anchor provides high-level abstractions for building Solana programs, making development more accessible and efficient.

### TypeScript

TypeScript is employed to improve code maintainability and developer experience. It adds static typing to the JavaScript language, catching potential errors during development.

## Features<a name="features"></a>

### Token Minting and Initialization

The program initializes the BARK by creating a Mint account, setting up minting authorities, and configuring transfer fees.

## BARK Transfer with Fee<a name="bark-transfer-with-fee"></a>

The BARK Protocol allows users to transfer BARK with an associated fee. It calculates and charges the fee during the transfer. The fee structure is as follows:

- Basic fee: 6%
- Maximum fee: 8%

## Fee Distribution<a name="fee-distribution"></a>

The distribution of fees collected during BARK transfers is designed to promote community engagement and support the growth of the BARK ecosystem. The fee distribution is as follows:

- **3% to the Community:**
  A portion of the fees, equivalent to 3%, is allocated to the broader community. This fund is intended to support community initiatives, events, and other activities that contribute to the overall well-being of the BARK community.

- **Governance Members and BARK Holders:**
  Governance members and BARK token holders are eligible to receive Treasury fees. This portion of the fees is dedicated to supporting governance decisions, community proposals, and other initiatives that contribute to the development of the BARK ecosystem.

This fee distribution model ensures a fair and inclusive approach to benefit both the broader community and those actively participating in the governance and holding BARK tokens.

### Treasury Fees

Governance members and BARK holders are eligible to receive a portion of the fees collected during BARK transfers. This fund, referred to as Treasury fees, is allocated to support community initiatives, governance decisions, and overall ecosystem growth.

This fee structure ensures community involvement, supports ecosystem development and provides incentives for Governance members and BARK holders to actively participate in the BARK ecosystem.


## Fee Structure<a name="fee-structure"></a>

The basic fee is 6%, and the maximum is 8%. Of the collected fees:
- 3% is distributed to the community.
- 3% goes to ecosystem development and the team.
- The last governance voting determines charitable aid distribution.

### Treasury Accounts & Fee Withdrawal

Users can withdraw fees from BARK Treasury Accounts (Governance), facilitating the distribution of collected fees.

### Fee Harvesting

The program enables the harvesting of withheld fees from fee accounts, transferring them to the Mint BARK Account.

### Balance Checking

The program provides functions to check the BARK token balance of a wallet and the overall Solana balance.

## How it Works<a name="how-it-works"></a>

1. **Initialization**: The program initializes the Solana connection, creates the BARK token Mint account, and sets up necessary authorities.

2. **Token Transfer with Fee**:
   - Users initiate BARK token transfers with fees using the `transferBarkWithFee` function.
   - The fee is calculated and charged during the transfer.

3. **Fee Withdrawal**:
   - Users can withdraw fees from BARK token accounts using the `withdrawFees` function.

4. **Fee Harvesting**:
   - The program can harvest withheld fees from fee accounts, transferring them to the Mint BARK Account.

5. **Balance Checking**:
   - Functions such as `checkBarkBalance` and `checkBalance` allow users to check BARK token and Solana balances.

## Getting Started<a name="getting-started"></a>

Tested Solana Playground.

### Prerequisites

Before you begin, make sure you have the following prerequisites installed on your machine:

- **Rust**: The Rust programming language is used for the core implementation of the BARK Token Program. Install Rust by following the instructions on the [official Rust website](https://www.rust-lang.org/tools/install).

- **Solana CLI**: The Solana Command Line Interface (CLI) is required for deploying and interacting with the BARK Token Program on the Solana blockchain. Install the Solana CLI by following the instructions on the [official Solana documentation](https://docs.solana.com/cli/install-solana-cli).

- **Node.js**: The BARK Token Program uses Node.js for running scripts and managing dependencies. Install Node.js by following the instructions on the [official Node.js website](https://nodejs.org/).

- **Anchor CLI**: The Anchor framework is used to enhance the modularity of the BARK Token Program. Install the Anchor CLI using the following command:

  ```bash
  npm install -g @coral-xyz/anchor
  ```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bark-community/bark-token.git
   ```

2. Build the Rust program (smart contract):

   ```bash
   cd bark-token/program
   cargo build-bpf
   ```

3. Deploy the program:

   ```bash
   solana program deploy target/deploy/bark_token.so
   ```

4. Replace placeholder values in the code with actual values.

5. Install Node.js dependencies:

   ```bash
   cd bark-token
   npm install
   ```

6. Run the program:

   ```bash
   npm start
   ```

## Solana 2022 Token Standard<a name="solana-2022-token-standard"></a>

The BARK Token Program adheres to the Solana 2022 Token Standard, ensuring compatibility and interoperability with other tokens on the Solana blockchain. For more information on the Solana 2022 Token Standard, please refer to the [official Solana documentation](https://docs.solana.com/developing/tokens/standards).

## Documentation<a name="documentation"></a>

For detailed information on the BARK Token Program, refer to the [Documentation](path/to/your/documentation).

## Contributing<a name="contributing"></a>

Contributions are welcome! Please read our [Contribution Guidelines](CONTRIBUTING.md) to get started.

## License<a name="license"></a>

[Apache License 2.0](LICENSE).
