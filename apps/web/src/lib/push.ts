import { prisma } from "@tictac/database";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@tictacarena.com";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export async function subscribeUser(userId: string, subscription: PushSubscriptionJSON) {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return;
  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeUser(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const webpush = await import("web-push");
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch {
      if (typeof (await import("web-push")).WebPushError !== "undefined") {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

export const NOTIFICATION_TYPES = {
  FRIEND_ONLINE: "friend_online",
  FRIEND_CHALLENGE: "friend_challenge",
  MATCH_FOUND: "match_found",
  MATCH_STARTING: "match_starting",
  TOURNAMENT_STARTING: "tournament_starting",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
  DAILY_REWARD_READY: "daily_reward_ready",
  RANK_PROMOTION: "rank_promotion",
} as const;
