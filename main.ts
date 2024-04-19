/**
 * Solana 2022 Token Script
 *
 * Description: This script provides functions for creating, initializing, and managing a Solana token.
 * It includes features such as minting, transferring with fees, withdrawing fees, burning BARK tokens, and more.
 *
 * Author: BARK Protocol
 * Date: March 20, 2024
 * Version: 1.0.4-Alpha
 *
 * Libraries:
 * - @solana/web3.js: Solana Web3 library for interacting with the Solana blockchain.
 * - @solana/spl-token: Solana SPL Token library for BARK token-related operations.
 * - @solana/spl-token-metadata: Solana SPL Token Metadata library for managing BARK token metadata.
 */

import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";

import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAccount,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  getTransferFeeAmount,
  mintTo,
  transferCheckedWithFee,
  unpackAccount,
  withdrawWithheldTokensFromAccounts,
  getMetadataPointerState,
  getTokenMetadata,
  TYPE_SIZE,
  LENGTH_SIZE,
  transferChecked,
} from "@solana/spl-token";

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

// Define and initialize configuration parameters
const config = {
  COMMITMENT_LEVEL: "confirmed",
  clusterUrl: clusterApiUrl("devnet"),
  FEE_BASIS_POINTS: 500, // 5%
  MAX_FEE: BigInt(800), // 8%
  MINT_AMOUNT: 20_000_000_000_000n, // 20 Billion tokens
  DECIMALS: 3,
  MAX_SUPPLY: BigInt("20000000000000"),
  TRANSFER_AMOUNT: BigInt(10_000),
  LAMPORTS_PER_SOL: 1000000000,
  BURN_START_QUARTER: 3,
  BURN_START_YEAR: 2024,
  BURN_RATE: 0.025,
  TOKEN_2022_PROGRAM_ID: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
  BARK_ACCOUNT: new PublicKey('BARKhLzdWbyZiP3LNoD9boy7MrAy4CVXEToDyYGeEBKF'),
  FREEZE_AUTHORITY: new PublicKey('BARKhLzdWbyZiP3LNoD9boy7MrAy4CVXEToDyYGeEBKF'),
  BURN_WALLET_ADDRESS: "BURNF5qPfU1A9wSYCB4x4VUwQd398VHqwMHCCsDhp134",
};

// Connection to devnet cluster
const connection = new Connection(config.clusterUrl, config.COMMITMENT_LEVEL);

// BARK wallet
let payerWallet;
if (pg && pg.wallet && pg.wallet.keypair) {
  payerWallet = pg.wallet.keypair;
} else {
  console.error("Error: Unable to access payer wallet keypair.");
  throw new Error("Unable to access payer wallet keypair.");
}

// Generate a new keypair for the Mint BARK Account
let mintKeypair;
try {
  mintKeypair = Keypair.generate();
} catch (error) {
  console.error("Error generating keypair for the Mint BARK Account:", error.message);
  throw new Error("Failed to generate keypair for the Mint BARK Account");
}
const mint = mintKeypair.publicKey;

// BARK Mint Authority and Transfer Fee Config Authority
const mintAuthority = pg?.wallet?.publicKey; // Ensure that `pg` and `wallet` are defined
const transferFeeConfigAuthority = pg?.wallet?.keypair;
const withdrawWithheldAuthority = pg?.wallet?.keypair;
const burnAuthority = pg?.wallet?.keypair;
const updateAuthority = pg?.wallet?.publicKey;
if (!updateAuthority) {
  throw new Error("Update authority is undefined.");
}

// Define the total supply and calculate decimals
const totalSupply = BigInt("20000000000") * BigInt(10 ** 9);
const decimals = 3; // Assuming 9 decimal places based on the provided calculation

// Calculate the scale factor for the decimals
const scaleFactor = BigInt(10 ** decimals);

// Define the mint amount based on max supply and decimals
const mintAmount = totalSupply * scaleFactor;

