import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "../config/prisma";

const expo = new Expo();

/**
 * Send an Expo push notification to a user by profileId.
 * Silently no-ops if the user has no push token or the token is invalid.
 * Never throws — all errors are logged and swallowed so callers are unaffected.
 */
export async function sendPushToProfile(
  profileId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { expoPushToken: true },
    });

    const token = profile?.expoPushToken;
    if (!token || !Expo.isExpoPushToken(token)) return;

    const message: ExpoPushMessage = {
      to: token,
      title,
      body,
      data: data ?? {},
      sound: "default",
    };

    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
          if (ticket.status === "error") {
            console.error(
              "[push] Expo ticket error:",
              ticket.message,
              ticket.details?.error ?? ""
            );
          }
        }
      } catch (chunkErr) {
        console.error("[push] Chunk send failed:", (chunkErr as Error).message);
      }
    }
  } catch (err) {
    console.error("[push] sendPushToProfile failed:", (err as Error).message);
  }
}
