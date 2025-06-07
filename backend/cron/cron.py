import os
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client
import requests
from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment
from xrpl.transaction import submit_and_wait
import xrpl

# === CONFIGURATION ===
ACCOUNT_ADDRESS = "rK6UzEi6KFvxtrrV2aL6HNZsVe4hKUdjbC"
ENDPOINT = "https://s.altnet.rippletest.net:51234"
RPC_CLIENT = JsonRpcClient(ENDPOINT)

# === Load Environment ===
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ACCOUNT_SEED = os.getenv("ACCOUNT_SEED")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialise Wallet with up-to-date sequence
def get_wallet():
    wallet = Wallet.from_seed(ACCOUNT_SEED)
    acct_info = RPC_CLIENT.request(
        xrpl.models.requests.AccountInfo(
            account=wallet.classic_address,
            ledger_index="current"
        )
    ).result
    wallet.sequence = acct_info["account_data"]["Sequence"]
    return wallet

def send_from_pool(destination: str, amount_drops: int):
    wallet = get_wallet()

    print(f"Preparing to send {amount_drops} drops ({amount_drops / 1_000_000:.6f} XRP) to {destination}")

    tx = Payment(
        account=wallet.classic_address,
        destination=destination,
        amount=str(amount_drops)
    )

    try:
        response = submit_and_wait(tx, RPC_CLIENT, wallet)
        result = response.result["meta"]["TransactionResult"]
        print(f"✅ Successfully sent to {destination}. Result: {result}\n")
    except Exception as e:
        print(f"❌ Failed to send to {destination}: {e}\n")

# === Fetch and Analyse ===
def fetch_users_with_final_distribution():
    response = supabase.table("users").select("id, wallet_address, goals(*)").execute()

    user_goals = {}
    for user in response.data:
        wallet = user["wallet_address"]
        goals = user.get("goals", [])
        user_goals[wallet] = goals

    refunded_per_user = defaultdict(int)
    forfeited_total = 0
    completed_per_user = defaultdict(int)

    for wallet, goals in user_goals.items():
        print(f"\nUser {wallet}:")
        if not goals:
            print("  No goals found.")
            continue

        for goal in goals:
            print(f"  └─ Goal ID: {goal['id']}")
            print(f"     Title       : {goal['title']}")
            print(f"     Status      : {goal['status']}")
            print(f"     Start Date  : {goal['start_date']}")
            print(f"     XRP Amount  : {goal['xrp_amount']} drops")
            print(f"     Duration    : {goal['duration_weeks']} weeks")

            amt = goal["xrp_amount"]
            if goal["status"] == "complete":
                refunded_per_user[wallet] += amt
                completed_per_user[wallet] += amt
            else:
                forfeited_total += amt

    print("\n=== Final Distribution ===\n")

    redistributed_per_user = defaultdict(float)
    total_completed_xrp = sum(completed_per_user.values())

    if total_completed_xrp > 0:
        for user, completed_amt in completed_per_user.items():
            share_ratio = completed_amt / total_completed_xrp
            redistributed_per_user[user] = forfeited_total * share_ratio

    for wallet in user_goals:
        refund = refunded_per_user[wallet]
        bonus = redistributed_per_user[wallet]
        total = refund + bonus

        print(f"{wallet}:")
        print(f"  Refunded     : {refund} drops")
        print(f"  Bonus Share  : {bonus:.2f} drops")
        print(f"  Final Total  : {total:.2f} drops\n")

    print(f"Total Forfeited Pool: {forfeited_total} drops")
    print(f"Total Completed (eligible for bonus): {total_completed_xrp} drops")

if __name__ == "__main__":
    fetch_users_with_final_distribution()
    send_from_pool("rL7JXdoSGr6fq6cEQ9HQnx2u8BxAvneSB5", 1000000)  # Send 1 XRP to address
