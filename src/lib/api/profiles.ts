import { supabase } from "../supabase/client";
import { Profile } from "../types";
import { recordActivityLog } from "./activity-log";

export const getProfiles = async (page = 1, pageSize = 10) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    data: data as Profile[],
    count: count || 0,
  };
};

export const getProfileById = async (id: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (id: string, payload: Partial<Profile>, updaterId?: string) => {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id);

  if (error) throw error;

  // Record activity log
  if (updaterId) {
    await recordActivityLog({
      user_id: updaterId,
      action: "UPDATE_PROFILE",
      module: "USER",
      description: `Profil user ${payload.nama_lengkap} diperbarui`,
      data_after: payload
    });
  }
};

export const changeUserPassword = async (profileId: string, newPassword: string, oldPassword = "admin") => {
  const { data, error } = await supabase.rpc("change_user_password", {
    p_profile_id: profileId,
    p_new_password: newPassword,
    p_old_password: oldPassword,
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Password lama salah");

  // Record activity log
  await recordActivityLog({
    user_id: profileId,
    action: "CHANGE_PASSWORD",
    module: "USER",
    description: `Password user ${profileId} diubah`,
    data_after: { password: newPassword }
  });
};

export const signUpWithUsername = async (payload: {
  username: string;
  password?: string;
  nama_lengkap: string;
  role: string;
  email?: string | null;
  no_telepon?: string | null;
}, creatorId?: string) => {
  const { data, error } = await supabase.rpc("create_user_with_username", {
    p_username: payload.username,
    p_password: payload.password || "user123",
    p_nama_lengkap: payload.nama_lengkap,
    p_role: payload.role,
    p_email: payload.email || null,
    p_no_telepon: payload.no_telepon || null
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Gagal menambahkan user");

  // Record activity log
  if (creatorId) {
    await recordActivityLog({
      user_id: creatorId,
      action: "CREATE_USER",
      module: "USER",
      description: `User baru ${payload.username} dibuat dari dashboard`,
      data_after: payload
    });
  }

  return data;
};

export const createProfile = async (payload: Omit<Profile, "id" | "created_at" | "updated_at">, creatorId?: string) => {
  const { data, error } = await supabase.from("profiles").insert({
    ...payload,
  }).select().single();

  if (error) throw error;

  // Record activity log
  if (creatorId) {
    await recordActivityLog({
      user_id: creatorId,
      action: "CREATE_USER",
      module: "USER",
      description: `User baru ${payload.username} dibuat`,
      data_after: payload
    });
  }

  return data;
};

export const deleteProfile = async (id: string, username: string, adminId?: string) => {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;

  if (adminId) {
    await recordActivityLog({
      user_id: adminId,
      action: "DELETE_USER",
      module: "USER",
      description: `User ${username} dihapus oleh admin`,
      data_after: { id, username }
    });
  }
};
