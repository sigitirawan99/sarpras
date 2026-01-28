import { supabase } from "../supabase/client";
import { Sarpras } from "../types";

export const getSarprasList = async () => {
  const { data, error } = await supabase
    .from("sarpras")
    .select(
      `
      id,
      kode,
      nama,
      stok_total,
      stok_tersedia,
      kondisi,
      is_active,
      kategori:kategori_id (id, nama),
      lokasi:lokasi_id (id, nama_lokasi)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as Sarpras[];
};

export const getSarprasById = async (id: string) => {
  const { data, error } = await supabase
    .from("sarpras")
    .select(
      `
      id,
      kode,
      nama,
      kategori_id,
      lokasi_id,
      stok_total,
      stok_tersedia,
      kondisi,
      tanggal_perolehan
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as Sarpras;
};

export const createSarpras = async (payload: {
  nama: string;
  kategori_id: string;
  lokasi_id: string;
  stok_total: number;
  kondisi?: "baik" | "rusak_ringan" | "rusak_berat" | "hilang";
  tanggal_perolehan?: string;
}) => {
  const insertData = {
    ...payload,
    stok_tersedia: payload.stok_total, // WAJIB
  };

  const { error } = await supabase.from("sarpras").insert(insertData);
  if (error) throw error;
};

export const updateSarpras = async (
  id: string,
  payload: {
    nama?: string;
    kategori_id?: string;
    lokasi_id?: string;
    stok_total?: number;
    stok_tersedia?: number;
    kondisi?: "baik" | "rusak_ringan" | "rusak_berat" | "hilang";
  },
) => {
  const { error } = await supabase.from("sarpras").update(payload).eq("id", id);

  if (error) throw error;
};

export const deleteSarpras = async (id: string) => {
  const { error } = await supabase
    .from("sarpras")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
};
