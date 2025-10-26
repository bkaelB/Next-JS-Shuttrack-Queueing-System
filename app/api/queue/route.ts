import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ GET queued and ongoing matches
export async function GET() {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        m.id AS matchId,
        m.status,
        mp.player_id,
        mp.team,
        p.name,
        p.level,
        p.games_played,
        p.waiting_start
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      JOIN players p ON mp.player_id = p.id
      WHERE m.status IN ('queued', 'ongoing')
      ORDER BY m.id, mp.team, mp.id
      `
    );

    

    // Group players by matchId
    const grouped: Record<number, any[]> = {};
    (rows as any[]).forEach((row) => {
      if (!grouped[row.matchId]) grouped[row.matchId] = [];
      grouped[row.matchId].push(row);
    });

    
    const matches = Object.keys(grouped).map((id) => ({
      matchId: Number(id),
      status: grouped[Number(id)][0].status,
      players: grouped[Number(id)],
    }));

    return NextResponse.json(matches, { status: 200 });
  } catch (error) {
    console.error("GET /api/queue error:", error);
    return NextResponse.json({ error: "Failed to fetch queued matches" }, { status: 500 });
  }
}
