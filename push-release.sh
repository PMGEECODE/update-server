#!/bin/bash
# Description: Automatically pushes a new Windows Electron release straight to the Vercel Server.

# 1. Configuration (Set these directly or export them in your shell before running)
# UPDATE_SERVER_URL="https://your-server-name.vercel.app"
# UPLOAD_SECRET="your-super-secret-password-from-env"

# We assume this script is running from the 'update-server' folder, 
# and the compiled '.exe' files are located in '../app/release'
RELEASE_DIR="../app/release"

if [ -z "$UPDATE_SERVER_URL" ] || [ -z "$UPLOAD_SECRET" ]; then
  echo "❌ Error: UPDATE_SERVER_URL and UPLOAD_SECRET must be set."
  echo "Example: export UPDATE_SERVER_URL='https://my-app.vercel.app'"
  echo "Example: export UPLOAD_SECRET='my-password'"
  exit 1
fi

if [ ! -d "$RELEASE_DIR" ]; then
  echo "❌ Error: Release folder not found at $RELEASE_DIR. Run 'pnpm dist:win' in the app folder first."
  exit 1
fi

# Detect files
LATEST_YML=$(ls -1 "$RELEASE_DIR"/latest.yml 2>/dev/null)
EXE_FILE=$(ls -1 "$RELEASE_DIR"/*.exe 2>/dev/null | head -n 1)

if [ -z "$LATEST_YML" ] || [ -z "$EXE_FILE" ]; then
  echo "❌ Error: Missing latest.yml or .exe file in $RELEASE_DIR"
  exit 1
fi

EXE_NAME=$(basename "$EXE_FILE")

echo "\n🚀 Sending files to Vercel Update Server at $UPDATE_SERVER_URL..."

# Upload the .exe File
echo "\n📦 Uploading Application Binary ($EXE_NAME)..."
curl -X POST "$UPDATE_SERVER_URL/upload" \
  -H "Authorization: Bearer $UPLOAD_SECRET" \
  -H "x-filename: $EXE_NAME" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$EXE_FILE"

# Upload the latest.yml manifest 
echo "\n\n📄 Uploading Manifest (latest.yml). Note: This must execute AFTER the binary!"
curl -X POST "$UPDATE_SERVER_URL/upload" \
  -H "Authorization: Bearer $UPLOAD_SECRET" \
  -H "x-filename: latest.yml" \
  -H "Content-Type: application/x-yaml" \
  --data-binary "@$LATEST_YML"

echo "\n\n✅ Done! The global application has been updated."
