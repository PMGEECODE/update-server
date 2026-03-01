import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initDatabase } from "@/lib/db-init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDatabase();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all releases and sum file sizes
    const { data: releases, error } = await supabase
      .from("releases")
      .select("file_size");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const usedBytes = releases.reduce((sum, release) => sum + (release.file_size || 0), 0);

    // Hobby plan = 1GB, Pro plan = 1TB (we'll default to Hobby for now)
    const totalBytes = 1 * 1024 * 1024 * 1024; // 1GB in bytes
    const remainingBytes = Math.max(0, totalBytes - usedBytes);
    const percentageUsed = (usedBytes / totalBytes) * 100;

    return NextResponse.json({
      totalBytes,
      usedBytes,
      remainingBytes,
      percentageUsed: Math.min(100, percentageUsed),
      releaseCount: releases.length,
    });
  } catch (error) {
    console.error("Storage metrics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
