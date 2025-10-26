"use client";

import { useEffect, useState } from "react";

interface Match {
  match_id: number;
  status: string;
  created_at: string;
  team_a: string;
  team_b: string;
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history/");
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error("Error fetching match history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          🏸 Match History
        </h1>

        {loading ? (
          <p className="text-gray-600 text-center">Loading match history...</p>
        ) : matches.length === 0 ? (
          <p className="text-gray-600 text-center">No matches found.</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.match_id}
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">
                    Match ID: <span className="font-mono">{match.match_id}</span>
                  </p>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      match.status === "finished"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {match.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <h2 className="font-semibold text-gray-800 mb-1">
                      Team A
                    </h2>
                    <p className="text-sm text-gray-600">
                      {match.team_a || "—"}
                    </p>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800 mb-1">
                      Team B
                    </h2>
                    <p className="text-sm text-gray-600">
                      {match.team_b || "—"}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-3 text-right">
                  Played on: {new Date(match.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
