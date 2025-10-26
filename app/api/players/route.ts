import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Order players by longest waiting time first
    const [rows] = await pool.query(`
      SELECT *,
        TIMESTAMPDIFF(SECOND, waiting_start, NOW()) AS waiting_seconds
      FROM players
      ORDER BY 
        done_playing ASC,      -- active players first
        waiting_seconds DESC,  -- longest waiting time at the top
        id ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Db query failed" }, { status: 500 });
  }
}

// POST - Add a new player
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, level } = body;

    if (!name || !level) {
      return NextResponse.json(
        { error: "Name and level are required" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO players (name, level, games_played, done_playing, waiting_start, total_waiting_time)
       VALUES (?, ?, 0, 0, NOW(), 0)`,
      [name, level]
    );

    return NextResponse.json({ message: "Player added successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST api/players error:", error);
    return NextResponse.json({ error: "failed to add player" }, { status: 500 });
  }
}
