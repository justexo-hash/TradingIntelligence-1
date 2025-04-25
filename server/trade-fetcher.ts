import fetch from 'node-fetch';
import { storage } from './storage';
import type { TrackedWallet, InsertTrade, Trade } from '@shared/schema';
import { users } from '@shared/schema';
import { db } from './db';
import { log } from './vite'; // Assuming vite.ts logger is okay for general logging

// API Key and Base URL (Consider moving to environment variables)
const SOLANA_TRACKER_API_KEY = '816450d6-d4b7-4497-8c53-d44183f4f647';
const SOLANA_TRACKER_BASE_URL = 'https://data.solanatracker.io';

// --- Updated SolanaTracker API Response Type (Based on Logs) --- 
interface SolanaTrackerTokenInfo {
    address: string;
    amount: number | string; // API might return number or string
    token?: { // This might be absent if it's SOL
        name?: string;
        symbol?: string;
        image?: string;
        decimals?: number;
    };
}

interface SolanaTrackerApiTrade {
    tx: string;          // Transaction signature
    time: number;        // Timestamp (likely ms)
    from: SolanaTrackerTokenInfo;
    to: SolanaTrackerTokenInfo;
    wallet: string;      // Wallet address the transaction is associated with
    program: string;     // e.g., 'pump', 'pumpfun-amm'
    volume?: { usd?: number; sol?: number }; // Optional volume info
    price?: { sol?: string }; // Optional price info
}

interface SolanaTrackerTradesResponse {
    trades: SolanaTrackerApiTrade[];
    nextCursor?: string;
    hasNextPage: boolean;
}
// ------------------------------------------------------------

/**
 * Fetches and stores trades for a single tracked wallet.
 */
