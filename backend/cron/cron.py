import os
from collections import defaultdict
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client
from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment
from xrpl.transaction import submit_and_wait
import xrpl
import time

# === CONFIGURATION ===
ACCOUNT_ADDRESS = "rK6UzEi6KFvxtrrV2aL6HNZsVe4hKUdjbC"
ENDPOINT = "https://s.altnet.rippletest.net:51234"
RPC_CLIENT = JsonRpcClient(ENDPOINT)
PLATFORM_FEE_PERCENTAGE = 0.10  # 10% platform fee from forfeited deposits

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

def send_from_pool(destination: str, amount_drops: int, description: str = ""):
    """Send XRP from pool to destination address"""
    if amount_drops <= 0:
        print(f"⚠️  Skipping send to {destination}: Amount is {amount_drops} drops")
        return False
        
    wallet = get_wallet()
    print(f"💸 Sending {amount_drops} drops ({amount_drops / 1_000_000:.6f} XRP) to {destination}")
    if description:
        print(f"   Purpose: {description}")

    tx = Payment(
        account=wallet.classic_address,
        destination=destination,
        amount=str(amount_drops)
    )

    try:
        response = submit_and_wait(tx, RPC_CLIENT, wallet)
        result = response.result["meta"]["TransactionResult"]
        if result == "tesSUCCESS":
            print(f"✅ Successfully sent to {destination}. Transaction: {response.result['hash']}")
            return True
        else:
            print(f"❌ Transaction failed for {destination}: {result}")
            return False
    except Exception as e:
        print(f"❌ Failed to send to {destination}: {e}")
        return False

def update_goal_status_after_settlement(goal_id: int, new_status: str):
    """Update goal status after settlement"""
    try:
        response = supabase.table("goals").update({
            "status": new_status,
            "settled_at": datetime.now().isoformat()
        }).eq("id", goal_id).execute()
        
        if response.data:
            print(f"✅ Updated goal {goal_id} status to {new_status}")
        else:
            print(f"⚠️  Failed to update goal {goal_id}")
    except Exception as e:
        print(f"❌ Error updating goal {goal_id}: {e}")

def log_settlement_transaction(user_id: str, wallet_address: str, amount_drops: int, transaction_type: str, transaction_hash: str = None):
    """Log settlement transaction to database"""
    try:
        supabase.table("settlement_transactions").insert({
            "user_id": user_id,
            "wallet_address": wallet_address,
            "amount_drops": amount_drops,
            "transaction_type": transaction_type,  # 'refund', 'bonus', 'forfeit'
            "transaction_hash": transaction_hash,
            "settlement_date": datetime.now().isoformat()
        }).execute()
        print(f"📝 Logged {transaction_type} transaction for user {user_id}")
    except Exception as e:
        print(f"❌ Error logging transaction: {e}")

def get_eligible_goals_for_settlement():
    """Get goals that are eligible for settlement (ended in the past month)"""
    # Get goals that ended in the last month and haven't been settled yet
    one_month_ago = datetime.now() - timedelta(days=30)
    
    response = supabase.table("goals").select("*, users(id, wallet_address)").gte(
        "end_date", one_month_ago.isoformat()
    ).is_("settled_at", "null").execute()
    
    return response.data

