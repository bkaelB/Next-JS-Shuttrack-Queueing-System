import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { playerId } = await req.json();
    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    // prevent double-queue
    const [existing] = await pool.query(
      `SELECT mp.* FROM match_players mp JOIN matches m ON mp.match_id = m.id
       WHERE mp.player_id = ? AND m.status IN ('queued','ongoing')`,
      [playerId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ message: "Player already in queue or match" }, { status: 400 });
    }

    // find queued match with space
    const [queuedMatches] = await pool.query(
      `SELECT m.id, COUNT(mp.id) AS player_count
       FROM matches m
       LEFT JOIN match_players mp ON m.id = mp.match_id
       WHERE m.status = 'queued'
       GROUP BY m.id
       HAVING player_count < 4
       ORDER BY m.created_at ASC
       LIMIT 1`
    );

    let matchId: number;
    if ((queuedMatches as any[]).length > 0) {
      matchId = (queuedMatches as any[])[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO matches (status, created_at) VALUES ('queued', NOW())`
      );
      matchId = (result as any).insertId;
    }

    // determine team
    const [playersInMatch] = await pool.query(`SELECT COUNT(*) AS count FROM match_players WHERE match_id = ?`, [matchId]);
    const count = (playersInMatch as any[])[0].count;
    const team = count < 2 ? 1 : 2;

    // insert into match_players
    await pool.query(`INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)`, [matchId, playerId, team]);

    // reset waiting flags for this player (they are now in a match/queue)
    await pool.query(
      `UPDATE players
       SET waiting_start = NULL, total_waiting_time = 0, recently_finished = 0
       WHERE id = ?`,
      [playerId]
    );

    // fetch players in this match (join correct columns)
    const [matchPlayers] = await pool.query(
      `SELECT mp.player_id, mp.team, p.name, p.level, p.done_playing, p.games_played
       FROM match_players mp
       JOIN players p ON mp.player_id = p.id
       WHERE mp.match_id = ?
       ORDER BY mp.team, mp.id`,
      [matchId]
    );

    return NextResponse.json({ message: "Player added to queue", matchId, players: matchPlayers }, { status: 200 });
  } catch (error) {
    console.error("POST /api/queue/add error:", error);
    return NextResponse.json({ error: "Failed to add player to queue" }, { status: 500 });
  }
}
