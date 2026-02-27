# Electron Serverless Auto-Update Server (Vercel)

A lightweight API built to host generic `electron-updater` releases. It securely stores your desktop application binaries using **Vercel Blob Storage**, allowing you to continuously push updates from your local machine to your users!

---

## 1. Deploying to Vercel

1. Make sure you have the Vercel CLI installed: `npm i -g vercel`.
2. Inside this directory (`update-server`), run:
   ```bash
   vercel login
   vercel deploy --prod
   ```
3. Once deployed, note down your production domain (e.g., `https://my-app.vercel.app`).

---

## 2. Set Up Vercel Blob Storage

Because Vercel Serverless functions are read-only except for temporary memory, we use Vercel Blob to store the massive `.exe` files.

1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click the **Storage** tab and create a new **Vercel Blob** store.
3. Once created, connect it to your update server project. Vercel will automatically add the `BLOB_READ_WRITE_TOKEN` environment variable to your project.

---

## 3. Secure the Upload Endpoint

We need a password to prevent strangers from uploading viruses under your app name.

1. Decide on a password string (e.g., `super_secret_release_key_99`).
2. Go to your Update Server on Vercel Dashboard -> **Settings** -> **Environment Variables**.
3. Add a new variable:
   - Key: `UPLOAD_SECRET`
   - Value: `super_secret_release_key_99`
4. Deploy the project again (`vercel deploy --prod`) to apply the new variables.

---

## 4. Pushing New Releases

Whenever you compile a new version of your app (using `pnpm dist:win` in your main `app` folder), two files are generated in `app/release`: `latest.yml` and the `.exe` file.

You can upload them automatically using the custom script:

```bash
# Provide the URL Vercel gave you and the secret password
export UPDATE_SERVER_URL="https://my-update-server.vercel.app"
export UPLOAD_SECRET="super_secret_release_key_99"

# Give the script execution access and run it
chmod +x push-release.sh
./push-release.sh
```

---

## 5. Hooking up Electron

Now that your server is live, simply tell your original Electron app to listen to it!

Inside your Electron App (`package.json`), configure your `build.publish` generic provider:

```json
"build": {
  "publish": [
    {
      "provider": "generic",
      "url": "https://my-update-server.vercel.app"
    }
  ]
}
```

Now, every time your Windows desktop app opens, it will quietly ask `https://my-update-server.vercel.app/latest.yml` if a newer version is available. If it finds one, it will silently download the `.exe` in the background and prompt the user to restart!
