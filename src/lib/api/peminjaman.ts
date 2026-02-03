import { supabase } from "../supabase/client";
import { recordActivityLog } from "./activity-log";

export type CreatePeminjamanPayload = {
  user_id: string;
  tanggal_pinjam: string;
  tanggal_kembali_estimasi: string;
  tujuan: string;
  sarpras_id: string;
  jumlah: number;
  kondisi_pinjam?: string;
};

export const createPeminjaman = async (payload: CreatePeminjamanPayload) => {
  // 1. Create Peminjaman
  const { data: peminjaman, error: pError } = await supabase
    .from("peminjaman")
    .insert({
      user_id: payload.user_id,
      tanggal_pinjam: payload.tanggal_pinjam,
      tanggal_kembali_estimasi: payload.tanggal_kembali_estimasi,
      tujuan: payload.tujuan,
      status: "menunggu",
    })
    .select()
    .single();

  if (pError) throw pError;

  // 2. Create Peminjaman Detail
  const { error: dError } = await supabase
    .from("peminjaman_detail")
    .insert({
      peminjaman_id: peminjaman.id,
      sarpras_id: payload.sarpras_id,
      jumlah: payload.jumlah,
      kondisi_pinjam: payload.kondisi_pinjam,
    });

  if (dError) throw dError;

  // 3. Record Activity Log
  await recordActivityLog({
    user_id: payload.user_id,
    action: "CREATE_LOAN",
    module: "PEMINJAMAN",
    description: `User mengajukan peminjaman ${payload.jumlah} unit sarpras untuk tujuan: ${payload.tujuan}`,
    data_after: {
      peminjaman_id: peminjaman.id,
      sarpras_id: payload.sarpras_id,
      jumlah: payload.jumlah
    }
  });

  return peminjaman;
};

export const getLoans = async (filter?: { userId?: string }) => {
  let query = supabase
    .from("peminjaman")
    .select(
      `
      *,
      profile:user_id (id, nama_lengkap, username),
      peminjaman_detail (
        id,
        jumlah,
        sarpras:sarpras_id (id, nama, kode, stok_tersedia)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (filter?.userId) {
    query = query.eq("user_id", filter.userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const approveLoan = async (loanId: string, detail: any, petugasId: string) => {
  // 1. Check stock
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("stok_tersedia")
    .eq("id", detail.sarpras.id)
    .single();

  if (sError) throw sError;
  if (sarpras.stok_tersedia < detail.jumlah) {
    throw new Error("Stok sudah tidak mencukupi!");
  }

  // 2. Update status
  const { error: updateError } = await supabase
    .from("peminjaman")
    .update({
      status: "disetujui",
      petugas_approval_id: petugasId,
      tanggal_approval: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (updateError) throw updateError;

  // 3. Update stock
  const { error: stockError } = await supabase.rpc("update_stock", {
    p_sarpras_id: detail.sarpras.id,
    p_jumlah: -detail.jumlah,
    p_jenis: "pinjam",
    p_referensi_id: loanId,
  });

  if (stockError) {
    // Fallback
    await supabase
      .from("sarpras")
      .update({ stok_tersedia: sarpras.stok_tersedia - detail.jumlah })
      .eq("id", detail.sarpras.id);
  }

  // Record activity log
  await recordActivityLog({
    user_id: petugasId,
    action: "APPROVE_LOAN",
    module: "PEMINJAMAN",
    description: `Peminjaman dengan ID ${loanId} telah disetujui oleh Petugas`,
    data_after: { loanId, status: "disetujui" }
  });
};

export const rejectLoan = async (loanId: string, alasan: string, petugasId: string) => {
  const { error } = await supabase
    .from("peminjaman")
    .update({
      status: "ditolak",
      alasan_penolakan: alasan,
      petugas_approval_id: petugasId,
      tanggal_approval: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (error) throw error;

  // Record activity log
  await recordActivityLog({
    user_id: petugasId,
    action: "REJECT_LOAN",
    module: "PEMINJAMAN",
    description: `Peminjaman dengan ID ${loanId} ditolak oleh Petugas. Alasan: ${alasan}`,
    data_after: { loanId, status: "ditolak", alasan }
  });
};