/**
 * Function to initialize fee account space
 * @param {Connection} connection - The connection to the Solana cluster
 * @returns {Promise<{FEE_ACCOUNT_SPACE: number, FEE_ACCOUNT_LAMPORTS: number}>} - The fee account space and lamports
 * @throws Will throw an error if failed to initialize fee account space
 */
async function initializeFeeAccountSpace(connection) {
  try {
    // Ensure FEE_ACCOUNT_SPACE is defined
    const FEE_ACCOUNT_SPACE = getMintLen([ExtensionType.TransferFeeConfig]);

    // Get the minimum balance for rent exemption for the fee account
    const FEE_ACCOUNT_LAMPORTS = await connection.getMinimumBalanceForRentExemption(FEE_ACCOUNT_SPACE);

    return { FEE_ACCOUNT_SPACE, FEE_ACCOUNT_LAMPORTS };
  } catch (error) {
    console.error("Error initializing fee account space:", error.message);
    throw new Error("Failed to initialize fee account space");
  }
}

// Call the function to initialize fee account space
const { FEE_ACCOUNT_SPACE, FEE_ACCOUNT_LAMPORTS } = await initializeFeeAccountSpace(connection);
console.log("FEE_ACCOUNT_SPACE:", FEE_ACCOUNT_SPACE);
console.log("FEE_ACCOUNT_LAMPORTS:", FEE_ACCOUNT_LAMPORTS);


// Calculate minimum balance for rent exemption
const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// Log debug information
console.log("pg:", pg);
console.log("wallet:", pg?.wallet);
console.log("mintAuthority:", mintAuthority);
console.log("transferFeeConfigAuthority:", transferFeeConfigAuthority);
console.log("withdrawWithheldAuthority:", withdrawWithheldAuthority);
console.log("burnAuthority:", burnAuthority);
console.log("metaData:", metaData);
console.log("updateAuthority:", updateAuthority);

// Define BARK metadata to store in the Mint Account
const metaData = {
  updateAuthority: mintAuthority,
  mint: mint,
  name: "BARK",
  symbol: "BARK",
  uri: "https://github.com/bark-community/bark-token/blob/d97f533bbe934c60d0dac3a707125d055f115472/src/assets/bark.png",
  extensions: {
    website: "https://barkprotocol.net",
    socialMedia: {
      twitter: "https://twitter.com/bark_protocol",
      discord: "https://discord.gg/DncjRZQD",
      telegram: "https://t.me/+EnczyzzKS_k2NmQ0",
      additionalMetadata: [
        ["description", "BARK, a digital asset on the Solana blockchain, driven by community contributions."],
      ],
    },
  },
};

// Initialize BARK Metadata Account data
const initializeMetadataInstruction = await createInitializeInstruction({
  programId: TOKEN_2022_PROGRAM_ID, // SPL Token Extension Program as Metadata Program
  mint: mint, // Mint Account address
  updateAuthority: updateAuthority, // Ensure that `updateAuthority` is defined
  metadata: mint, // Account address that holds the BARK metadata (typically same as mint for simplicity)
  mintAuthority: mintAuthority, // Designated Mint Authority
  data: {
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
    ...metaData.extensions, // Spread additional metadata extensions
  },
});

// Helper function for error handling
function handleError(error, errorMessage) {
  console.error(errorMessage, error);
  throw new Error(errorMessage);
}

// Helper function to log transaction details
function logTransactionDetails(message, signature) {
  console.log(`\n${message}: https://solana.fm/tx/${signature}?cluster=devnet`);
}

// Function to initialize the Solana connection
async function initializeConnection() {
  try {
    const connection = new Connection(config.clusterUrl, config.COMMITMENT_LEVEL);
    return connection;
  } catch (error) {
    handleError(error, "Error initializing Solana connection");
  }
}

