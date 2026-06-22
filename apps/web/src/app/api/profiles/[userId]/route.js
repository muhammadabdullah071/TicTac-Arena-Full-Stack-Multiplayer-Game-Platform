import sql from "@/app/api/utils/sql";

const mockProfile = (userId) => ({
  id: userId,
  username: 'DemoPlayer',
  rank: 'Bronze',
  elo: 1000,
  level: 1,
  xp: 0,
  coins: 100,
  total_matches: 0,
  total_wins: 0,
  total_losses: 0,
  total_draws: 0,
  win_streak: 0,
  highest_streak: 0,
  avatar_url: null,
  bio: null,
});

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const profile = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;

    if (profile.length === 0) {
      // Return mock profile for demo mode (no DB available)
      return Response.json({ profile: mockProfile(userId) });
    }

    return Response.json({ profile: profile[0] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { username, bio, avatar_url } = body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE profiles SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const profile = await sql(query, values);

    if (profile.length === 0) {
      // Return mock updated profile for demo mode
      return Response.json({ profile: { ...mockProfile(userId), username, bio, avatar_url } });
    }

    return Response.json({ profile: profile[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
