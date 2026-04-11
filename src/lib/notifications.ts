import { db } from "@/db";
import { notifications } from "@/db/schema";

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  type: "credential" | "assessment" | "job" | "application" | "system";
  link?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    });
  } catch {
    // Non-critical: log but don't throw
    console.error("Failed to create notification:", params.title);
  }
}
