import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "Match ID required" }, { status: 400 });

    await pool.query(`UPDATE matches SET status = 'ongoing' WHERE id = ?`, [matchId]);


    return NextResponse.json({ message: "Match started", matchId, status: "ongoing" });
  } catch (error) {
    console.error("PUT /api/queue/start error:", error);
    return NextResponse.json({ error: "Failed to start match" }, { status: 500 });
  }
}
