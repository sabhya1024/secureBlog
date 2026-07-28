import secrets

access_token_secret = secrets.token_hex(32)
refresh_token_secret = secrets.token_hex(32)

print(f"ACCESS_TOKEN_SECRET={access_token_secret}")
print(f"REFRESH_TOKEN_SECRET={refresh_token_secret}")