// getPoolStats.ts
import { Client } from 'xrpl';

const TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233';

export interface PoolStats {
  totalXrp: number;
  userXrp: number;
}

/**
 * Fetches every Payment into poolAddress on Testnet,
 * filters to June 2025 by close_time_iso, and returns:
 *  • totalXrp – sum of all drops into the pool
 *  • userXrp  – sum of drops from walletAddress in that month
 */
export async function getPoolStats(
  poolAddress: string,
  walletAddress: string
): Promise<PoolStats> {
  const client = new Client(TESTNET_WSS);
  await client.connect();

  let marker: string | undefined = undefined;
  let totalDrops = 0;
  let userDrops  = 0;

  // UTC window for June 2025
  const monthStart = new Date(Date.UTC(2025, 5, 1));
  const monthEnd   = new Date(Date.UTC(2025, 6, 1));

  do {
    const resp = await client.request({
      command:          'account_tx',
      account:          poolAddress,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward:          false,
      marker,
    });

    const { transactions, marker: nextMarker } = resp.result;

    for (const entry of transactions as any[]) {
      if (!entry.validated) continue;
      // In the new format the transaction lives under `tx_json`
      const tx = entry.tx_json as {
        TransactionType?: string;
        Destination?: string;
        Account?: string;
        Amount?: string;
      };
      if (
        !tx ||
        tx.TransactionType !== 'Payment' ||
        tx.Destination     !== poolAddress
      ) {
        continue;
      }

      console.log("Found input!", entry)

      // Timestamp for filtering
      const iso = entry.close_time_iso as string | undefined;
      if (!iso) continue;

      const closeTime = new Date(iso);
      if (closeTime < monthStart || closeTime >= monthEnd) {
        continue;
      }

      // Use delivered_amount (from meta) if present, otherwise fallback to tx.Amount
      const dropsStr = (entry.meta?.delivered_amount as string | undefined)
        ?? tx.Amount
        ?? '0';
      const drops = parseInt(dropsStr, 10);
      console.log("found drops: ", drops)

      totalDrops += drops;
      if (tx.Account == walletAddress) {
        userDrops += drops;
      }
    }

    // advance pagination
    marker = nextMarker as string | undefined;
  } while (marker);

  await client.disconnect();

  return {
    totalXrp: totalDrops / 1_000_000,
    userXrp:  userDrops  / 1_000_000,
  };
}
