import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db-init";

export const revalidate = 0;

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({
      status: "ok",
      message: "Database initialized/verified",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database initialization failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
