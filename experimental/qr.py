import qrcode

# Your payment URI
uri = "xrpl:rK6UzEi6KFvxtrrV2aL6HNZsVe4hKUdjbC?amount=20"  # 20 XRP

# Create and save QR code
img = qrcode.make(uri)
img.save("xaman_payment_qr.png")
