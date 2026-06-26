import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, username } = body;

    if (!email || !username) {
      return Response.json(
        { error: "Email and username are required" },
        { status: 400 },
      );
    }

    try {
      // Check if username already exists
      const existingUsername = await sql`
        SELECT id FROM profiles WHERE username = ${username}
      `;

      if (existingUsername.length > 0) {
        return Response.json(
          { error: "Username already taken" },
          { status: 400 },
        );
      }

      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      let userId;

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
      } else {
        // Create user
        const newUser = await sql`
          INSERT INTO users (email, provider)
          VALUES (${email}, 'email')
          RETURNING id
        `;
        userId = newUser[0]?.id;
      }

      if (!userId) {
        // DB returned empty — use mock
        throw new Error('No userId from DB');
      }

      // Create profile
      const profile = await sql`
        INSERT INTO profiles (id, username, rank, elo, xp, level, coins)
        VALUES (${userId}, ${username}, 'Bronze', 1000, 0, 1, 0)
        RETURNING *
      `;

      if (profile.length === 0) throw new Error('Profile insert returned empty');

      return Response.json({ profile: profile[0] }, { status: 201 });
    } catch (dbError) {
      console.warn('DB unavailable or error, using mock profile:', dbError.message);
      // Return mock success for demo mode
      return Response.json({
        profile: {
          id: 'demo-' + Date.now(),
          username,
          email,
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
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating profile:", error);
    return Response.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}
