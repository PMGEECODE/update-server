import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { releaseId, platform } = await request.json();

    if (!releaseId || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: releaseId, platform" },
        { status: 400 },
      );
    }

    // Get the release to publish
    const { data: release, error: releaseError } = await supabase
      .from("releases")
      .select("*")
      .eq("id", releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }

    // Mark release as published
    const { error: updateError } = await supabase
      .from("releases")
      .update({
        published: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", releaseId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Update or create latest_releases entry
    const { error: upsertError } = await supabase
      .from("latest_releases")
      .upsert(
        {
          platform,
          version: release.version,
          release_id: releaseId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform" },
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
