import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.id AS match_id,
        m.status,
        DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        GROUP_CONCAT(CASE WHEN mp.team = 1 THEN p.name END SEPARATOR ', ') AS team_a,
        GROUP_CONCAT(CASE WHEN mp.team = 2 THEN p.name END SEPARATOR ', ') AS team_b
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      JOIN players p ON mp.player_id = p.id
      GROUP BY m.id, m.status, m.created_at
      ORDER BY m.created_at DESC
    `);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching all match history:", error);
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 }
    );
  }
}
