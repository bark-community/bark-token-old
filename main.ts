/**
 * Solana 2022 Token Script
 *
 * Description: This script provides functions for creating, initializing, and managing a Solana token.
 * It includes features such as minting, transferring with fees, withdrawing fees, burning BARK tokens, and more.
 *
 * Author: BARK Protocol
 * Date: March 13, 2024
 * Version: 1.0.3-Alpha
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
} from "@solana/spl-token";

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

// Constants and Configuration
const config = {
  FEE_BASIS_POINTS: 600,
  MAX_FEE: BigInt(800),
  MINT_AMOUNT: 20_000_000_000_000n,
  MAX_SUPPLY: BigInt("20000000000000"),
  TRANSFER_AMOUNT: BigInt(10_000),
  DECIMALS: 3,
  COMMITMENT_LEVEL: "confirmed",
  clusterUrl: clusterApiUrl("devnet"),
  TOKEN_2022_PROGRAM_ID: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
  BARK_ACCOUNT: new PublicKey('BARKhLzdWbyZiP3LNoD9boy7MrAy4CVXEToDyYGeEBKF'),
  FREEZE_AUTHORITY: new PublicKey('BARKhLzdWbyZiP3LNoD9boy7MrAy4CVXEToDyYGeEBKF'),
  BURN_WALLET_ADDRESS: "BURNF5qPfU1A9wSYCB4x4VUwQd398VHqwMHCCsDhp134",
  LAMPORTS_PER_SOL: 1000000000,
  BURN_START_QUARTER: 3,
  BURN_START_YEAR: 2024,
  BURN_RATE: 0.025,
};

// Connection to devnet cluster
const connection = new Connection(config.clusterUrl, config.COMMITMENT_LEVEL);

// BARK wallet
const payerWallet = pg?.wallet?.keypair;

// Generate a new keypair for the Mint BARK Account
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

// BARK Mint Authority and Transfer Fee Config Authority
const mintAuthority = pg?.wallet?.publicKey; // Ensure that `pg` and `wallet` are defined
const transferFeeConfigAuthority = pg?.wallet?.keypair;
const withdrawWithheldAuthority = pg?.wallet?.keypair;
const burnAuthority = pg?.wallet?.keypair;
const updateAuthority = pg?.wallet?.publicKey;

console.log("pg:", pg);
console.log("wallet:", pg?.wallet);
console.log("mintAuthority:", mintAuthority);
console.log("transferFeeConfigAuthority:", transferFeeConfigAuthority);
console.log("withdrawWithheldAuthority:", withdrawWithheldAuthority);
console.log("burnAuthority:", burnAuthority);
console.log("updateAuthority:", updateAuthority);

if (!updateAuthority) {
  throw new Error("Update authority is undefined.");
}

// Ensure FEE_ACCOUNT_SPACE is defined
const FEE_ACCOUNT_SPACE = getMintLen([ExtensionType.TransferFeeConfig]);

// Get the minimum balance for rent exemption for the fee account
const FEE_ACCOUNT_LAMPORTS = await connection.getMinimumBalanceForRentExemption(FEE_ACCOUNT_SPACE);

// Calculate minimum balance for rent exemption
const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// Define the decimals and the mint amount calculation
const totalSupply = BigInt("20000000000") * BigInt(10 ** 9);
const decimals = Math.max(0, Math.floor(Math.log10(Number(totalSupply) || 1)) - 8);

// BARK metadata to store in the Mint Account
const metaData: TokenMetadata = {
  updateAuthority: mintAuthority,
  mint: mint,
  name: "BARK",
  symbol: "BARK",
  uri: "https://raw.githubusercontent.com/bark-community/bark-token/main/src/assets/bark.svg",
  extensions: {
    website: "https://barkprotocol.net",
    socialMedia: {
      twitter: "https://twitter.com/bark_protocol",
      discord: "https://discord.gg/DncjRZQD",
      telegram: "https://t.me/+EnczyzzKS_k2NmQ0",
      additionalMetadata: [
        ["description", "BARK, a digital asset on the Solana blockchain, and is driven by community contributions."],
      ],
    },
  },
};

// Log debug information
console.log("metaData:", metaData);
console.log("updateAuthority:", mintAuthority);

// Initialize BARK Metadata Account data
const initializeMetadataInstruction = createInitializeInstruction({
  programId: TOKEN_2022_PROGRAM_ID, // SPL Token Extension Program as Metadata Program
  metadata: mint, // Account address that holds the BARK metadata
  updateAuthority: updateAuthority, // Ensure that `updateAuthority` is defined
  mint: mint, // Mint Account address
  mintAuthority: mintAuthority, // Designated Mint Authority
  name: metaData.name,
  symbol: metaData.symbol,
  uri: metaData.uri,
});

// Function to initialize the Solana connection
async function initializeConnection() {
  try {
    return new Connection(config.clusterUrl, config.COMMITMENT_LEVEL);
  } catch (error) {
    console.error("Error initializing Solana connection:", error.message);
    throw new Error("Failed to initialize Solana connection");
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
    console.error("Error creating fee account:", error.message);
    throw new Error(`Failed to create fee account: ${error.message}`);
  }
}

// Helper function to log transaction details
function logTransactionDetails(message, signature) {
  console.log(`\n${message}: https://solana.fm/tx/${signature}?cluster=devnet`);
}

// Function to create a Solana account with signature
async function createSolanaAccountWithSignature(instruction, signers = []) {
  try {
    const signature = await sendAndConfirmTransaction(connection, instruction, signers);
    logTransactionDetails("Transaction Signature", signature);
    return signature;
  } catch (error) {
    console.error("Error creating Solana account:", error.message);
    throw new Error("Failed to create Solana account");
  }
}

// Function to initialize the Mint Bark Account
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
    if (!sourceTokenAccount || !destinationTokenAccount) {
      console.error("Source or destination token account is undefined.");
      return;
    }

    const sourceAccountInfo = await connection.getAccountInfo(sourceTokenAccount);
    const sourceAccountBalance = sourceAccountInfo ? sourceAccountInfo.lamports : 0;
    console.log(`Source account balance before transfer: ${sourceAccountBalance}`);

    if (sourceAccountBalance < config.TRANSFER_AMOUNT) {
      console.error("Insufficient balance in source account for transfer.");
      return;
    }

    console.log("Source account:", sourceTokenAccount.toBase58());
    console.log("Destination account:", destinationTokenAccount.toBase58());

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

    const fee = (config.TRANSFER_AMOUNT * BigInt(config.FEE_BASIS_POINTS)) / BigInt(10_000);
    const feeCharged = fee > config.MAX_FEE ? Number(config.MAX_FEE) : Number(fee);

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
    console.error("Error transferring BARK with fee:", error.message);
    throw new Error("Failed to transfer BARK with fee");
  }
}

// Function to filter accounts to withdraw
async function filterAccountsToWithdraw(destinationTokenAccount, accountsToWithdrawFrom, programId) {
  try {
    const filteredAccounts = accountsToWithdrawFrom.filter(async (account) => {
      const accountInfo = await connection.getAccountInfo(account, config.COMMITMENT_LEVEL);
      // Add your custom logic to filter the accounts based on your requirements
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
    let feeAccountKey = new PublicKey(feeAccount);
    const feeAccountInfo = await connection.getAccountInfo(feeAccountKey, config.COMMITMENT_LEVEL);

    if (!feeAccountInfo) {
      console.log(`Fee account ${feeAccount} not found. Creating a new fee account...`);
      const newFeeAccount = await createFeeAccount(payerWallet);
      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
      feeAccountKey = newFeeAccount;
    } else {
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
          3,
          0,
          undefined,
          undefined,
          config.TOKEN_2022_PROGRAM_ID,
        );
        logTransactionDetails(`Harvested ${withheldAmount} fees to Mint BARK`, transferSignature);
      } else {
        console.log("No withheld fees to harvest to Mint BARK.");
      }
    }
  } catch (error) {
    console.error(`Error harvesting and transferring withheld fees to Mint BARK: ${error.message}`);
    throw new Error(`Failed to harvest and transfer withheld fees to Mint BARK: ${error.message}`);
  }
}

// Function to check the BARK account balance of the wallet
async function checkBarkBalance() {
  try {
    const ownerPublicKey = payerWallet.publicKey;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
      programId: config.TOKEN_2022_PROGRAM_ID,
      commitment: config.COMMITMENT_LEVEL,
    });

    const barkAccounts = tokenAccounts.value.filter(account => account.account.data.parsed.info.mint.equals(mint));

    if (barkAccounts.length > 0) {
      barkAccounts.forEach(account => {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmountString;
        console.log(`BARK account balance: ${balance} BARK`);
      });
    } else {
      console.log("No BARK accounts found for the wallet.");
    }
  } catch (error) {
    console.error("Error checking BARK token balance:", error.message);
    throw new Error("Failed to check BARK token balance");
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

function calculateBurnAmount(amount) {
  return BigInt(Math.floor(Number(amount) * config.BURN_RATE));
}

// Function to get the current quarter
function getCurrentQuarter() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startQuarter = new Date(`${currentYear}-01-01`);
  const quarters = Math.floor((currentMonth - 1) / 3) + 1;
  return quarters;
}

/// Function to burn tokens
async function burnTokens(tokenAccount, burnAmount) {
  try {
    const burnSignature = await transferCheckedWithFee(
      connection,
      payerWallet,
      tokenAccount,
      mint,
      null, // Burn authority doesn't require a destination account
      payerWallet.publicKey,
      burnAmount,
      0,
      0,
      undefined,
      undefined,
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

    // Ensure FEE_ACCOUNT_SPACE is defined
    const FEE_ACCOUNT_SPACE = getMintLen([ExtensionType.TransferFeeConfig]);

    const existingFeeAccount = "FEEUmDqQN9M4yQknTRYvwQhf2suJPMwcJWVtmuoRrYPM";
    const existingFeeAccountInfo = await connection.getAccountInfo(new PublicKey(existingFeeAccount), config.COMMITMENT_LEVEL);

    if (!existingFeeAccountInfo) {
      console.log(`Fee account ${existingFeeAccount} not found or implemented. Creating a new fee account...`);
      const newFeeAccount = await createFeeAccount(payerWallet);
      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
    } else {
      console.log(`Using existing fee account: ${existingFeeAccount}`);
    }

    await harvestWithheldTokensToMint(mint, existingFeeAccount);
    await withdrawFees(destinationTokenAccount, [], true);

    const burnQuarter = config.BURN_START_QUARTER; // Set the quarter when burning starts
    const currentQuarter = getCurrentQuarter();

    if (currentQuarter >= burnQuarter) {
      const accounts = await connection.getParsedTokenAccountsByOwner(burnAuthority.publicKey, {
        programId: config.TOKEN_2022_PROGRAM_ID,
        commitment: config.COMMITMENT_LEVEL,
      });

      const burnAccounts = accounts.value.filter(account => account.account.data.parsed.info.mint.equals(mint));

      if (burnAccounts.length > 0) {
        const totalBurnAmount = burnAccounts.reduce((total, account) => {
          return total + Number(account.account.data.parsed.info.tokenAmount.uiAmountString);
        }, 0);

        const burnAmount = calculateBurnAmount(totalBurnAmount);

        if (burnAmount > 0) {
          await burnTokens(burnAccounts[0].pubkey, burnAmount);
        } else {
          console.log("No BARK tokens to burn in this quarter.");
        }
      } else {
        console.log("No burn accounts found.");
      }
    } else {
      console.log(`Burning will start from Quarter ${burnQuarter}. Current Quarter: ${currentQuarter}`);
    }
  } catch (error) {
    console.error("Main process error:", error.message);
    throw new MainProcessError("Failed to execute main process");
  }
}

class MainProcessError extends Error {
  constructor(message) {
    super(message);
    this.name = "MainProcessError";
  }
}

// Execute the main process
await main();
