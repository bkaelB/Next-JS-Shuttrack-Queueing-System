import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "Match ID required" }, { status: 400 });

    // Delete all players in this match
    await pool.query(`DELETE FROM match_players WHERE match_id = ?`, [matchId]);

    // Delete match
    await pool.query(`DELETE FROM matches WHERE id = ?`, [matchId]);

    return NextResponse.json({ message: "Match canceled" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/queue/cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel match" }, { status: 500 });
  }
}
