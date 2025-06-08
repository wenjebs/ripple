import os
import time
from collections import defaultdict
from datetime import datetime, timedelta

from dotenv import load_dotenv
from supabase import create_client

import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import EscrowCreate, Memo
from xrpl.transaction import submit_and_wait
from xrpl.utils import str_to_hex

# === CONFIGURATION ===
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ACCOUNT_SEED = os.getenv("ACCOUNT_SEED")
ACCOUNT_ADDRESS = "rK6UzEi6KFvxtrrV2aL6HNZsVe4hKUdjbC"
ENDPOINT = "https://s.altnet.rippletest.net:51234"

# Clients
RPC_CLIENT = JsonRpcClient(ENDPOINT)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ripple epoch reference
RIPPLE_EPOCH_START = datetime(2000, 1, 1)

def get_wallet():
    """Initialize and return a Wallet with up-to-date sequence."""
    wallet = Wallet.from_seed(ACCOUNT_SEED)
    resp = RPC_CLIENT.request(
        xrpl.models.requests.AccountInfo(
            account=wallet.classic_address,
            ledger_index="current"
        )
    ).result
    wallet.sequence = resp["account_data"]["Sequence"]
    return wallet

def unix_to_ripple(ts: float) -> int:
    """Convert Unix timestamp to Ripple epoch seconds."""
    return int(ts - RIPPLE_EPOCH_START.timestamp())

def send_from_pool_escrow(destination: str, amount_drops: int, memo_link: str):
    """
    Create an Escrow to lock funds for the recipient.
    The memo_link serves as a DID or success-hash placeholder.
    Funds unlock automatically after 1 day.
    """
    wallet = get_wallet()
    # Set finishAfter to 1 day from now
    finish_after = unix_to_ripple(time.time() + 86400)

    # Build memo
    memo = Memo(
        memo_type=str_to_hex("completion_did"),
        memo_data=str_to_hex(memo_link)
    )

    escrow_tx = EscrowCreate(
        account=wallet.classic_address,
        destination=destination,
        amount=str(amount_drops),
        finish_after=finish_after,
        # cancel_after omitted: if not finished, user can reclaim after cancel_after default
        memos=[memo]
    )

    print(f"Creating Escrow for {destination}: {amount_drops} drops, unlocks at finishAfter={finish_after}")
    try:
        response = submit_and_wait(escrow_tx, RPC_CLIENT, wallet)
        result = response.result["meta"]["TransactionResult"]
        print(f"✅ EscrowCreate successful: {result}")
        print(f"   Memo link: {memo_link}\n")
    except Exception as e:
        print(f"❌ EscrowCreate failed for {destination}: {e}\n")
    wallet.sequence += 1

def fetch_users_and_escrow():
    """Fetch users and goals, compute distributions, then escrow funds"""
    response = supabase.table("users").select("id, wallet_address, goals(*)").execute()
    user_goals = {u["wallet_address"]: u.get("goals", []) for u in response.data}

    # Collect stats
    refunded = defaultdict(int)
    completed = defaultdict(int)
    forfeited_total = 0

    for wallet, goals in user_goals.items():
        for goal in goals:
            amt = goal["xrp_amount"]
            if goal["status"] == "complete":
                refunded[wallet] += amt
                completed[wallet] += amt
            else:
                forfeited_total += amt

    total_completed = sum(completed.values())
    redistributed = {}
    if total_completed > 0:
        for wallet, amt in completed.items():
            share = amt / total_completed
            redistributed[wallet] = int(forfeited_total * share)

    # Perform escrow creation for each user
    for wallet in user_goals:
        refund = refunded.get(wallet, 0)
        bonus = redistributed.get(wallet, 0)
        total_drops = refund + bonus
        if total_drops <= 0:
            continue
        # Placeholder link (DID/success-hash)
        memo_link = f"https://example.com/did/{wallet}"
        send_from_pool_escrow(wallet, total_drops, memo_link)

    print(f"\nForfeited pool total: {forfeited_total} drops")
    print(f"Total completed amount: {total_completed} drops")

if __name__ == "__main__":
    fetch_users_and_escrow()
