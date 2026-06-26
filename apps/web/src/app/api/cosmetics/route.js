import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query;
    if (type) {
      query = sql`
        SELECT c.*,
          uc.is_equipped,
          CASE WHEN uc.user_id IS NOT NULL THEN true ELSE false END as owned
        FROM cosmetics c
        LEFT JOIN user_cosmetics uc ON uc.cosmetic_id = c.id AND uc.user_id = ${userId}
        WHERE c.type = ${type}
        ORDER BY c.price ASC
      `;
    } else {
      query = sql`
        SELECT c.*,
          uc.is_equipped,
          CASE WHEN uc.user_id IS NOT NULL THEN true ELSE false END as owned
        FROM cosmetics c
        LEFT JOIN user_cosmetics uc ON uc.cosmetic_id = c.id AND uc.user_id = ${userId}
        ORDER BY c.type ASC, c.price ASC
      `;
    }

    const cosmetics = await query;

    // Group by type
    const grouped = cosmetics.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});

    return Response.json({ cosmetics, grouped });
  } catch (error) {
    console.error("Cosmetics GET error:", error);
    return Response.json({ error: "Failed to get cosmetics" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, cosmeticId } = body;

    if (action === "purchase") {
      // Get cosmetic
      const cosmetics =
        await sql`SELECT * FROM cosmetics WHERE id = ${cosmeticId}`;
      if (cosmetics.length === 0) {
        return Response.json({ error: "Cosmetic not found" }, { status: 404 });
      }

      const cosmetic = cosmetics[0];

      // Check if already owned
      const owned = await sql`
        SELECT 1 FROM user_cosmetics WHERE user_id = ${userId} AND cosmetic_id = ${cosmeticId}
      `;
      if (owned.length > 0) {
        return Response.json({ error: "Already owned" }, { status: 400 });
      }

      // Check user coins
      const profile =
        await sql`SELECT coins FROM profiles WHERE id = ${userId}`;
      if (!profile[0] || profile[0].coins < cosmetic.price) {
        return Response.json({ error: "Insufficient coins" }, { status: 400 });
      }

      // Deduct coins and grant cosmetic
      await sql`UPDATE profiles SET coins = coins - ${cosmetic.price} WHERE id = ${userId}`;
      await sql`
        INSERT INTO user_cosmetics (user_id, cosmetic_id, is_equipped)
        VALUES (${userId}, ${cosmeticId}, false)
      `;

      // Log transaction
      await sql`
        INSERT INTO transactions (user_id, type, amount, currency, description)
        VALUES (${userId}, 'spend', ${cosmetic.price}, 'coins', 'Purchased: ' || ${cosmetic.name})
      `;

      return Response.json({
        success: true,
        message: `Purchased ${cosmetic.name}`,
      });
    }

    if (action === "equip") {
      const cosmetics =
        await sql`SELECT * FROM cosmetics WHERE id = ${cosmeticId}`;
      if (cosmetics.length === 0) {
        return Response.json({ error: "Cosmetic not found" }, { status: 404 });
      }

      const cosmetic = cosmetics[0];

      // Check ownership
      const owned = await sql`
        SELECT 1 FROM user_cosmetics WHERE user_id = ${userId} AND cosmetic_id = ${cosmeticId}
      `;
      if (owned.length === 0) {
        return Response.json({ error: "Not owned" }, { status: 400 });
      }

      // Unequip all of same type
      await sql`
        UPDATE user_cosmetics uc
        SET is_equipped = false
        FROM cosmetics c
        WHERE uc.cosmetic_id = c.id AND uc.user_id = ${userId} AND c.type = ${cosmetic.type}
      `;

      // Equip this one
      await sql`
        UPDATE user_cosmetics SET is_equipped = true
        WHERE user_id = ${userId} AND cosmetic_id = ${cosmeticId}
      `;

      return Response.json({
        success: true,
        message: `Equipped ${cosmetic.name}`,
      });
    }

    if (action === "unequip") {
      await sql`
        UPDATE user_cosmetics SET is_equipped = false
        WHERE user_id = ${userId} AND cosmetic_id = ${cosmeticId}
      `;
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Cosmetics POST error:", error);
    return Response.json(
      { error: "Failed to process cosmetic action" },
      { status: 500 },
    );
  }
}
