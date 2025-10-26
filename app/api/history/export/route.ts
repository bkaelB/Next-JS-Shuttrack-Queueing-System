import { NextResponse } from "next/server";
import pool from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    // Fetch all matches
    const [rows]: any = await pool.query(`
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

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Match History");

    // Add header row
    worksheet.columns = [
      { header: "Match ID", key: "match_id", width: 10 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "created_at", width: 20 },
      { header: "Team A", key: "team_a", width: 30 },
      { header: "Team B", key: "team_b", width: 30 },
    ];

    // Add data rows
    rows.forEach((match: any) => {
      worksheet.addRow(match);
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0077B6" },
    };

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=match_history.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting match history:", error);
    return NextResponse.json(
      { error: "Failed to export match history" },
      { status: 500 }
    );
  }
}