def monthly_settlement():
    """Execute the complete monthly settlement process"""
    print("🚀 Starting Monthly Settlement Process...")
    print("=" * 50)
    
    # Get eligible goals
    goals = get_eligible_goals_for_settlement()
    if not goals:
        print("ℹ️  No goals eligible for settlement.")
        return
    
    print(f"Found {len(goals)} goals eligible for settlement")
    
    # Group by user
    user_goals = defaultdict(list)
    for goal in goals:
        wallet = goal["users"]["wallet_address"]
        user_id = goal["users"]["id"]
        goal["user_id"] = user_id  # Add user_id for later use
        user_goals[wallet].append(goal)
    
    # Calculate distributions
    refunded_per_user = defaultdict(int)
    forfeited_total = 0
    completed_per_user = defaultdict(int)
    user_ids = {}  # Map wallet to user_id
    
    print("\n📊 Analyzing Goal Completions...")
    for wallet, goals in user_goals.items():
        user_ids[wallet] = goals[0]["user_id"]  # Store user_id mapping
        print(f"\n👤 User {wallet}:")
        
        for goal in goals:
            print(f"  📋 Goal: {goal['title']}")
            print(f"     Status: {goal['status']}")
            print(f"     Amount: {goal['xrp_amount']} drops")
            
            amt = goal["xrp_amount"]
            if goal["status"] == "complete":
                refunded_per_user[wallet] += amt
                completed_per_user[wallet] += amt
                print(f"     ✅ COMPLETED - Refund: {amt} drops")
            else:
                forfeited_total += amt
                print(f"     ❌ FAILED - Forfeited: {amt} drops")
    
    # Calculate platform fee and net redistribution
    platform_fee = int(forfeited_total * PLATFORM_FEE_PERCENTAGE)
    net_redistribution_pool = forfeited_total - platform_fee
    
    print(f"\n💰 Financial Summary:")
    print(f"   Total Forfeited: {forfeited_total} drops ({forfeited_total / 1_000_000:.6f} XRP)")
    print(f"   Platform Fee ({PLATFORM_FEE_PERCENTAGE * 100}%): {platform_fee} drops ({platform_fee / 1_000_000:.6f} XRP)")
    print(f"   Net Redistribution Pool: {net_redistribution_pool} drops ({net_redistribution_pool / 1_000_000:.6f} XRP)")
    
    # Calculate bonus redistribution
    redistributed_per_user = defaultdict(float)
    total_completed_xrp = sum(completed_per_user.values())
    
    if total_completed_xrp > 0:
        for wallet, completed_amt in completed_per_user.items():
            share_ratio = completed_amt / total_completed_xrp
            redistributed_per_user[wallet] = net_redistribution_pool * share_ratio
    
    print(f"\n🎯 Final Distribution Calculation:")
    settlement_summary = []
    
    for wallet in user_goals:
        refund = refunded_per_user[wallet]
        bonus = int(redistributed_per_user[wallet])  # Convert to int drops
        total_payout = refund + bonus
        
        settlement_summary.append({
            "wallet": wallet,
            "user_id": user_ids[wallet],
            "refund": refund,
            "bonus": bonus,
            "total": total_payout
        })
        
        print(f"  {wallet}:")
        print(f"    Refund: {refund} drops ({refund / 1_000_000:.6f} XRP)")
        print(f"    Bonus: {bonus} drops ({bonus / 1_000_000:.6f} XRP)")
        print(f"    Total: {total_payout} drops ({total_payout / 1_000_000:.6f} XRP)")
    
    # Execute settlements
    print(f"\n💸 Executing Settlements...")
    successful_settlements = 0
    
    for settlement in settlement_summary:
        wallet = settlement["wallet"]
        user_id = settlement["user_id"]
        total_payout = settlement["total"]
        
        if total_payout > 0:
            success = send_from_pool(
                wallet, 
                total_payout, 
                f"Settlement: {settlement['refund']} refund + {settlement['bonus']} bonus"
            )
            
            if success:
                successful_settlements += 1
                # Log transactions
                if settlement["refund"] > 0:
                    log_settlement_transaction(user_id, wallet, settlement["refund"], "refund")
                if settlement["bonus"] > 0:
                    log_settlement_transaction(user_id, wallet, settlement["bonus"], "bonus")
        else:
            print(f"⚠️  No payout for {wallet}")
            # Log forfeiture
            log_settlement_transaction(user_id, wallet, 0, "forfeit")
    
    # Update goal statuses
    print(f"\n📝 Updating Goal Statuses...")
    for goal in goals:
        if goal["status"] == "complete":
            update_goal_status_after_settlement(goal["id"], "settled_complete")
        else:
            update_goal_status_after_settlement(goal["id"], "settled_failed")
    
    # Send platform fee to designated address (if configured)
    platform_wallet = os.getenv("PLATFORM_WALLET_ADDRESS")
    if platform_wallet and platform_fee > 0:
        print(f"\n🏦 Sending Platform Fee...")
        send_from_pool(platform_wallet, platform_fee, "Platform fee from monthly settlement")
    
    print(f"\n✅ Settlement Complete!")
    print(f"   Goals Processed: {len(goals)}")
    print(f"   Successful Payouts: {successful_settlements}")
    print(f"   Platform Revenue: {platform_fee} drops ({platform_fee / 1_000_000:.6f} XRP)")
    print("=" * 50)

# === Testing Functions ===
def fetch_users_with_final_distribution():
    """Analysis-only function for testing (doesn't execute settlements)"""
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

    print("\n=== Final Distribution (Analysis Only) ===\n")

    # Calculate platform fee
    platform_fee = int(forfeited_total * PLATFORM_FEE_PERCENTAGE)
    net_redistribution = forfeited_total - platform_fee

    redistributed_per_user = defaultdict(float)
    total_completed_xrp = sum(completed_per_user.values())

    if total_completed_xrp > 0:
        for user, completed_amt in completed_per_user.items():
            share_ratio = completed_amt / total_completed_xrp
            redistributed_per_user[user] = net_redistribution * share_ratio

    for wallet in user_goals:
        refund = refunded_per_user[wallet]
        bonus = redistributed_per_user[wallet]
        total = refund + bonus

        print(f"{wallet}:")
        print(f"  Refunded     : {refund} drops")
        print(f"  Bonus Share  : {bonus:.2f} drops")
        print(f"  Final Total  : {total:.2f} drops\n")

    print(f"Total Forfeited Pool: {forfeited_total} drops")
    print(f"Platform Fee ({PLATFORM_FEE_PERCENTAGE * 100}%): {platform_fee} drops")
    print(f"Net Redistribution: {net_redistribution} drops")
    print(f"Total Completed (eligible for bonus): {total_completed_xrp} drops")

if __name__ == "__main__":
    # For testing: analyze without executing
    # fetch_users_with_final_distribution()
    
    # For production: execute full monthly settlement
    monthly_settlement()
