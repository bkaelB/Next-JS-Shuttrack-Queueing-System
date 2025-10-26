"use client";

import { useEffect, useState } from "react";

interface Player {
  id: number;
  name: string;
  level: string;
  games_played: number;
  done_playing: number;
  waiting_start?: string;
  total_waiting_time?: number;
}

interface MatchPlayer {
  player_id: number;
  name: string;
  team: number;
  done_playing: number;
  level: string;
  games_played: number;
}

interface Match {
  matchId: number;
  players: MatchPlayer[];
  status: "queued" | "ongoing";
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [timerTick, setTimerTick] = useState(0);

  // Fetch players
  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error("error fetching players", error);
    }
  };

  // Fetch matches
  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error("Failed to fetch matches", error);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch player history
  const fetchAndShowHistory = async (playerId: number) => {
    setHoveredPlayerId(playerId);
    try {
      const res = await fetch(`/api/history/${playerId}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setPlayerHistory(data);
    } catch (error) {
      console.error("Error fetching player history:", error);
    }
  };

  // Format waiting time
  function formatWaitingTime(waitingStart?: string, totalSeconds: number = 0) {
    if (!waitingStart) return "00:00:00";
    const start = new Date(waitingStart);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000) + totalSeconds;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Add player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLevel.trim()) return;
    try {
      const res = await fetch("api/players", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          name: newName,
          level: newLevel,
          games_played: 0,
          done_playing: 0,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewLevel("");
        setIsModalOpen(false);
        fetchPlayers();
      }
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  // Mark player as done
  const handleDonePlaying = async (playerId: number) => {
    try {
      const res = await fetch(`/api/players/${playerId}/done`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to update player");
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, done_playing: 1 } : p))
      );
      fetchPlayers();
    } catch (error) {
      console.error(error);
      alert("Failed to mark player as done");
    }
  };

  // Add player to queue
  const handleAddToQueue = async (player: Player) => {
    try {
      const res = await fetch("/api/queue/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      fetchMatches();
    } catch (error) {
      console.error(error);
    }
  };

  // Start match
  const handleStartMatch = async (matchId: number) => {
    try {
      const res = await fetch("/api/queue/start", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start match");
      setMatches((prev) =>
        prev.map((m) => (m.matchId === matchId ? { ...m, status: "ongoing" } : m))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to start match");
    }
  };

  // Finish match
  const handleFinishMatch = async (matchId: number) => {
    try {
      const res = await fetch("/api/queue/finish", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finish match");
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
      fetchPlayers();
    } catch (error) {
      console.error(error);
      alert("Failed to finish match");
    }
  };

  // Cancel match
  const handleCancelMatch = async (matchId: number) => {
    try {
      const res = await fetch(`/api/queue/cancel`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel match");
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch (error) {
      console.error(error);
      alert("Failed to cancel match");
    }
  };

  // Separate players into active & done lists
  const activePlayers = players.filter((p) => p.done_playing === 0);
  const donePlayers = players.filter((p) => p.done_playing === 1);

  //Format playing timmme
  function formatWaitingTime(startTime, totalWaitingTime) {
  if (!startTime) return "0 min";

  const now = new Date();
  const start = new Date(startTime);
  const diff = Math.floor((now - start) / 1000) + (totalWaitingTime || 0);

  const minutes = Math.floor(diff / 60);
  return `${minutes} min${minutes !== 1 ? "s" : ""}`;
}


  return (
    <div className="p-8 flex gap-4">
      {/* Player List */}
      <div className="space-y-4 w-1/5  overflow-y-auto p-4 bg-gray-50 h-screen rounded-2xl shadow-inner">
        <div className="flex justify-between items-center mb-2 ">
          <h2 className="text-lg mb-4 font-bold text-gray-700">Players</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 bg-blue-400 text-white rounded hover:bg-green-600 cursor-pointer"
          >
            + Add Player
          </button>
        </div>

        {/* Active Players */}
        <div className="space-y-2">
          {activePlayers.map((player) => (
            <div
              key={player.id}
              className="flex justify-between items-center relative bg-white hover:shadow-lg transition rounded-xl p-3 border border-gray-200"
            >
              <div >
                <h3 className="text-md font-semibold text-gray-800">{player.name}</h3>
                <div className="flex flex-col text-sm text-gray-600 relative">
                  <div className="flex items-center space-x-2">
                    <p>{player.level}</p>
                    <p>/</p>
                    <p>Games: {player.games_played}</p>
                  </div>
                  <p className="text-green-700 font-mono">
                    ⏱ {formatWaitingTime(player.waiting_start, player.total_waiting_time)}
                  </p>
                  <span
                    className="text-blue-600 underline cursor-pointer mt-1"
                    onMouseEnter={() => fetchAndShowHistory(player.id)}
                    onMouseLeave={() => setHoveredPlayerId(null)}
                  >
                    History
                  </span>

                  {hoveredPlayerId === player.id && playerHistory.length > 0 && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-72 bg-white/95 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-3 z-50">
                      <h4 className="text-sm font-semibold mb-2 text-gray-800">Match History</h4>
                      <ul className="max-h-80 overflow-y-auto text-xs text-gray-700 space-y-2 pr-2">
                        {playerHistory.map((match) => (
                          <li key={match.match_id} className="border-b border-gray-200 pb-2">
                            <p>
                              <strong>Status:</strong> {match.status}
                            </p>
                            <p>
                              <strong>Teammates:</strong> {match.teammates || "None"}
                            </p>
                            <p>
                              <strong>Opponents:</strong> {match.opponents || "None"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>

              <div className="flex flex-col items-end space-y-1">
                <button
                  onClick={() => handleAddToQueue(player)}
                  disabled={matches.some((m) =>
                    m.players.some((p) => p.player_id === player.id)
                  )}
                  className={`px-2 rounded-xl text-md ${matches.some((m) => m.players.some((p) => p.player_id === player.id))
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-700 hover:bg-green-900 cursor-pointer"
                    }`}
                >
                  Add to Queue
                </button>

                <button
                  onClick={() => handleDonePlaying(player.id)}
                  className="text-xs bg-red-400 text-white px-2 py-1 rounded-lg hover:bg-red-950 cursor-pointer"
                >
                  Done Playing
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Done Players */}
        {donePlayers.length > 0 && (
          <>
            <h3 className="text-md font-semibold text-gray-700 mt-4">Finished Players</h3>
            <div className="space-y-2">
              {donePlayers.map((player) => (
                <div
                  key={player.id}
                  className="rounded-xl flex justify-between items-center shadow p-3 bg-red-200 hover:shadow-md transition"
                >
                  <div>
                    <h3 className="text-md font-semibold line-through text-gray-600">
                      {player.name}
                    </h3>
                    <div className="flex text-sm text-gray-600">
                      <p>{player.level}</p>
                      <p className="mx-1">/</p>
                      <p>Games: {player.games_played}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToQueue(player)}
                    className="px-2 py-1 bg-green-800 text-white text-sm rounded-xl hover:bg-green-900 cursor-pointer"
                  >
                    Re-Queue
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Matches Section */}
      <div className="w-3/4 space-y-6 overflow-y-auto max-h-screen">
        <h2 className="text-lg text-gray-500 font-semibold mb-2">Queued Matches</h2>
        {matches.map((match) => (
          <div
            key={match.matchId}
            className="p-2 rounded-xl shadow-md mb-4 bg-gray-50 flex flex-col"
          >
            <div className="flex flex-row w-full gap-4">
              {/* Team 1 */}
              <div className="flex flex-1 h-full gap-2 ">
                {match.players
                  .filter((p) => p.team === 1)
                  .map((p) => (
                    <div
                      key={p.player_id}
                      className={`flex-1 flex flex-col rounded-xl shadow p-3 transition ${p.done_playing ? "bg-red-300" : "bg-gray-100"
                        }`}
                    >
                      <h3
                        className={`font-semibold text-md ${p.done_playing
                            ? "line-through text-gray-600"
                            : "text-gray-800"
                          }`}
                      >
                        {p.name}
                      </h3>
                      <div className="flex space-x-2 text-sm text-gray-600">
                        <p>{p.level}</p>
                        <p>/</p>
                        <p>Games: {p.games_played ?? 0}</p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-center text-black px-2">
                <strong className="text-lg">VS</strong>
              </div>

              {/* Team 2 */}
              <div className="flex flex-1 h-full gap-2">
                {match.players
                  .filter((p) => p.team === 2)
                  .map((p) => (
                    <div
                      key={p.player_id}
                      className={`flex-1 flex flex-col rounded-xl shadow p-3 transition ${p.done_playing ? "bg-red-300" : "bg-gray-100"
                        }`}
                    >
                      <h3
                        className={`font-semibold text-md ${p.done_playing
                            ? "line-through text-gray-600"
                            : "text-gray-800"
                          }`}
                      >
                        {p.name}
                      </h3>
                      <div className="flex space-x-2 text-sm text-gray-600">
                        <p>{p.level}</p>
                        <p>/</p>
                        <p>Games: {p.games_played ?? 0}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-2 flex justify-end">
              {match.status === "queued" ? (
                <button
                  onClick={() => handleStartMatch(match.matchId)}
                  className="px-2 py-1 bg-green-900 text-white font-semibold text-sm rounded-2xl cursor-pointer"
                >
                  Start
                </button>
              ) : (
                <div className="flex">
                  <button
                    onClick={() => handleFinishMatch(match.matchId)}
                    className="px-2 py-1 bg-gray-900 font-semibold text-white text-sm rounded-l-xl cursor-pointer"
                  >
                     ✔ Finish
                  </button>
                  <button
                    onClick={() => handleCancelMatch(match.matchId)}
                    className="px-2 py-1 bg-gray-600 font-semibold text-white text-sm rounded-r-xl cursor-pointer"
                  >
                     ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Player Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative text-black">
            <h2 className="text-xl font-bold mb-4">Add Player</h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold m-0">Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-900 text-white rounded hover:bg-blue-600 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