async function fetchTradesForWallet(wallet: TrackedWallet): Promise<number> {
  let newTradesCount = 0;
  let cursor: string | null = null;
  let hasNextPage = true;
  const MAX_PAGES = 10; // Limit pages to avoid infinite loops/runaway costs
  let currentPage = 0;
  const SOL_MINT = 'So11111111111111111111111111111111111111112'; // Address for wrapped SOL

  log(`Fetching trades for wallet: ${wallet.address} (User: ${wallet.userId})`);

  while (hasNextPage && currentPage < MAX_PAGES) {
    currentPage++;
    const url = `${SOLANA_TRACKER_BASE_URL}/wallet/${wallet.address}/trades${cursor ? `?cursor=${cursor}` : ''}`;

    try {
      log(`Fetching page ${currentPage} for wallet ${wallet.address}, cursor: ${cursor}`);
      const response = await fetch(url, {
        headers: {
          'x-api-key': SOLANA_TRACKER_API_KEY,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // Increased timeout slightly
      });

      if (!response.ok) {
        log(`Error fetching trades for ${wallet.address}: ${response.status} ${response.statusText}`);
        hasNextPage = false; 
        continue;
      }

      const data: SolanaTrackerTradesResponse = await response.json() as SolanaTrackerTradesResponse;
      
      if (!data || !Array.isArray(data.trades)) {
          log(`Invalid data format received for wallet ${wallet.address}`);
          hasNextPage = false;
          continue;
      }

      log(`Received ${data.trades.length} trades for wallet ${wallet.address} on page ${currentPage}`);

      for (const apiTrade of data.trades) {
        if (!apiTrade.tx || !apiTrade.time || !apiTrade.from || !apiTrade.to || !apiTrade.wallet) {
            log(`Skipping trade with missing core fields: ${JSON.stringify(apiTrade)}`);
            continue;
        }

        const exists = await storage.tradeExistsBySignature(wallet.userId, apiTrade.tx);
        if (exists) {
          log(`Trade ${apiTrade.tx} already exists for user ${wallet.userId}. Skipping.`);
          continue;
        }

        let type: 'buy' | 'sell' | null = null;
        let tokenAddress: string | null = null;
        let tokenAmount: string | null = null;
        let solAmount: string | null = null;
        let tokenName: string | null = null;
        let tokenSymbol: string | null = null;
        let tokenImage: string | null = null;

        const isFromSol = apiTrade.from.address === SOL_MINT;
        const isToSol = apiTrade.to.address === SOL_MINT;
        const isFromWallet = apiTrade.from.address === wallet.address;
        const isToWallet = apiTrade.to.address === wallet.address;

        if (isFromSol && !isToSol) {
            type = 'buy';
            tokenAddress = apiTrade.to.address;
            tokenAmount = String(apiTrade.to.amount);
            solAmount = String(apiTrade.from.amount);
            tokenName = apiTrade.to.token?.name ?? null;
            tokenSymbol = apiTrade.to.token?.symbol ?? null;
            tokenImage = apiTrade.to.token?.image ?? null;
        }
        else if (!isFromSol && isToSol) {
            type = 'sell';
            tokenAddress = apiTrade.from.address;
            tokenAmount = String(apiTrade.from.amount);
            solAmount = String(apiTrade.to.amount);
            tokenName = apiTrade.from.token?.name ?? null;
            tokenSymbol = apiTrade.from.token?.symbol ?? null;
            tokenImage = apiTrade.from.token?.image ?? null;
        }
        else {
            log(`Skipping non SOL<->Token swap or unrecognized pattern: ${apiTrade.tx}`);
            continue;
        }

        if (!type || !tokenAddress || tokenAmount === null || solAmount === null) {
            log(`Could not determine trade details for tx: ${apiTrade.tx}. Skipping.`);
            continue;
        }

         if (isNaN(parseFloat(tokenAmount)) || isNaN(parseFloat(solAmount))) {
            log(`Skipping trade with invalid amount data (Post-parse): ${apiTrade.tx}`);
            continue;
        }

        const insertData: Omit<InsertTrade, 'id' | 'date'> = {
          userId: wallet.userId,
          contractAddress: tokenAddress,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          tokenImage: tokenImage,
          buyAmount: type === 'buy' ? solAmount : '0',
          sellAmount: type === 'sell' ? solAmount : '0',
          tokenAmount: tokenAmount,
          transactionSignature: apiTrade.tx,
          source: 'solanaTracker',
          setup: [],
          emotion: [],
          mistakes: [],
          notes: null,
          isShared: false,
        };

        try {
          await storage.createTrade(insertData as Omit<Trade, "id" | "date">);
          newTradesCount++;
        } catch (dbError) {
          if (dbError instanceof Error && dbError.message.includes('unique constraint')) {
             log(`Attempted to insert duplicate trade ${apiTrade.tx} for user ${wallet.userId}.`);
          } else {
             log(`Database error inserting trade ${apiTrade.tx} for user ${wallet.userId}: ${dbError}`);
          }
        }
      }

      cursor = data.nextCursor || null;
      hasNextPage = data.hasNextPage && !!cursor;
      if (cursor === null) { 
        hasNextPage = false;
      }

    } catch (error) {
      log(`Error processing page ${currentPage} for wallet ${wallet.address}: ${error}`);
      hasNextPage = false;
    }
    
    if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (currentPage >= MAX_PAGES) {
    log(`Reached max page limit (${MAX_PAGES}) for wallet ${wallet.address}`);
  }

  log(`Finished fetching for wallet ${wallet.address}. Added ${newTradesCount} new trades.`);
  return newTradesCount;
}

/**
 * Fetches trades for all tracked wallets in the system.
 */
export async function fetchAllTrackedTrades() {
  log("Starting fetchAllTrackedTrades job...");
  let totalNewTrades = 0;
  try {
    // Fetch all distinct tracked wallets (might need adjustment in storage if not implemented)
    // Assuming storage can provide this list efficiently.
    // For now, fetching all users and then their wallets as a simple approach.
    // TODO: Optimize this - ideally fetch unique wallets directly.
    const allUsers = await db.select().from(users); // Replace with more direct wallet fetch if possible
    const processedWallets = new Set<string>();

    for (const user of allUsers) {
        const wallets = await storage.getTrackedWalletsByUser(user.id);
        for (const wallet of wallets) {
            if (!processedWallets.has(wallet.address)) {
                totalNewTrades += await fetchTradesForWallet(wallet);
                processedWallets.add(wallet.address);
                // Add a delay between processing different wallets
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
        }
    }

    log(`fetchAllTrackedTrades job finished. Total new trades added: ${totalNewTrades}`);
  } catch (error) {
    log(`Error during fetchAllTrackedTrades job: ${error}`);
  }
}

// Example of how to potentially run this (e.g., called from index.ts or a dedicated script)
// For now, just exporting the main function.
// fetchAllTrackedTrades(); 