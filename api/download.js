import { list } from "@vercel/blob";

export default async function handler(req, res) {
  const { filename } = req.query;

  // Root or undefined access returns simple info
  if (!filename || filename === "") {
    return res.status(200).send(`
      <html>
        <body style="font-family: monospace; padding: 20px;">
          <h2>File System Electron Update Server</h2>
          <p>Running Vercel Blob Backend.</p>
        </body>
      </html>
    `);
  }

  try {
    // Find the requested file within the blob storage
    const { blobs } = await list({ limit: 100 });
    const file = blobs.find((b) => b.pathname === filename);

    if (!file) {
      return res.status(404).send("Release file not found.");
    }

    // Redirect the electron auto updater directly to the direct AWS URL provided by Vercel Blob
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.redirect(302, file.url);
  } catch (error) {
    console.error("Failed to list blobs:", error);
    return res.status(500).json({ error: error.message });
  }
}
