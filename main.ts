import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  ExtensionType,
  TOKEN_PROGRAM_ID,
  createAccount,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  getTransferFeeAmount,
  harvestWithheldTokensToMint as harvestWithheldTokensToMintModule,
  mintTo,
  transferCheckedWithFee,
  unpackAccount,
  withdrawWithheldTokensFromAccounts,
} from "@solana/spl-token";

// Constants and Configuration
const FEE_BASIS_POINTS = 300;
const MAX_FEE = BigInt(800);
const MINT_AMOUNT = 20_000_000_000_000n;
const TRANSFER_AMOUNT = BigInt(100000);
const DECIMALS = 3;
const COMMITMENT_LEVEL = "confirmed";
const clusterUrl = clusterApiUrl("devnet");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// Connection to devnet cluster
const connection = new Connection(clusterUrl, COMMITMENT_LEVEL);

// BARK wallet
const payerWallet = pg.wallet.keypair; // Ensure that `pg` is defined

// Generate a new keypair for the Mint BARK Account
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

// BARK Mint Authority and Transfer Fee Config Authority
const mintAuthority = pg.wallet.publicKey; // Ensure that `pg` is defined
const transferFeeConfigAuthority = pg.wallet.keypair;
const withdrawWithheldAuthority = pg.wallet.keypair;

// Calculate minimum balance for rent exemption
const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// BARK details
const tokenMetadata = {
  name: "Bark",
  symbol: "BARK",
  website: "https://barkprotocol.net",
  logoUrl: "https://raw.githubusercontent.com/bark-community/bark-token/bob/main/bark/assets/bark.png",
  socialMedia: {
    twitter: "https://x.com/bark_protocol",
    discord: "https://discord.gg/bark-protocol-en",
    telegram: "https://telegram.com/t.me/bark",
  },
  metadata: {
    description: "BARK, a digital asset on the Solana blockchain, token extension, and is driven by community contributions.",
  },
};

// Function to initialize the Solana connection
async function initializeConnection(): Promise<Connection> {
  try {
    return new Connection(clusterUrl, COMMITMENT_LEVEL);
  } catch (error) {
    console.error("Error initializing Solana connection:", error.message);
    throw error;
  }
}

// Function to create a new fee account
async function createFeeAccount(payer: Keypair): Promise<PublicKey> {
  try {
    const newFeeAccountKeypair = Keypair.generate();
    const newFeeAccount = newFeeAccountKeypair.publicKey;

    // Adjust the space based on BARK requirements
    const feeAccountSpace = 165; // Replace this with the actual value
    const feeAccountLamports = await connection.getMinimumBalanceForRentExemption(feeAccountSpace);

    const createFeeAccountInstruction = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newFeeAccount,
      space: feeAccountSpace,
      lamports: feeAccountLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const createFeeAccountTransaction = new Transaction().add(createFeeAccountInstruction);

    await sendAndConfirmTransaction(connection, createFeeAccountTransaction, [payer, newFeeAccountKeypair]);

    console.log(`New fee account created: ${newFeeAccount.toBase58()}`);
    return newFeeAccount;
  } catch (error) {
    console.error("Error creating fee account:", error.message);
    throw error;
  }
}

// Helper function to log transaction details
function logTransactionDetails(message: string, signature: string) {
  console.log(`\n${message}: https://solana.fm/tx/${signature}?cluster=devnet`);
}

// Function to create a Solana account with signature
async function createSolanaAccountWithSignature(instruction: Transaction, signers: Keypair[] = []): Promise<string> {
  try {
    const signature = await sendAndConfirmTransaction(connection, instruction, signers);
    logTransactionDetails("Transaction Signature", signature);
    return signature;
  } catch (error) {
    console.error("Error creating Solana account:", error.message);
    throw error;
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
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
          mint,
          transferFeeConfigAuthority.publicKey,
          withdrawWithheldAuthority.publicKey,
          FEE_BASIS_POINTS,
          MAX_FEE,
          TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(
          mint,
          DECIMALS,
          mintAuthority,
          null,
          TOKEN_2022_PROGRAM_ID,
        ),
      );

    const transactionSignature = await createSolanaAccountWithSignature(transaction, [payerWallet, mintKeypair]);
    logTransactionDetails("Create Solana Account", transactionSignature);
  } catch (error) {
    console.error("Error initializing Mint Bark Account:", error.message);
    throw error;
  }
}

