import { supabase } from "../supabase/client";

export const getKategori = async () => {
  const { data, error } = await supabase
    .from("kategori")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const getKategoriById = async (id: string) => {
  const { data, error } = await supabase
    .from("kategori")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createKategori = async (payload: {
  nama: string;
  deskripsi?: string;
}) => {
  const { error } = await supabase.from("kategori").insert(payload);
  if (error) throw error;
};

export const updateKategori = async (
  id: string,
  payload: { nama: string; deskripsi?: string },
) => {
  const { error } = await supabase
    .from("kategori")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteKategori = async (id: string) => {
  const { error } = await supabase.from("kategori").delete().eq("id", id);

  if (error) throw error;
};