// Function to create a new fee account
async function createFeeAccount(payer) {
  try {
    const newFeeAccountKeypair = Keypair.generate();
    const newFeeAccount = newFeeAccountKeypair.publicKey;

    const createFeeAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newFeeAccount,
      space: FEE_ACCOUNT_SPACE,
      lamports: FEE_ACCOUNT_LAMPORTS,
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const createFeeAccountTransaction = new Transaction().add(createFeeAccountInstruction);

    await sendAndConfirmTransaction(connection, createFeeAccountTransaction, [payer, newFeeAccountKeypair]);

    console.log(`New fee account created: ${newFeeAccount.toBase58()}`);
    return newFeeAccount;
  } catch (error) {
    handleError(error, "Error creating fee account");
  }
}

// Function to create a Solana account with signature
async function createSolanaAccountWithSignature(instruction, signers = []) {
  try {
    // Validate parameters
    if (!(instruction instanceof Transaction)) {
      throw new Error("Invalid instruction. Expected a Transaction object.");
    }
    if (!Array.isArray(signers) || signers.length === 0) {
      throw new Error("Invalid signers array. At least one signer is required.");
    }

    console.log("Sending transaction to create Solana account...");

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(connection, instruction, signers);

    console.log("Transaction successful. Signature:", signature);

    return signature;
  } catch (error) {
    console.error("Error creating Solana account with signature:", error.message);
    throw new Error("Failed to create Solana account with signature");
  }
}

