import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const { playerId } = params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        m.id AS match_id,
        m.status,
        m.start_at,
        m.ended_at,
        GROUP_CONCAT(p2.name SEPARATOR ', ') AS teammates,
        GROUP_CONCAT(
          CASE WHEN mp2.team != mp.team THEN p2.name END
          SEPARATOR ', '
        ) AS opponents
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      JOIN match_players mp2 ON m.id = mp2.match_id
      JOIN players p2 ON mp2.player_id = p2.id
      WHERE mp.player_id = ?
      GROUP BY m.id, m.status, m.start_at, m.ended_at
      ORDER BY m.created_at DESC
      `,
      [playerId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching player history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
