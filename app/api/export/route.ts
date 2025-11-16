import { NextResponse } from "next/server";
import pool from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    //  Fetch Match History 
    const [matches]: any = await pool.query(`
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

    // Fetch Payments
    const [payments]: any = await pool.query(`
      SELECT 
        payments.id AS payment_id,
        players.name AS player_name,
        payments.method,
        payments.amount,
        DATE_FORMAT(payments.timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp
      FROM payments
      JOIN players ON payments.player_id = players.id
      ORDER BY payments.timestamp DESC
    `);

    // Create Workbook 
    const workbook = new ExcelJS.Workbook();

    //  MATCH HISTORY SHEET
    const matchSheet = workbook.addWorksheet("Match History");
    matchSheet.columns = [
      { header: "Match ID", key: "match_id", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Created At", key: "created_at", width: 20 },
      { header: "Team A", key: "team_a", width: 30 },
      { header: "Team B", key: "team_b", width: 30 },
    ];
    matches.forEach((m: any) => matchSheet.addRow(m));

    matchSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    matchSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0077B6" },
    };

    //  PAYMENTS SHEET
    const paySheet = workbook.addWorksheet("Payments");
    paySheet.columns = [
      { header: "Payment ID", key: "payment_id", width: 10 },
      { header: "Player Name", key: "player_name", width: 25 },
      { header: "Method", key: "method", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Timestamp", key: "timestamp", width: 20 },
    ];
    payments.forEach((p: any) => paySheet.addRow(p));

    paySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    paySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00A896" },
    };

    //  Add Totals Summary 
    const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalGcash = payments
      .filter((p: any) => p.method === "gcash")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalCash = payments
      .filter((p: any) => p.method === "cash")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const lastRow = payments.length + 3;
    paySheet.addRow([]);
    paySheet.addRow(["", "", "Total GCash", totalGcash]);
    paySheet.addRow(["", "", "Total Cash", totalCash]);
    paySheet.addRow(["", "", "Total Collected", totalAmount]);

    // Make summary rows bold and color coded
    for (let i = lastRow; i <= lastRow + 2; i++) {
      const row = paySheet.getRow(i);
      row.font = { bold: true };
      if (row.getCell(3).value === "Total GCash") {
        row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF90E0EF" } };
      } else if (row.getCell(3).value === "Total Cash") {
        row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB7E4C7" } };
      } else {
        row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC300" } };
      }
    }

    // Return the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=badminton_data.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