// Function to initialize the Mint BARK Account
async function initializeMintAccount() {
  try {
    const transaction = new Transaction()
      .add(
        SystemProgram.createAccount({
          fromPubkey: payerWallet.publicKey,
          newAccountPubkey: mint,
          space: mintLen,
          lamports,
          programId: config.TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
          mint,
          transferFeeConfigAuthority.publicKey,
          withdrawWithheldAuthority.publicKey,
          config.FEE_BASIS_POINTS,
          config.MAX_FEE,
          config.TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(
          mint,
          config.DECIMALS,
          mintAuthority,
          null,
          config.TOKEN_2022_PROGRAM_ID,
        ),
      );

    const transactionSignature = await createSolanaAccountWithSignature(transaction, [payerWallet, mintKeypair]);
    logTransactionDetails("Create Solana Account", transactionSignature);
  } catch (error) {
    console.error("Error initializing Mint BARK Account:", error.message);
    throw new Error("Failed to initialize Mint BARK Account");
  }
}

// Function to initialize the Mint BARK Account and Token Metadata
async function initializeMintAccountAndTokenMetadata() {
  try {
    // Step 1: Initialize Mint BARK Account
    await initializeMintAccount();

    // Step 2: Add Token Metadata logic here
    // For example:
    // - Create a new token metadata account
    // - Set metadata for the Mint BARK Account
    // - Configure additional metadata properties

    // Note: Customize this section based on token metadata requirements

  } catch (error) {
    console.error("Error initializing Mint Account and BARK Token Metadata:", error.message);
    throw new Error("Failed to initialize Mint Account and BARK Token Metadata");
  }
}

// Function to initialize Solana accounts
async function initializeSolanaAccounts() {
  try {
    const sourceOwnerKeypair = payerWallet;
    const sourceTokenAccount = await createAccount(
      connection,
      sourceOwnerKeypair,
      mint,
      sourceOwnerKeypair.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    const destinationOwnerKeypair = Keypair.generate();
    const destinationTokenAccount = await createAccount(
      connection,
      payerWallet,
      mint,
      destinationOwnerKeypair.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    return [sourceTokenAccount, destinationTokenAccount];
  } catch (error) {
    console.error("Error initializing Solana accounts:", error.message);
    throw new Error("Failed to initialize Solana accounts");
  }
}

// Function to perform a BARK token transfer with fee
async function transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, mintAmount) {
  try {
    // Check if source and destination token accounts are defined
    if (!sourceTokenAccount || !destinationTokenAccount) {
      console.error("Source or destination token account is undefined.");
      return;
    }

    // Retrieve source account information
    const sourceAccountInfo = await connection.getAccountInfo(sourceTokenAccount);
    const sourceAccountBalance = sourceAccountInfo ? sourceAccountInfo.lamports : 0;
    console.log(`Source account balance before transfer: ${sourceAccountBalance}`);

    // Check if source account has sufficient balance for transfer
    if (sourceAccountBalance < config.TRANSFER_AMOUNT) {
      console.error("Insufficient balance in source account for transfer.");
      return;
    }

    console.log("Source account:", sourceTokenAccount.toBase58());
    console.log("Destination account:", destinationTokenAccount.toBase58());

    // Mint BARK tokens to the source account
    const mintToSignature = await mintTo(
      connection,
      payerWallet,
      mint,
      sourceTokenAccount,
      mintAuthority,
      mintAmount,
      undefined,
      undefined,
      config.TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Mint BARK", mintToSignature);

    // Calculate the fee to be charged
    const fee = (config.TRANSFER_AMOUNT * BigInt(config.FEE_BASIS_POINTS)) / BigInt(10_000);
    const feeCharged = fee > config.MAX_FEE ? Number(config.MAX_FEE) : Number(fee);

    // Transfer BARK tokens with fee to the destination account
    const transferSignature = await transferCheckedWithFee(
      connection,
      payerWallet,
      sourceTokenAccount,
      mint,
      destinationTokenAccount,
      payerWallet.publicKey,
      config.TRANSFER_AMOUNT,
      3,
      feeCharged,
      undefined,
      undefined,
      config.TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Transfer BARK", transferSignature);
  } catch (error) {
    handleError(error, "Error transferring BARK with fee");
  }
}

// Function to filter accounts to withdraw
async function filterAccountsToWithdraw(destinationTokenAccount, accountsToWithdrawFrom, programId) {
  try {
    // Use Promise.all() to concurrently fetch account info for all accounts
    const accountInfoPromises = accountsToWithdrawFrom.map(account => connection.getAccountInfo(account, config.COMMITMENT_LEVEL));
    const accountInfos = await Promise.all(accountInfoPromises);

    // Filter accounts based on programId
    const filteredAccounts = accountsToWithdrawFrom.filter((account, index) => {
      const accountInfo = accountInfos[index];
      return accountInfo && accountInfo.owner.equals(programId);
    });

    return filteredAccounts;
  } catch (error) {
    console.error("Error filtering accounts to withdraw:", error.message);
    throw new Error("Failed to filter accounts to withdraw");
  }
}

// Function to handle fee withdrawal
async function withdrawFees(destinationTokenAccount, accountsToWithdrawFrom, isMint = false) {
  try {
    const filteredAccounts = await filterAccountsToWithdraw(
      destinationTokenAccount,
      accountsToWithdrawFrom,
      TOKEN_2022_PROGRAM_ID
    );

    if (filteredAccounts.length > 0) {
      console.log("Accounts selected for withdrawal:", filteredAccounts.map(account => account.toString()));

      const withdrawSignature = await withdrawWithheldTokensFromAccounts(
        connection,
        payerWallet,
        mint,
        destinationTokenAccount,
        withdrawWithheldAuthority,
        undefined,
        filteredAccounts,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      logTransactionDetails(`Withdraw Fee${isMint ? ' from Mint' : ''}`, withdrawSignature);
    } else {
      console.log(`No fees to withdraw${isMint ? ' from Mint' : ''}.`);
    }
  } catch (error) {
    console.error("Error withdrawing fees:", error.message);
    throw new Error("Failed to withdraw fees");
  }
}

// Function to harvest withheld fees and transfer to Mint BARK Account
async function harvestWithheldTokensToMint(mintAccount, feeAccount) {
  try {
    const feeAccountKey = new PublicKey(feeAccount);
    const feeAccountInfo = await connection.getAccountInfo(feeAccountKey, config.COMMITMENT_LEVEL);

    if (!feeAccountInfo) {
      console.log(`Fee account ${feeAccount} not found. Creating a new fee account...`);
      const newFeeAccount = await createFeeAccount(payerWallet);
      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
      return newFeeAccount;
    }

    const feeAccountData = unpackAccount(feeAccountKey, feeAccountInfo.data, config.TOKEN_2022_PROGRAM_ID);
    const withheldAmount = getTransferFeeAmount(feeAccountData)?.withheldAmount || 0;

    if (withheldAmount > 0) {
      const transferSignature = await transferCheckedWithFee(
        connection,
        payerWallet,
        feeAccountKey,
        mintAccount,
        mintAuthority,
        withheldAmount,
        9,
        0,
        undefined,
        undefined,
        config.TOKEN_2022_PROGRAM_ID,
      );
      logTransactionDetails(`Harvested ${withheldAmount} fees to Mint BARK`, transferSignature);
    } else {
      console.log("No withheld fees to harvest to Mint BARK.");
    }
  } catch (error) {
    console.error(`Error harvesting and transferring withheld fees to Mint BARK: ${error.message}`);
    throw new Error(`Failed to harvest and transfer withheld fees to Mint BARK: ${error.message}`);
  }
}

// Function to check the balance of the wallet
async function checkBalance() {
  try {
    const balance = await connection.getBalance(payerWallet.publicKey);
    console.log(`BARK account balance: ${balance / config.LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Error checking wallet balance:", error.message);
    throw new Error("Failed to check wallet balance");
  }
}

// Calculate Token Burn Amount
function calculateBurnAmount(amount) {
  // Ensure that the burn amount is always rounded down to the nearest integer
  return BigInt(Math.floor(Number(amount) * config.BURN_RATE));
}

// Function to get the current quarter
function getCurrentQuarter() {
  // Use UTC methods to ensure consistency across time zones
  const currentDate = new Date();
  const currentMonth = currentDate.getUTCMonth() + 1; // Month index starts from 0
  return Math.floor((currentMonth - 1) / 3) + 1;
}

// Function to burn tokens
async function burnTokens(tokenAccount, burnAmount) {
  try {
    // Ensure that burnAmount is a positive BigInt value
    if (burnAmount <= 0n) {
      console.error("Invalid burn amount:", burnAmount);
      return;
    }

    // Perform the BARK token burn
    const burnSignature = await transferChecked(
      connection,
      payerWallet,
      tokenAccount,
      null, // Burn authority doesn't require a mint parameter
      payerWallet.publicKey, // Destination account is the same as the payer's account
      burnAmount,
      config.TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Burn BARK Tokens", burnSignature);
  } catch (error) {
    console.error("Error burning BARK tokens:", error.message);
    throw new Error("Failed to burn BARK tokens");
  }
}

// Main function to orchestrate the entire process.
async function main() {
  try {
    await checkBalance();
    await initializeMintAccountAndTokenMetadata();
    const [sourceTokenAccount, destinationTokenAccount] = await initializeSolanaAccounts();
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, config.MINT_AMOUNT);
    await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);

    // Check if the current quarter is greater than or equal to the burn start quarter
    const currentQuarter = getCurrentQuarter();
    if (currentQuarter >= config.BURN_START_QUARTER) {
      console.log("Quarter >= BURN_START_QUARTER. Burning tokens...");
      
      // Calculate the burn amount based on the configured burn rate
      const burnAmount = calculateBurnAmount(config.MINT_AMOUNT);
      console.log("Burn amount:", burnAmount);

      // Burn tokens only if the calculated burn amount is positive
      if (burnAmount > 0n) {
        await burnTokens(destinationTokenAccount, burnAmount);
      } else {
        console.log("No tokens to burn.");
      }
    } else {
      console.log("Quarter < BURN_START_QUARTER. Skipping token burn.");
    }
  } catch (error) {
    console.error("Error in main process:", error.message);
    throw new Error("Main process failed");
  }
}

// Run the main function
main();
