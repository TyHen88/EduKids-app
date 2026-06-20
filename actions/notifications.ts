"use server";

import webpush from "web-push";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

import db from "@/db/drizzle";
import { pushSubscriptions, appNotifications } from "@/db/schema";

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
      icon: "/mascot.svg",
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
        await webpush.sendNotification(pushSubscription, payload);
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
    await db.insert(appNotifications).values({
      userId,
      title,
      message,
      actionUrl,
    });
  } catch (error) {
    console.error("Failed to create app notification", error);
  }
};

export const notifyUser = async (userId: string, title: string, message: string, url: string = "/") => {
  // 1. Save to in-app history
  await createAppNotification(userId, title, message, url);
  
  // 2. Trigger web push to all their devices
  await sendPushNotification(userId, title, message, url);
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
