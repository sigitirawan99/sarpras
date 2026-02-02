import { supabase } from "../supabase/client";

export const getDashboardStats = async () => {
  const [sarprasRes, loansRes, complaintsRes, usersRes] = await Promise.all([
    supabase.from("sarpras").select("id, kondisi, stok_tersedia, stok_total"),
    supabase.from("peminjaman").select("id, status", { count: "exact" }),
    supabase.from("pengaduan").select("id, status", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }),
  ]);

  const sarprasData = sarprasRes.data || [];
  const totalStock = sarprasData.reduce((acc, curr) => acc + curr.stok_total, 0);
  const availableStock = sarprasData.reduce(
    (acc, curr) => acc + curr.stok_tersedia,
    0,
  );

  return {
    totalItems: sarprasData.length,
    stockRate: Math.round((availableStock / totalStock) * 100) || 0,
    pendingLoans:
      loansRes.data?.filter((l) => l.status === "menunggu").length || 0,
    activeComplaints:
      complaintsRes.data?.filter((c) => c.status !== "selesai").length || 0,
    totalUsers: usersRes.count || 0,
    sarprasData,
  };
};

export const getRecentLoans = async (userId?: string, limit = 5) => {
  let query = supabase
    .from("peminjaman")
    .select(
      "*, profile:user_id(nama_lengkap), detail:peminjaman_detail(sarpras(nama))",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getRecentComplaints = async (userId?: string, limit = 5) => {
  let query = supabase
    .from("pengaduan")
    .select("*, profile:user_id(nama_lengkap)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};
