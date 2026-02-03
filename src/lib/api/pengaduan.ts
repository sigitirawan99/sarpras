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
