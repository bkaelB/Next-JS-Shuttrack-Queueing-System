import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: "Match ID required" }, { status: 400 });

    // increment games_played
    await pool.query(
      `UPDATE players p
       JOIN match_players mp ON p.id = mp.player_id
       SET p.games_played = p.games_played + 1
       WHERE mp.match_id = ?`,
      [matchId]
    );

    // mark those players as recently_finished and start their waiting
    await pool.query(
      `UPDATE players
       SET recently_finished = 1,
           waiting_start = NOW()
       WHERE id IN (SELECT player_id FROM match_players WHERE match_id = ?)`,
      [matchId]
    );

    // mark match finished
    await pool.query(`UPDATE matches SET status = 'finished', ended_at = NOW() WHERE id = ?`, [matchId]);

    // fetch updated players to return (so frontend can update players state immediately)
    const [updatedPlayers] = await pool.query(
      `SELECT p.id, p.games_played, p.waiting_start, p.total_waiting_time, p.recently_finished
       FROM players p
       JOIN match_players mp ON p.id = mp.player_id
       WHERE mp.match_id = ?`,
      [matchId]
    );

    return NextResponse.json({ message: "Match finished", updatedPlayers }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/queue/finish error:", error);
    return NextResponse.json({ error: "Failed to finish match" }, { status: 500 });
  }
}
