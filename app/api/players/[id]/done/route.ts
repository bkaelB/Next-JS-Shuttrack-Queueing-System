import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(request: Request, context: { params: any }) {
  const params = await context.params;
  const { id } = params;

  try {
    // Update the player's done_playing column
    await pool.query("UPDATE players SET done_playing = 1 WHERE id = ?", [id]);

    return NextResponse.json({ message: "Player marked as done playing." }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/players/[id]/done error:", error);
    return NextResponse.json({ error: "Failed to update player." }, { status: 500 });
  }
}
