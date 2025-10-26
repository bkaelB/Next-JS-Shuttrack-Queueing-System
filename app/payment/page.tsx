"use client";

import React, { useEffect, useState } from "react";

interface Player {
    id: number;
    name: string;
    games_played: number;
}

interface Payment {
    id: number;
    player_id: number;
    method: string;
    amount: number;
    timestamp: string;
    name?: string;
}

export default function PaymentPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paidPlayers, setPaidPlayers] = useState<number[]>([]);
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // Fetch players
    const fetchPlayers = async () => {
        try {
            const res = await fetch("/api/players");
            if (!res.ok) throw new Error("Failed to fetch players");
            const data = await res.json();
            setPlayers(data);
        } catch (error) {
            console.error("Error fetching players:", error);
        }
    };

    // Fetch payments
    const fetchPayments = async () => {
        try {
            const res = await fetch("/api/payment");
            if (!res.ok) throw new Error("Failed to fetch payments");
            const raw: any[] = await res.json();

            const normalized: Payment[] = raw.map((p) => ({
                ...p,
                amount: Number(p.amount) || 0,
            }));

            setPayments(normalized);
            setPaidPlayers(normalized.map((p) => p.player_id));
            setPaidAmount(normalized.reduce((sum, p) => sum + p.amount, 0));
        } catch (error) {
            console.error("Error fetching payments:", error);
            setPayments([]);
            setPaidPlayers([]);
            setPaidAmount(0);
        }
    };

    const totalGCash = payments
        .filter((p) => p.method?.toLowerCase() === "gcash")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalCash = payments
        .filter((p) => p.method?.toLowerCase() === "cash")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Confirm payment
    const handleConfirmPaid = async () => {
        if (!selectedPlayer || !paymentMethod) return;
        setLoading(true);

        try {
            const amountToCharge = selectedPlayer.games_played * 30;

            const res = await fetch("/api/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    player_id: selectedPlayer.id,
                    method: paymentMethod,
                    amount: amountToCharge,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || err?.message || "Failed to save payment");
            }

            // Update local UI quickly
            setPaidPlayers((prev) => [...prev, selectedPlayer.id]);
            setPaidAmount((prev) => prev + amountToCharge);

            // Reset modal
            setSelectedPlayer(null);
            setPaymentMethod("");
            setShowModal(false);

            await fetchPlayers();
            await fetchPayments();
        } catch (error) {
            console.error("Error saving payment:", error);
            alert("Error saving payment. Check console for details.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPlayers();
        fetchPayments();
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                💸 Player Payments
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* LEFT SIDE */}
                <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">
                        Player List
                    </h2>

                    <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
                        <thead className="bg-gray-200 text-gray-800">
                            <tr>
                                <th className="border border-gray-300 p-2 text-left">Name</th>
                                <th className="border border-gray-300 p-2 text-center">
                                    Games Played
                                </th>
                                <th className="border border-gray-300 p-2 text-right">
                                    Amount to Pay
                                </th>
                                <th className="border border-gray-300 p-2 text-center">
                                    Payment
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {players.map((player) => {
                                const amountToPay = player.games_played * 30;
                                const isPaid = paidPlayers.includes(player.id);

                                return (
                                    <tr key={player.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-200 p-2">{player.name}</td>
                                        <td className="border border-gray-200 p-2 text-center">
                                            {player.games_played}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-right">
                                            ₱{amountToPay.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-center">
                                            {isPaid ? (
                                                <span className="text-green-600 font-semibold">Paid</span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPlayer(player);
                                                        setShowModal(true);
                                                    }}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                                                >
                                                    Confirm
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* RIGHT SIDE */}
                <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">
                        Payment History
                    </h2>

                    <div className="max-h-[400px] overflow-y-auto border border-gray-300 rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-200 text-gray-800 sticky top-0">
                                <tr>
                                    <th className="border border-gray-300 p-2 text-left">Player</th>
                                    <th className="border border-gray-300 p-2 text-left">Method</th>
                                    <th className="border border-gray-300 p-2 text-right">Amount</th>
                                    <th className="border border-gray-300 p-2 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-200 p-2">{p.name}</td>
                                        <td className="border border-gray-200 p-2 capitalize">
                                            {p.method}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-right">
                                            ₱{p.amount.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-200 p-2 text-gray-600">
                                            {new Date(p.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex gap-6  text-lg font-semibold text-gray-900">
                        <div>
                            Total Paid: <span className="text-green-600">₱{paidAmount.toFixed(2)}</span>
                        </div>
                        <div>
                            Total Cash: <span className="text-green-600">₱{totalCash.toFixed(2)}</span>
                        </div>
                        <div>
                            Total GCash: <span className="text-green-600">₱{totalGCash.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showModal && selectedPlayer && (
                <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-80 border border-gray-200">
                        <h3 className="text-lg font-bold mb-3 text-gray-900">Confirm Payment</h3>
                        <p className="mb-4 text-gray-700">
                            Confirm payment for{" "}
                            <span className="font-semibold text-blue-600">
                                {selectedPlayer.name}
                            </span>{" "}
                            for{" "}
                            <span className="text-green-600">
                                ₱{(selectedPlayer.games_played * 30).toFixed(2)}
                            </span>
                            ?
                        </p>

                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="border border-gray-300 rounded p-2 w-full mb-4 text-gray-800"
                        >
                            <option value="">Select Method</option>
                            <option value="cash">Cash</option>
                            <option value="gcash">GCash</option>
                        </select>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPaid}
                                disabled={loading || !paymentMethod}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
