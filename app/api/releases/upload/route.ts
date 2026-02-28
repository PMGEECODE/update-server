import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { version, platform, filename, blob_url, checksum, file_size } = body;

    if (
      !version ||
      !platform ||
      !filename ||
      !blob_url ||
      !checksum ||
      file_size === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required metadata fields: version, platform, filename, blob_url, checksum, file_size",
        },
        { status: 400 },
      );
    }

    // Save metadata to Supabase
    const { data: release, error } = await supabase
      .from("releases")
      .upsert(
        {
          version,
          platform,
          filename,
          blob_url,
          checksum,
          file_size,
          created_by: user.id,
        },
        { onConflict: "version,platform" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: releases, error } = await supabase
      .from("releases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(releases);
  } catch (error) {
    console.error("Get releases error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
