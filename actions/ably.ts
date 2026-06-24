"use server";

import * as Ably from "ably";

import { auth } from "@/lib/auth";

/**
 * Issues a short-lived Ably token scoped to the CURRENT user's notification
 * channel (subscribe-only). The client's authCallback uses this so the Ably API
 * key never reaches the browser.
 */
export const createAblyTokenRequest = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) throw new Error("ABLY_API_KEY is not configured");

  const rest = new Ably.Rest(apiKey);
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: userId,
    capability: JSON.stringify({ [`notifications:${userId}`]: ["subscribe"] }),
  });

  return tokenRequest;
};
