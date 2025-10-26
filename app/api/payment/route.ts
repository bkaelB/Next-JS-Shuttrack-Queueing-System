import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ GET: Fetch all payment records
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        payments.id,
        payments.player_id,
        players.name,
        payments.method,
        payments.amount,
        payments.timestamp
      FROM payments
      JOIN players ON payments.player_id = players.id
      ORDER BY payments.timestamp DESC
    `);

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// ✅ POST: Save a new payment record
export async function POST(request: Request) {
  try {
    const { player_id, method, amount } = await request.json();

    // ✅ Fix: check only for null/undefined, not falsy (so 0 is allowed)
    if (player_id == null || method == null || amount == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Insert payment into `payments` table
    const [result]: any = await pool.query(
      `INSERT INTO payments (player_id, method, amount, timestamp)
       VALUES (?, ?, ?, NOW())`,
      [player_id, method, amount]
    );

    // ✅ Try updating player's payment method (ignore if column doesn't exist)
    try {
      await pool.query(
        `UPDATE players 
         SET payment_method = ? 
         WHERE id = ?`,
        [method, player_id]
      );
    } catch (err) {
      console.warn("⚠️ Skipping player payment_method update (column might not exist)");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment saved successfully",
        payment_id: result.insertId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error saving payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save payment" },
      { status: 500 }
    );
  }
}
