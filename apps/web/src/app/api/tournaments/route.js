import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const tournaments = await sql`
      SELECT * FROM tournaments
      ORDER BY start_time DESC
      LIMIT 50
    `;

    return Response.json({ tournaments });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return Response.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, startTime, prizePool } = body;

    if (!name || !startTime) {
      return Response.json(
        { error: "Name and start time are required" },
        { status: 400 },
      );
    }

    const tournament = await sql`
      INSERT INTO tournaments (name, status, start_time, prize_pool)
      VALUES (${name}, 'upcoming', ${startTime}, ${prizePool || 0})
      RETURNING *
    `;

    return Response.json({ tournament: tournament[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return Response.json(
      { error: "Failed to create tournament" },
      { status: 500 },
    );
  }
}
