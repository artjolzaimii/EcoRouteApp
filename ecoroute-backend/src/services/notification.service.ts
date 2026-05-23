import { prisma } from "../config/prisma";
import { sendPushToProfile } from "./push.service";

interface NotificationInput {
  profileId: string;
  title: string;
  body: string;
  refType?: string;
  refId?: string;
}

/**
 * Creates an in-app notification row and fires a push notification.
 * The push is fire-and-forget — a push failure never rejects this promise.
 */
export async function createNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({ data: input });

  sendPushToProfile(input.profileId, input.title, input.body, {
    refType: input.refType,
    refId: input.refId,
  }).catch(() => {});

  return notification;
}
