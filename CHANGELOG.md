# Changes

**v.1.0.0**

This code has several improvements, error handling, and added functionalities. Some of the key changes include:

- Improved Error Handling: Added error handling throughout the code to catch and log errors, preventing unexpected crashes.

- Logging Transactions: Added a logTransactionDetails function to log transaction details, including the transaction signature.

- Metadata Handling: Updated metadata handling functions for initializing, updating, and removing metadata fields.

- Solana Connection: Moved the Solana connection initialization to a separate function.

- Fee Account Creation: Refactored fee account creation and added error handling.

- Withdraw Fees from Mint: Added functionality to withdraw fees from the Mint BARK Account.

- Improved Fee Harvesting: Enhanced the harvestWithheldTokensToMint function to handle the case where the fee account is not found.

- Balance Checking: Added functions to check both the BARK token balance and the wallet balance.

- Introduced functions getCurrentQuarter and calculateBurnAmount to handle the burning mechanism based on the current quarter and burning rate.

- Added the burnTokens function to initiate the burning process at the end of the main process.

- Called the burnTokens function at the end of the main function to burn tokens based on the configured burning mechanism.
  
