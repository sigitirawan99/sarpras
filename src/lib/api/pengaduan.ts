import { supabase } from "../supabase/client";
import { recordActivityLog } from "./activity-log";

export type CreatePengaduanPayload = {
  user_id: string;
  judul: string;
  deskripsi: string;
  lokasi?: string | null;
  sarpras_id?: string | null;
  foto?: string | null;
  prioritas: "rendah" | "normal" | "tinggi" | "urgent";
};

export const createPengaduan = async (payload: CreatePengaduanPayload) => {
  const { data, error } = await supabase.from("pengaduan").insert({
    ...payload,
    status: "menunggu",
  }).select().single();

  if (error) throw error;

  // Record activity log
  await recordActivityLog({
    user_id: payload.user_id,
    action: "CREATE_COMPLAINT",
    module: "PENGADUAN",
    description: `Pengaduan baru dibuat: "${payload.judul}" dengan prioritas ${payload.prioritas}`,
    data_after: {
      pengaduan_id: data.id,
      judul: payload.judul,
      prioritas: payload.prioritas
    }
  });

  return data;
};
export const getPengaduanList = async (params?: {
  userId?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("pengaduan")
    .select(
      `
      *,
      profile:user_id (id, nama_lengkap, username, foto_profil),
      sarpras:sarpras_id (id, nama, kode),
      progress:pengaduan_progress (id, catatan, status, created_at)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params?.userId) {
    query = query.eq("user_id", params.userId);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    data,
    count: count || 0,
  };
};
