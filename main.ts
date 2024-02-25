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

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

// Constants and Configuration
const FEE_BASIS_POINTS = 300;
const MAX_FEE = BigInt(800);
const MINT_AMOUNT = 20_000_000_000_000n;
const TRANSFER_AMOUNT = BigInt(100000);
const DECIMALS = 3;
const COMMITMENT_LEVEL = "confirmed";
const clusterUrl = clusterApiUrl("devnet");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// Define LAMPORTS_PER_SOL
const LAMPORTS_PER_SOL = 1000000000; // 1 SOL = 1,000,000,000 lamports

// Burning Mechanism and Configuration
const BURN_START_QUARTER = 3; // Burning starts on Q3, 2024
const BURN_RATE = 0.02; // 2% quarterly burning rate

// Connection to devnet cluster
const connection = await initializeConnection();

// BARK wallet
const payerWallet = pg.wallet.keypair; // Ensure that `pg` is defined

// Generate a new keypair for the Mint BARK Account
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

// BARK Mint Authority and Transfer Fee Config Authority
const mintAuthority = pg.wallet.publicKey; // Ensure that `pg` is defined
const transferFeeConfigAuthority = pg.wallet.keypair;
const withdrawWithheldAuthority = pg.wallet.keypair;
const burnAuthority = pg.wallet.keypair; // Burn authority added

// Calculate minimum balance for rent exemption
const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

// BARK metadata to store in the Mint Account
const metaData: TokenMetadata = {
  updateAuthority: mintAuthority, // Replace with the appropriate authority
  name: "BARK",
  symbol: "BARK",
  uri: "https://raw.githubusercontent.com/bark-community/bark-token/bob/main/bark/assets/bark.png",
  media: {
    website: "https://barkprotocol.net",
    socialMedia: {
      twitter: "https://x.com/bark_protocol",
      discord: "https://discord.gg/bark-protocol-en",
      telegram: "https://telegram.com/t.me/bark_protocol",
      additionalMetadata: [
        ["description", "BARK, a digital asset on the Solana blockchain, SPL token extension, and is driven by community contributions."],
      ],
    },
  },
};

// Function to initialize the Solana connection
async function initializeConnection() {
  try {
    return new Connection(clusterUrl, COMMITMENT_LEVEL);
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
    throw new Error("Failed to create fee account");
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
    throw new Error("Failed to initialize Mint Bark Account");
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

    if (sourceAccountBalance < TRANSFER_AMOUNT) {
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
      TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Mint BARK", mintToSignature);

    const fee = (TRANSFER_AMOUNT * BigInt(FEE_BASIS_POINTS)) / BigInt(10_000);
    const feeCharged = fee > MAX_FEE ? Number(MAX_FEE) : Number(fee);

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
    throw new Error("Failed to transfer BARK with fee");
  }
}

// Function to handle fee withdrawal
async function withdrawFees(destinationTokenAccount, accountsToWithdrawFrom, isMint = false) {
  try {
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
    throw new Error("Failed to withdraw fees");
  }
}

// Function to harvest withheld fees and transfer to Mint BARK Account
async function harvestWithheldTokensToMint(mintAccount, feeAccount) {
  try {
    let feeAccountKey = new PublicKey(feeAccount);
    const feeAccountInfo = await connection.getAccountInfo(feeAccountKey, COMMITMENT_LEVEL);

    if (!feeAccountInfo) {
      console.log(`Fee account ${feeAccount} not found. Creating a new fee account...`);
      const newFeeAccount = await createFeeAccount(payerWallet);
      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
      feeAccountKey = newFeeAccount;
    } else {
      const feeAccountData = unpackAccount(feeAccountKey, feeAccountInfo.data, TOKEN_2022_PROGRAM_ID);
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
          TOKEN_2022_PROGRAM_ID,
        );
        logTransactionDetails(`Harvested ${withheldAmount} fees to Mint BARK`, transferSignature);
      } else {
        console.log("No withheld fees to harvest to Mint BARK.");
      }
    }
  } catch (error) {
    console.error(`Error harvesting and transferring withheld fees to Mint BARK: ${error.message}`);
    throw new Error("Failed to harvest and transfer withheld fees to Mint BARK");
  }
}

// Function to check the BARK account balance of the wallet
async function checkBarkBalance() {
  try {
    const ownerPublicKey = payerWallet.publicKey;
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
      commitment: COMMITMENT_LEVEL,
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
    console.log(`BARK account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Error checking wallet balance:", error.message);
    throw new Error("Failed to check wallet balance");
  }
}

// Main function to orchestrate the entire process.
async function main() {
  try {
    await checkBalance();
    await initializeMintAccount();
    const [sourceTokenAccount, destinationTokenAccount] = await initializeSolanaAccounts();
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);
    await withdrawFees(destinationTokenAccount, [sourceTokenAccount]);
    await transferBarkWithFee(sourceTokenAccount, destinationTokenAccount, MINT_AMOUNT);

    const existingFeeAccount = "feehVvkc5QiSu269NzHvf2TgyvhEwC5t4UxNZeMfzFS";
    const existingFeeAccountInfo = await connection.getAccountInfo(new PublicKey(existingFeeAccount), COMMITMENT_LEVEL);

    if (!existingFeeAccountInfo) {
      console.log(`Fee account ${existingFeeAccount} not found. Creating a new fee account...`);
      const newFeeAccount = await createFeeAccount(payerWallet);
      console.log(`Using the newly created fee account: ${newFeeAccount.toBase58()}`);
    } else {
      console.log(`Using existing fee account: ${existingFeeAccount}`);
    }

    await harvestWithheldTokensToMint(mint, existingFeeAccount);
    await withdrawFees(destinationTokenAccount, [], true);

    // Burning Mechanism
    const currentQuarter = getCurrentQuarter();
    if (currentQuarter >= BURN_START_QUARTER) {
      const burnAmount = calculateBurnAmount(MINT_AMOUNT);
      await burnTokens(sourceTokenAccount, burnAmount);
    }

  } catch (error) {
    console.error("Main process error:", error.message);
  }
}

// Execute the main function
main();

// Function to calculate burn amount based on burning rate
function calculateBurnAmount(amount) {
  return BigInt(Math.floor(Number(amount) * BURN_RATE));
}

// Function to get the current quarter
function getCurrentQuarter() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startQuarter = new Date(`${currentYear}-01-01`);
  const quarters = Math.floor((currentMonth - 1) / 3) + 1;
  return quarters;
}

// Function to burn tokens
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
      TOKEN_2022_PROGRAM_ID,
    );
    logTransactionDetails("Burn Tokens", burnSignature);
  } catch (error) {
    console.error("Error burning tokens:", error.message);
    throw new Error("Failed to burn tokens");
  }
}
