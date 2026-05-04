import { getDb } from "./index";
import { Notification } from "../types";

export async function getNotificationsByUserId(userId: number): Promise<Notification[]> {
  const db = getDb();
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []) as Notification[];
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = getDb();
  const { count, error } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function createNotification(data: {
  user_id: number;
  type: string;
  post_id?: number;
  message: string;
  created_by?: number;
}): Promise<Notification> {
  const db = getDb();
  const { data: notification, error } = await db
    .from("notifications")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return notification as Notification;
}

export async function markAsRead(id: number): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead(userId: number): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}
