import { supabase } from "../supabase/client";

export const getLokasi = async () => {
  const { data, error } = await supabase
    .from("lokasi")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getLokasiById = async (id: string) => {
  const { data, error } = await supabase
    .from("lokasi")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createLokasi = async (payload: {
  nama_lokasi: string;
  lantai?: string;
  keterangan?: string;
}) => {
  const { error } = await supabase.from("lokasi").insert(payload);
  if (error) throw error;
};

export const updateLokasi = async (
  id: string,
  payload: {
    nama_lokasi?: string;
    lantai?: string;
    keterangan?: string;
  },
) => {
  const { error } = await supabase.from("lokasi").update(payload).eq("id", id);

  if (error) throw error;
};

export const deleteLokasi = async (id: string) => {
  const { error } = await supabase.from("lokasi").delete().eq("id", id);
  if (error) throw error;
  window.location.reload();
};
