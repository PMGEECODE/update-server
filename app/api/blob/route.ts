import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN ||
      Object.entries(process.env).find(([key]) =>
        key.includes("BLOB_READ_WRITE_TOKEN"),
      )?.[1];

    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async () => {
        if (!blobToken) {
          throw new Error(
            "Vercel Blob token not found in environment (checked BLOB_READ_WRITE_TOKEN and variations). Please ensure your environment variables are set and the app is redeployed.",
          );
        }

        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

        // Allow executables, YAML manifests, dmgs, and zips.
        return {
          allowedContentTypes: [
            "application/octet-stream",
            "application/x-msdownload",
            "application/vnd.microsoft.portable-executable",
            "application/x-yaml",
            "text/yaml",
            "application/x-apple-diskimage",
            "application/zip",
            "application/macbinary",
          ],
          tokenPayload: JSON.stringify({ userId: user.id }),
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
      onUploadCompleted: async () => {
        // Blob upload finished successfully on Vercel Edge Server.
        // Database update will be triggered from the client for UI responsiveness.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // Webhook will retry on 400
    );
  }
}
