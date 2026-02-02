import { supabase } from "../supabase/client";
import { recordActivityLog } from "./activity-log";

export type ReturnPayload = {
  peminjaman_id: string;
  petugas_id: string;
  catatan: string;
  kondisi: string;
  foto: string | null;
  sarpras_id: string;
  jumlah: number;
  user_id: string; // the borrower's user_id for automatic complaint if lost
  kode_peminjaman: string;
};

export const getPeminjamanByCode = async (code: string) => {
  const { data, error } = await supabase
    .from("peminjaman")
    .select(
      `
      *,
      profile:user_id (id, nama_lengkap, username),
      peminjaman_detail (
        id,
        jumlah,
        sarpras:sarpras_id (id, nama, kode, kondisi, stok_tersedia)
      )
    `,
    )
    .eq("kode_peminjaman", code.trim())
    .in("status", ["disetujui", "dipinjam"])
    .single();

  if (error) throw error;
  return data;
};

export const processReturn = async (payload: ReturnPayload) => {
  // 1. Create Pengembalian record
  const { data: returnRec, error: rError } = await supabase
    .from("pengembalian")
    .insert({
      peminjaman_id: payload.peminjaman_id,
      petugas_id: payload.petugas_id,
      catatan: payload.catatan,
      tanggal_kembali_real: new Date().toISOString(),
    })
    .select()
    .single();

  if (rError) throw rError;

  // 2. Create Pengembalian Detail
  const { error: rdError } = await supabase
    .from("pengembalian_detail")
    .insert({
      pengembalian_id: returnRec.id,
      sarpras_id: payload.sarpras_id,
      jumlah: payload.jumlah,
      kondisi: payload.kondisi,
      deskripsi: payload.catatan,
      foto: payload.foto,
      damage_detected: payload.kondisi !== "baik",
    });

  if (rdError) throw rdError;

  // 3. Update Peminjaman status
  const { error: lpError } = await supabase
    .from("peminjaman")
    .update({
      status: "dikembalikan",
      tanggal_kembali_real: new Date().toISOString(),
    })
    .eq("id", payload.peminjaman_id);

  if (lpError) throw lpError;

  // 4. Update Sarpras stock and condition
  await supabase.rpc("update_stock", {
    p_sarpras_id: payload.sarpras_id,
    p_jumlah: payload.jumlah,
    p_jenis: "kembali",
    p_referensi_id: returnRec.id,
  });

  const { error: lsError } = await supabase
    .from("sarpras")
    .update({ kondisi: payload.kondisi })
    .eq("id", payload.sarpras_id);

  if (lsError) throw lsError;

  // 5. Automatic complaint if lost
  if (payload.kondisi === "hilang") {
    await supabase.rpc("create_pengaduan_from_lost_item", {
      p_sarpras_id: payload.sarpras_id,
      p_user_id: payload.user_id,
      p_peminjaman_id: payload.peminjaman_id,
    });
  }

  // 6. Record to Riwayat Kondisi Alat
  await supabase.from("riwayat_kondisi_alat").insert({
    sarpras_id: payload.sarpras_id,
    kondisi: payload.kondisi,
    deskripsi: payload.catatan,
    sumber: `Pengembalian ${payload.kode_peminjaman}`,
    foto: payload.foto,
    created_by: payload.petugas_id,
  });

  // 7. Record Activity Log
  await recordActivityLog({
    user_id: payload.petugas_id,
    action: "PROCESS_RETURN",
    module: "PEMINJAMAN",
    description: `Petugas memproses pengembalian untuk ${payload.kode_peminjaman}`,
    data_after: {
      peminjaman_id: payload.peminjaman_id,
      kondisi: payload.kondisi
    }
  });

  return returnRec;
};
