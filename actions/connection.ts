"use server";

import { auth } from "@/lib/auth";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { userFollowers, userProgress } from "@/db/schema";
import { searchUsers } from "@/db/queries";
import { notifyUser } from "@/actions/notifications";

export const sendFriendRequest = async (followingId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (userId === followingId) {
    throw new Error("Cannot add yourself");
  }

  try {
    // Insert with isAccepted: false (default)
    await db.insert(userFollowers).values({
      followerId: userId,
      followingId,
      isAccepted: false,
    });

    // Notify the user that they received a friend request
    // We fetch the current user's info to use their name in the notification
    const currentUser = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (currentUser) {
      await notifyUser(
        followingId,
        "New Friend Request!",
        `${currentUser.userName} has sent you a friend request.`,
        "/en/friends"
      );
    }
  } catch (error) {
    console.error("Failed to send friend request", error);
  }

  revalidatePath("/[lang]/friends", "page");
  revalidatePath("/[lang]/learn", "page");
};

export const acceptFriendRequest = async (requesterId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Set the incoming request to accepted
    await db
      .update(userFollowers)
      .set({ isAccepted: true })
      .where(
        and(
          eq(userFollowers.followerId, requesterId),
          eq(userFollowers.followingId, userId)
        )
      );

    // Create the reverse relationship automatically
    await db.insert(userFollowers).values({
      followerId: userId,
      followingId: requesterId,
      isAccepted: true,
    });

    // Notify the requester that their friend request was accepted
    const currentUser = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (currentUser) {
      await notifyUser(
        requesterId,
        "Friend Request Accepted!",
        `${currentUser.userName} has accepted your friend request.`,
        "/en/friends"
      );
    }
  } catch (error) {
    console.error("Failed to accept friend request", error);
  }

  revalidatePath("/[lang]/friends", "page");
  revalidatePath("/[lang]/learn", "page");
};

export const removeFriend = async (otherUserId: string) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Delete relationship in either direction
  await db
    .delete(userFollowers)
    .where(
      or(
        and(
          eq(userFollowers.followerId, userId),
          eq(userFollowers.followingId, otherUserId)
        ),
        and(
          eq(userFollowers.followerId, otherUserId),
          eq(userFollowers.followingId, userId)
        )
      )
    );

  revalidatePath("/[lang]/friends", "page");
  revalidatePath("/[lang]/learn", "page");
};

export const loadMoreUsers = async (query: string, offset: number) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return searchUsers(query, offset);
};

