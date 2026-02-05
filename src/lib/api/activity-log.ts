import { supabase } from "../supabase/client";

export type LogPayload = {
  user_id?: string | null;
  action: string;
  module: string;
  description: string;
  data_before?: Record<string, unknown> | null;
  data_after?: Record<string, unknown> | null;
};

/**
 * Record a new activity log entry
 */
export const recordActivityLog = async (payload: LogPayload) => {
  try {
    const { error } = await supabase.from("activity_log").insert({
      ...payload,
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null,
      // ip_address is usually handled by database functions or server-side
    });

    if (error) {
      console.error("Failed to record activity log:", error);
    }
  } catch (error) {
    console.error("Error in recordActivityLog:", error);
  }
};

export const getActivityLogs = async (page = 1, pageSize = 10) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("activity_log")
    .select(
      `
      *,
      profile:user_id (id, nama_lengkap, username, role)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    data,
    count: count || 0,
  };
};
