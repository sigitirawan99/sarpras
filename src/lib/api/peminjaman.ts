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

interface LoanDetail {
  sarpras: {
    id: string;
  };
  jumlah: number;
}

export const getEffectiveStock = async (sarprasId: string) => {
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("stok_tersedia")
    .eq("id", sarprasId)
    .single();

  if (sError) throw sError;

  const { data: pendingRequests, error: pReqError } = await supabase
    .from("peminjaman_detail")
    .select("jumlah, peminjaman(status)")
    .eq("sarpras_id", sarprasId)
    .filter("peminjaman.status", "eq", "menunggu");

  if (pReqError) throw pReqError;

  const totalPending = (pendingRequests || []).reduce((acc, curr) => {
    if ((curr.peminjaman as any)?.status === "menunggu") {
      return acc + curr.jumlah;
    }
    return acc;
  }, 0);

  return {
    stok_tersedia: sarpras.stok_tersedia,
    total_pending: totalPending,
    effective_stock: sarpras.stok_tersedia - totalPending,
  };
};

export const createPeminjaman = async (payload: CreatePeminjamanPayload) => {
  // 1. Validation: Date
  const pinjam = new Date(payload.tanggal_pinjam);
  const kembali = new Date(payload.tanggal_kembali_estimasi);
  if (kembali < pinjam) {
    throw new Error("Estimasi pengembalian tidak boleh sebelum tanggal pinjam");
  }

  // 2. Validation: Effective Stock (Total Stock - (Borrowed + Pending))
  // a. Get current sarpras stock_tersedia
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("stok_tersedia")
    .eq("id", payload.sarpras_id)
    .single();

  if (sError) throw sError;

  // b. Calculate pending requests for this sarpras
  const { data: pendingRequests, error: pReqError } = await supabase
    .from("peminjaman_detail")
    .select("jumlah, peminjaman(status)")
    .eq("sarpras_id", payload.sarpras_id)
    .filter("peminjaman.status", "eq", "menunggu");

  if (pReqError) throw pReqError;

  const totalPending = (pendingRequests || []).reduce((acc, curr) => {
    // Filter double check because Supabase nested filtering can be tricky
    if ((curr.peminjaman as any)?.status === "menunggu") {
      return acc + curr.jumlah;
    }
    return acc;
  }, 0);

  const effectiveStock = sarpras.stok_tersedia - totalPending;

  if (effectiveStock < payload.jumlah) {
    throw new Error(
      `Stok tidak mencukupi untuk permintaan baru. Tersedia: ${sarpras.stok_tersedia}, Sudah dipesan orang lain: ${totalPending}. Stok efektif: ${effectiveStock}`,
    );
  }

  // 3. Create Peminjaman
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

  // 4. Create Peminjaman Detail
  const { error: dError } = await supabase.from("peminjaman_detail").insert({
    peminjaman_id: peminjaman.id,
    sarpras_id: payload.sarpras_id,
    jumlah: payload.jumlah,
    kondisi_pinjam: payload.kondisi_pinjam,
  });

  if (dError) throw dError;

  // 5. Record Activity Log
  await recordActivityLog({
    user_id: payload.user_id,
    action: "CREATE_LOAN",
    module: "PEMINJAMAN",
    description: `User mengajukan peminjaman ${payload.jumlah} unit sarpras untuk tujuan: ${payload.tujuan}`,
    data_after: {
      peminjaman_id: peminjaman.id,
      sarpras_id: payload.sarpras_id,
      jumlah: payload.jumlah,
    },
  });

  return peminjaman;
};

export const getLoans = async (params?: {
  userId?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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

export const approveLoan = async (
  loanId: string,
  detail: LoanDetail,
  petugasId: string,
) => {
  // 1. Check current status
  const { data: loan, error: lError } = await supabase
    .from("peminjaman")
    .select("status")
    .eq("id", loanId)
    .single();

  if (lError) throw lError;
  if (loan.status !== "menunggu") {
    throw new Error(`Peminjaman ini sudah berstatus ${loan.status}`);
  }

  // 2. Check stock
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("stok_tersedia, nama")
    .eq("id", detail.sarpras.id)
    .single();

  if (sError) throw sError;
  if (sarpras.stok_tersedia < detail.jumlah) {
    throw new Error(
      `Stok ${sarpras.nama} tidak mencukupi untuk disetujui! Tersedia: ${sarpras.stok_tersedia}, Diminta: ${detail.jumlah}`,
    );
  }

  // 3. Update status
  const { error: updateError } = await supabase
    .from("peminjaman")
    .update({
      status: "disetujui",
      petugas_approval_id: petugasId,
      tanggal_approval: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (updateError) throw updateError;

  // 4. Update stock
  const { error: stockError } = await supabase.rpc("update_stock", {
    p_sarpras_id: detail.sarpras.id,
    p_jumlah: -detail.jumlah,
    p_jenis: "pinjam",
    p_referensi_id: loanId,
  });

  if (stockError) {
    // Fallback if RPC fails
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
    description: `Peminjaman dengan ID ${loanId} (${sarpras.nama}) telah disetujui oleh Petugas`,
    data_after: { loanId, status: "disetujui" },
  });
};

export const rejectLoan = async (
  loanId: string,
  alasan: string,
  petugasId: string,
) => {
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
    data_after: { loanId, status: "ditolak", alasan },
  });
};
