import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let platform = request.nextUrl.searchParams.get("platform");

    // Fallback: Detect from path if query omitted
    if (!platform) {
      const path = request.nextUrl.pathname;
      if (path.includes("mac")) platform = "darwin";
      else if (path.includes("linux")) platform = "linux";
      else platform = "win32";
    }

    const supabase = await createClient();

    // Get the latest release for this platform
    const { data: latestRelease, error } = await supabase
      .from("latest_releases")
      .select(
        `
        version,
        platform,
        release_id,
        releases!release_id (
          filename,
          blob_url,
          checksum,
          file_size
        )
      `,
      )
      .eq("platform", platform)
      .single();

    if (error || !latestRelease) {
      return new NextResponse(`version: 0.0.0\nplatform: ${platform}\n`, {
        status: 200,
        headers: { "Content-Type": "text/yaml" },
      });
    }

    const release = latestRelease.releases as any;

    // Convert hex checksum to base64 for electron-updater compatibility
    const checksumBase64 = Buffer.from(release.checksum, "hex").toString(
      "base64",
    );

    // Generate standard YAML manifest for electron-updater
    const yaml = `version: ${latestRelease.version}
files:
  - url: ${release.blob_url}
    sha512: ${checksumBase64}
    size: ${release.file_size}
path: ${release.blob_url}
sha512: ${checksumBase64}
releaseDate: ${new Date().toISOString()}
`;

    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Manifest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
