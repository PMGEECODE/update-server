import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST to upload files." });
  }

  // Basic security check to ensure only you can upload releases
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.UPLOAD_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  // Identify the file name from headers
  const filename = req.headers["x-filename"];
  if (!filename) {
    return res.status(400).json({ error: "Missing x-filename header." });
  }

  try {
    // We disable 'addRandomSuffix' so that latest.yml always overwrites the previous one!
    const blob = await put(filename, req, {
      access: "public",
      addRandomSuffix: false,
    });

    return res.status(200).json({
      success: true,
      message: `File ${filename} successfully uploaded to Release Server.`,
      url: blob.url,
    });
  } catch (error) {
    console.error("Failed to upload blob:", error);
    return res.status(500).json({ error: error.message });
  }
}
