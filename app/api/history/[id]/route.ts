import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // 👈 params is async in Next.js 15+
) {
  const { id } = await context.params; // ✅ await it here
  const playerId = id;

  try {
    const [matches] = await pool.query(
      `
      SELECT 
        m.id AS match_id,
        m.status,
        DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        GROUP_CONCAT(
          CASE 
            WHEN mp.team = p.team AND mp.player_id != p.player_id 
            THEN pl.name 
          END SEPARATOR ', '
        ) AS teammates,
        GROUP_CONCAT(
          CASE 
            WHEN mp.team != p.team 
            THEN pl.name 
          END SEPARATOR ', '
        ) AS opponents
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      JOIN match_players p ON p.match_id = m.id AND p.player_id = ?
      JOIN players pl ON mp.player_id = pl.id
      GROUP BY m.id, m.status, m.created_at
      ORDER BY m.created_at DESC
      `,
      [playerId]
    );

    return NextResponse.json(matches, { status: 200 });
  } catch (error) {
    console.error("Error fetching player history:", error);
    return NextResponse.json(
      { error: "Failed to fetch player history" },
      { status: 500 }
    );
  }
}
