import { put } from "@vercel/blob";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runUpload() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ Error: Missing BLOB_READ_WRITE_TOKEN!");
    console.error(
      "Please copy this token from your Vercel Project -> Storage -> Vercel Blob settings.",
    );
    console.error("Example: export BLOB_READ_WRITE_TOKEN='vercel_blob_rw_...'");
    process.exit(1);
  }

  const releaseDir = join(__dirname, "../app/release");

  if (!existsSync(releaseDir)) {
    console.error(`❌ Error: Release folder not found at ${releaseDir}`);
    process.exit(1);
  }

  // Find the generated EXEs and YML
  const files = readdirSync(releaseDir);
  const exeFile = files.find(
    (f) => f.endsWith(".exe") && !f.includes("uninstaller"),
  );
  const ymlFile = "latest.yml";

  if (!exeFile || !files.includes(ymlFile)) {
    console.error(
      "❌ Error: Missing latest.yml or .exe file in release folder!",
    );
    process.exit(1);
  }

  console.log(`\n🚀 Uploading files straight to Vercel Blob storage...`);

  try {
    console.log(
      `\n📦 Uploading Application Binary (${exeFile}) - this may take a moment depending on internet speed...`,
    );
    const exeBuffer = readFileSync(join(releaseDir, exeFile));
    const exeResult = await put(exeFile, exeBuffer, {
      access: "public",
      addRandomSuffix: false, // Ensures existing filename is overwritten cleanly
      multipart: true, // Forces multipart upload which bypasses all size limits!
    });
    console.log(`✅ Success! Binary uploaded to: ${exeResult.url}`);

    console.log(`\n📄 Uploading Manifest (${ymlFile})...`);
    const ymlBuffer = readFileSync(join(releaseDir, ymlFile));
    const ymlResult = await put(ymlFile, ymlBuffer, {
      access: "public",
      addRandomSuffix: false,
    });
    console.log(`✅ Success! Manifest uploaded to: ${ymlResult.url}`);

    console.log(
      `\n\n🎉 Done! Your auto-updater is completely live! Users will see it on next launch.`,
    );
  } catch (error) {
    console.error(`\n❌ Upload failed:`, error.message);
  }
}

runUpload();
