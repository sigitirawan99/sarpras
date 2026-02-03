import { supabase } from "../supabase/client";
import { recordActivityLog } from "./activity-log";
import { generateSarprasCode } from "../utils/sarpras-utils";

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

  // 4. Update Sarpras stock and condition (Split Logic)
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("*, kategori:kategori_id(nama)")
    .eq("id", payload.sarpras_id)
    .single();

  if (sError) throw sError;

  if (payload.kondisi !== sarpras.kondisi) {
    // Condition is different -> SPLIT
    if (sarpras.stok_total > payload.jumlah) {
      // 4a. Decrease original stock (Total and Available)
      // We use rpc update_stock first to return it to "Available" if it was borrowed
      await supabase.rpc("update_stock", {
        p_sarpras_id: payload.sarpras_id,
        p_jumlah: payload.jumlah,
        p_jenis: "kembali",
        p_referensi_id: returnRec.id,
      });

      // Now decrement both total and available from original because it's moving out
      const { error: updErr } = await supabase
        .from("sarpras")
        .update({
          stok_total: sarpras.stok_total - payload.jumlah,
          stok_tersedia: sarpras.stok_tersedia + payload.jumlah - payload.jumlah, // stays same as before rpc + return
        })
        .eq("id", payload.sarpras_id);
      
      if (updErr) throw updErr;

      // 4b. Find if there's already a record with the same name, category, location, and NEW condition
      const { data: existingTarget } = await supabase
        .from("sarpras")
        .select("id, stok_total, stok_tersedia")
        .eq("nama", sarpras.nama)
        .eq("kategori_id", sarpras.kategori_id)
        .eq("lokasi_id", sarpras.lokasi_id)
        .eq("kondisi", payload.kondisi)
        .eq("is_active", true)
        .maybeSingle();

      if (existingTarget) {
        // Merge into existing
        await supabase
          .from("sarpras")
          .update({
            stok_total: existingTarget.stok_total + payload.jumlah,
            stok_tersedia: existingTarget.stok_tersedia + payload.jumlah,
          })
          .eq("id", existingTarget.id);
      } else {
        // Create new record
        const newCode = generateSarprasCode(sarpras.nama, (sarpras.kategori as any)?.nama || "XYZ", payload.kondisi);
        await supabase.from("sarpras").insert({
          nama: sarpras.nama,
          kode: newCode,
          kategori_id: sarpras.kategori_id,
          lokasi_id: sarpras.lokasi_id,
          stok_total: payload.jumlah,
          stok_tersedia: payload.jumlah,
          kondisi: payload.kondisi,
          tanggal_perolehan: sarpras.tanggal_perolehan,
          foto: sarpras.foto,
        });
      }
    } else {
      // Entire stock changed condition (last item or all items)
      await supabase.rpc("update_stock", {
        p_sarpras_id: payload.sarpras_id,
        p_jumlah: payload.jumlah,
        p_jenis: "kembali",
        p_referensi_id: returnRec.id,
      });

      await supabase
        .from("sarpras")
        .update({ kondisi: payload.kondisi })
        .eq("id", payload.sarpras_id);
    }
  } else {
    // Condition is the same -> Regular return
    await supabase.rpc("update_stock", {
      p_sarpras_id: payload.sarpras_id,
      p_jumlah: payload.jumlah,
      p_jenis: "kembali",
      p_referensi_id: returnRec.id,
    });
  }

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
    description: `Petugas memproses pengembalian ${payload.jumlah} unit untuk ${payload.kode_peminjaman} dengan kondisi ${payload.kondisi}`,
    data_after: {
      peminjaman_id: payload.peminjaman_id,
      kondisi: payload.kondisi,
      jumlah: payload.jumlah
    }
  });

  return returnRec;
};