// Function to initialize Solana accounts
async function initializeSolanaAccounts(): Promise<[PublicKey, PublicKey]> {
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
    throw error;
  }
}

// Function to perform a BARK token transfer with fee
async function transferBarkWithFee(
  sourceTokenAccount: PublicKey,
  destinationTokenAccount: PublicKey,
  mintAmount: bigint
) {
  try {
    if (!sourceTokenAccount || !destinationTokenAccount) {
      console.error("Source or destination token account is undefined.");
      return;
    }

    const sourceAccountInfo = await connection.getAccountInfo(sourceTokenAccount);
    const sourceAccountBalance = sourceAccountInfo ? sourceAccountInfo.lamports : 0;
    console.log(`Source account balance before transfer: ${sourceAccountBalance}`);

    if (sourceAccountBalance < TRANSFER_AMOUNT) {
      console.error("Insufficient balance in source account for transfer.");
      return;
    }

    // Log source and destination accounts
    console.log("Source account:", sourceTokenAccount.toBase58());
    console.log("Destination account:", destinationTokenAccount.toBase58());

    // Mint BARK
    const mintToSignature = await mintTo(
      connection,
      payerWallet,
      mint,
      sourceTokenAccount,
      mintAuthority,
      mintAmount,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Mint BARK", mintToSignature);

    // Calculate and charge fee
    const fee = (TRANSFER_AMOUNT * BigInt(FEE_BASIS_POINTS)) / BigInt(10_000);
    const feeCharged = fee > MAX_FEE ? MAX_FEE : fee;

    // Transfer BARK with fee
    const transferSignature = await transferCheckedWithFee(
      connection,
      payerWallet,
      sourceTokenAccount,
      mint,
      destinationTokenAccount,
      payerWallet.publicKey,
      TRANSFER_AMOUNT,
      3,
      feeCharged,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Transfer BARK", transferSignature);
  } catch (error) {
    console.error("Error transferring BARK with fee:", error.message);
    throw error;
  }
}

// Function to handle fee withdrawal
async function withdrawFees(destinationTokenAccount: PublicKey, accountsToWithdrawFrom: PublicKey[], isMint = false) {
  try {
    // Get all accounts related to the Token-2022 Program and BARK mint
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      commitment: COMMITMENT_LEVEL,
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: mint.toString(),
          },
        },
      ],
    });

    // Filter accounts with withheld fees
    const filteredAccounts = allAccounts
      .filter(accountInfo => {
        const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
        const transferFeeAmount = getTransferFeeAmount(account);
        return (
          transferFeeAmount !== null &&
          transferFeeAmount.withheldAmount > 0 &&
          accountsToWithdrawFrom.includes(accountInfo.pubkey)
        );
      });

    if (filteredAccounts.length > 0) {
      console.log("Accounts selected for withdrawal:", filteredAccounts.map(account => account.pubkey.toString()));

      // Withdraw withheld fees
      const withdrawSignature = await withdrawWithheldTokensFromAccounts(
        connection,
        payerWallet,
        mint,
        destinationTokenAccount,
        withdrawWithheldAuthority,
        undefined,
        filteredAccounts.map(accountInfo => accountInfo.pubkey),
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      logTransactionDetails(`Withdraw Fee${isMint ? ' from Mint' : ''}`, withdrawSignature);
    } else {
      console.log(`No fees to withdraw${isMint ? ' from Mint' : ''}.`);
    }
  } catch (error) {
    console.error("Error withdrawing fees:", error.message);
    throw error;
  }
}

