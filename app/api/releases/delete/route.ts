import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initDatabase } from "@/lib/db-init";
import { del } from "@vercel/blob";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    await initDatabase();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { releaseId } = await request.json();

    if (!releaseId) {
      return NextResponse.json(
        { error: "Release ID is required" },
        { status: 400 },
      );
    }

    // Get the release to find blob URL
    const { data: release, error: getError } = await supabase
      .from("releases")
      .select("*")
      .eq("id", releaseId)
      .single();

    if (getError || !release) {
      return NextResponse.json(
        { error: "Release not found" },
        { status: 404 },
      );
    }

    // Delete from Vercel Blob
    try {
      if (release.blob_url) {
        await del(release.blob_url);
      }
    } catch (blobError) {
      console.error("Blob deletion error:", blobError);
      // Continue even if blob deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("releases")
      .delete()
      .eq("id", releaseId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedSize: release.file_size });
  } catch (error) {
    console.error("Delete release error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
