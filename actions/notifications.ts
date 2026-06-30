"use server";

import webpush from "web-push";
import * as Ably from "ably";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

import db from "@/db/drizzle";
import { pushSubscriptions, appNotifications, userProgress } from "@/db/schema";
import { getAdminIds } from "@/lib/admin";

// Server-side Ably client (REST) for publishing real-time notifications.
let ablyRest: Ably.Rest | null = null;
const getAblyRest = () => {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  if (!ablyRest) ablyRest = new Ably.Rest(key);
  return ablyRest;
};

// Publish a notification to the recipient's personal channel so an open client
// updates instantly. Best-effort — never throws into the caller.
const publishRealtime = async (userId: string, notification: unknown) => {
  const rest = getAblyRest();
  if (!rest) return;
  try {
    await rest.channels
      .get(`notifications:${userId}`)
      .publish("notification", notification);
  } catch (error) {
    console.error("Ably publish failed", error);
  }
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.NEXT_VAPID_PRIVATE_KEY || "";

// We should specify a contact email for the VAPID details (standard practice)
webpush.setVapidDetails(
  "mailto:test@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const saveSubscription = async (subscription: any) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!subscription || !subscription.endpoint) {
    throw new Error("Invalid subscription object");
  }

  try {
    // Idempotent: a browser has one push endpoint, but multiple users may sign
    // in on it (e.g. a parent then a child on the same device). Link the current
    // user to this endpoint without creating duplicate rows.
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      ),
    });
    if (existing) return { success: true };

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save push subscription", error);
    return { success: false, error: "Failed to save subscription" };
  }
};

export const sendPushNotification = async (userId: string, title: string, body: string, url: string = "/") => {
  try {
    // 0. Respect the recipient's notification preference (Settings toggle).
    const recipient = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { notificationsEnabled: true },
    });
    if (recipient && !recipient.notificationsEnabled) {
      return { success: false, message: "User has notifications disabled" };
    }

    // 1. Fetch all subscriptions for the user
    const userSubscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    if (userSubscriptions.length === 0) {
      return { success: false, message: "No active subscriptions for this user" };
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: "/edu-logo.png",
    });

    // 2. Send push to all registered devices for the user
    const notifications = userSubscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        // Bound the request so an unreachable/stale push endpoint can never
        // hang the caller (this was leaving create-child requests pending).
        await Promise.race([
          webpush.sendNotification(pushSubscription, payload),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("push-timeout")), 5000)
          ),
        ]);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription has expired or is no longer valid, we should delete it
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error("Error sending push notification to endpoint", error);
        }
      }
    });

    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    console.error("Error in sendPushNotification wrapper:", error);
    return { success: false };
  }
};

// --- App Notifications Actions -----------------------------------------------

export const createAppNotification = async (userId: string, title: string, message: string, actionUrl: string = "/") => {
  try {
    const [row] = await db
      .insert(appNotifications)
      .values({ userId, title, message, actionUrl })
      .returning();
    return row ?? null;
  } catch (error) {
    console.error("Failed to create app notification", error);
    return null;
  }
};

export const notifyUser = async (userId: string, title: string, message: string, url: string = "/") => {
  // 1. Save to in-app history
  const row = await createAppNotification(userId, title, message, url);

  // 2. Push it to the user's live client via Ably (instant bell update)
  if (row) await publishRealtime(userId, row);

  // 3. Trigger web push to all their devices
  await sendPushNotification(userId, title, message, url);
};

// Fan a notification out to every configured admin (ADMIN_IDS). Used for staff
// alerts such as a new user registering. Best-effort: a failing admin (e.g. one
// with no profile row) is logged inside notifyUser and never blocks the caller.
export const notifyAdmins = async (title: string, message: string, url: string = "/") => {
  const adminIds = getAdminIds();
  await Promise.all(
    adminIds.map((adminId) => notifyUser(adminId, title, message, url))
  );
};

export const markNotificationAsRead = async (notificationId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    await db.update(appNotifications)
      .set({ isRead: true })
      .where(and(eq(appNotifications.id, notificationId), eq(appNotifications.userId, userId)));
    
    // We do not revalidatePath here because it will happen from the client or we can just let it be optimistic
    return { success: true };
  } catch (error) {
    console.error("Failed to mark as read", error);
    return { success: false };
  }
};

export const markAllNotificationsAsRead = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    await db.update(appNotifications)
      .set({ isRead: true })
      .where(and(eq(appNotifications.userId, userId), eq(appNotifications.isRead, false)));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read", error);
    return { success: false };
  }
};
