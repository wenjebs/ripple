from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment
from xrpl.transaction import autofill_and_sign, submit_and_wait
from xrpl.utils import xrp_to_drops
import time

# ---------- CONFIGURATION ----------

JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"  # XRP Testnet RPC

POOL_SEED = "sEdSe85qR2dS2d74yHVjzCr7omtjmP5"  # Replace with your testnet seed

RECIPIENTS = [
    "rL7JXdoSGr6fq6cEQ9HQnx2u8BxAvneSB5",
    "rEn7YKzXruA9XNupzk64K6uC72Pk7iz2e2",
]

TOTAL_XRP = 1.0  # Total to split

# -----------------------------------

client = JsonRpcClient(JSON_RPC_URL)
pool_wallet = Wallet.from_seed(POOL_SEED)

total_drops = int(xrp_to_drops(TOTAL_XRP))
each_drops = total_drops // len(RECIPIENTS)

if each_drops == 0:
    raise ValueError("Amount too small to split among recipients.")

print(f"Sending {each_drops} drops to each recipient...")

for addr in RECIPIENTS:
    payment = Payment(
        account=pool_wallet.classic_address,
        destination=addr,
        amount=str(each_drops)
    )

    signed = autofill_and_sign(payment, client, pool_wallet)
    response = submit_and_wait(signed, client, pool_wallet)

    result = response.result
    tx_hash = result.get("hash", "N/A")
    tx_result = result.get("meta", {}).get("TransactionResult", "N/A")

    print(f"→ Sent to {addr}: {tx_result} (tx: {tx_hash})")

    time.sleep(1)  # Optional: slight delay between txns
