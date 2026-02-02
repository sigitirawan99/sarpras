import { supabase } from "../supabase/client";
import { setAuthSession } from "../supabase/auth";
import { recordActivityLog } from "./activity-log";

export const login = async (username: string, password: string) => {
  const { data, error } = await supabase.rpc("verify_user_login", {
    p_username: username,
    p_password: password,
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Login gagal");

  setAuthSession(data.user);

  // Record activity log
  await recordActivityLog({
    user_id: data.user.id,
    action: "LOGIN",
    module: "AUTH",
    description: `User ${username} berhasil login ke dalam sistem`,
    data_after: { username, role: data.user.role }
  });

  return data.user;
};