// Function to harvest withheld fees and transfer to Mint BARK Account
async function harvestWithheldTokensToMint(mintAccount: PublicKey, feeAccount: string) {
  try {
    // Convert fee account string to PublicKey
    const feeAccountKey = new PublicKey(feeAccount);
    const feeAccountInfo = await connection.getAccountInfo(feeAccountKey, COMMITMENT_LEVEL);

    if (!feeAccountInfo) {
      console.log(`Fee account ${feeAccount} not found.`);
      return;
    }

    const feeAccountData = unpackAccount(feeAccountKey, feeAccountInfo.data, TOKEN_2022_PROGRAM_ID);
    const withheldAmount = getTransferFeeAmount(feeAccountData)?.withheldAmount || 0;

    if (withheldAmount > 0) {
      // Transfer withheld fees to Mint BARK
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
        TOKEN_2022_PROGRAM_ID,
      );
      logTransactionDetails(`Harvested ${withheldAmount} fees to Mint BARK`, transferSignature);
    } else {
      console.log("No withheld fees to harvest to Mint BARK.");
    }
  } catch (error) {
    console.error("Error harvesting and transferring withheld fees to Mint BARK:", error.message);
    throw error;
  }
}

// Function to check the BARK account balance of the wallet
async function checkBarkBalance() {
  try {
    const ownerPublicKey = payerWallet.publicKey;

    // Get parsed token accounts by owner
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
      commitment: COMMITMENT_LEVEL,
    });

    // Filter BARK accounts
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
  }
}

// Function to check the balance of the wallet
async function checkBalance() {
  try {
    const balance = await connection.getBalance(payerWallet.publicKey);
    console.log(`BARK account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Error checking wallet balance:", error.message);
  }
}

// Main function to orchestrate the entire process.
async function main() {
  try {
    // Check wallet balance
    await checkBalance();

    // Initialize Solana connection
    const connection = await initializeConnection();

    // Initialize Mint and Token Accounts
    await initializeMintAccount();
    const [sourceTokenAccount, destinationTokenAccount] = await initializeSolanaAccounts();

    // Transfer BARK with Fee
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);

    // Withdraw Fees from BARK accounts
    await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);

    // Transfer BARK with Fee again (for testing)
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);

    // Try to find the existing fee account
    const existingFeeAccount = "feehVvkc5QiSu269NzHvf2TgyvhEwC5t4UxNZeMfzFS";
    const existingFeeAccountInfo = await connection.getAccountInfo(new PublicKey(existingFeeAccount), COMMITMENT_LEVEL);

    if (!existingFeeAccountInfo) {
      console.log(`Fee account ${existingFeeAccount} not found. Creating a new fee account...`);

      // Create a new fee account
      const newFeeAccount = await createFeeAccount(payerWallet);

      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
    } else {
      console.log(`Using existing fee account: ${existingFeeAccount}`);
    }

    // Now you can use either the existing fee account or the newly created one in the subsequent transactions.

    // Harvest withheld fees from the existing fee account and transfer to Mint BARK Account
    await harvestWithheldTokensToMint(mint, existingFeeAccount);

    // Withdraw Fees from Mint BARK Account
    await withdrawFees(destinationTokenAccount, [], true);
  } catch (error) {
    console.error("Main process error:", error.message);
  }
}

// Function to check the BARK account balance of the wallet
async function checkBarkBalance() {
  try {
    const ownerPublicKey = payerWallet.publicKey;

    // Get parsed token accounts by owner
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
      commitment: COMMITMENT_LEVEL,
    });

    // Filter BARK accounts
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
  }
}

// Function to check the balance of the wallet
async function checkBalance() {
  try {
    const balance = await connection.getBalance(payerWallet.publicKey);
    console.log(`BARK account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Error checking wallet balance:", error.message);
  }
}

// Execute the main function
main();
