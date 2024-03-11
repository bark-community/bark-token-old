**File Structure:**

Create separate files for different functionalities:

1. `config.js`: Contains configuration settings.
2. `solana.js`: Handles Solana-related operations.
3. `token.js`: Manages token-related operations.
4. `fee.js`: Handles fee-related operations.
5. `metadata.js`: Manages Token Metadata operations.

**config.js:**
```javascript
// config.js
export const config = {
  FEE_BASIS_POINTS: 600,
  // ... other configuration settings
};

// Validate configuration
export function validateConfig() {
  // Add validation logic
}
```

**solana.js:**
```javascript
// solana.js
import { Connection, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { clusterApiUrl } from "@solana/web3.js";

export function initializeConnection() {
  return new Connection(config.clusterUrl, config.COMMITMENT_LEVEL);
}

export async function createSolanaAccountWithSignature(instruction, signers = []) {
  // ... existing implementation
}
```

**token.js:**
```javascript
// token.js
import { ExtensionType, TOKEN_2022_PROGRAM_ID, unpackAccount, createAccount, getTransferFeeAmount, /* ... */ } from "@solana/spl-token";

export async function initializeMintAccount() {
  // ... existing implementation
}

export async function initializeSolanaAccounts() {
  // ... existing implementation
}

export async function transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, mintAmount) {
  // ... existing implementation
}

// Add other token-related functions
```

**fee.js:**
```javascript
// fee.js
import { createFeeAccount, withdrawWithheldTokensFromAccounts, getMintLen } from "@solana/spl-token";
import { sendAndConfirmTransaction } from "@solana/web3.js";

export async function createFeeAccount(payer) {
  // ... existing implementation
}

export async function withdrawFees(destinationTokenAccount, accountsToWithdrawFrom, isMint = false) {
  // ... existing implementation
}

// Add other fee-related functions
```

**metadata.js:**
```javascript
// metadata.js
import { TokenMetadata, createInitializeInstruction, pack } from "@solana/spl-token-metadata";

export const metaData = {
  // ... existing metadata
};

export async function initializeMintAccountAndTokenMetadata() {
  // ... existing implementation
}

// Add other metadata-related functions
```

**main.js:**
```javascript
// main.js
import { config, validateConfig } from "./config";
import { initializeConnection, createSolanaAccountWithSignature } from "./solana";
import { initializeMintAccount, initializeSolanaAccounts, transferBarkWithFee } from "./token";
import { createFeeAccount, withdrawFees } from "./fee";
import { metaData, initializeMintAccountAndTokenMetadata } from "./metadata";

async function main() {
  try {
    validateConfig();

    const connection = initializeConnection();
    await checkBalance(connection);

    // ... rest of the main process
  } catch (error) {
    console.error("Main process error:", error.message);
    throw new Error("Failed to execute main process");
  }
}

main();
```

This separation of concerns makes your code more modular and maintainable. Adjust the details according to your specific needs.
