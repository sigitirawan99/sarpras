import { supabase } from "../supabase/client";
import { recordActivityLog } from "./activity-log";
import { generateSarprasCode } from "../utils/sarpras-utils";

export type ReturnItem = {
  kondisi: string;
  jumlah: number;
  catatan: string;
  foto: string | null;
};

export type ReturnPayload = {
  peminjaman_id: string;
  petugas_id: string;
  user_id: string;
  kode_peminjaman: string;
  sarpras_id: string;
  items: ReturnItem[];
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
      catatan: `Multi-condition return for ${payload.kode_peminjaman}`,
      tanggal_kembali_real: new Date().toISOString(),
    })
    .select()
    .single();

  if (rError) throw rError;

  // 2. Fetch original Sarpras details once
  const { data: sarpras, error: sError } = await supabase
    .from("sarpras")
    .select("*, kategori:kategori_id(nama)")
    .eq("id", payload.sarpras_id)
    .single();

  if (sError) throw sError;

  // 3. Process each item in the breakdown
  for (const item of payload.items) {
    // 3a. Create Pengembalian Detail
    const { error: rdError } = await supabase.from("pengembalian_detail").insert({
      pengembalian_id: returnRec.id,
      sarpras_id: payload.sarpras_id,
      jumlah: item.jumlah,
      kondisi: item.kondisi,
      deskripsi: item.catatan,
      foto: item.foto,
      damage_detected: item.kondisi !== "baik",
    });

    if (rdError) throw rdError;

    // 3b. Update Sarpras stock and condition (Split Logic)
    if (item.kondisi !== sarpras.kondisi) {
      // Condition is different -> SPLIT or MOVE
      // i. Use rpc update_stock to return it to "Available" pool first (logical return from loan)
      await supabase.rpc("update_stock", {
        p_sarpras_id: payload.sarpras_id,
        p_jumlah: item.jumlah,
        p_jenis: "kembali",
        p_referensi_id: returnRec.id,
      });

      // ii. Check if we need to split (if original stock is more than what is being returned in this condition)
      // Actually, since we do this in a loop, it's safer to always check if there's original stock left.
      const { data: currentOrig } = await supabase
        .from("sarpras")
        .select("stok_total, stok_tersedia")
        .eq("id", payload.sarpras_id)
        .single();
      
      if (currentOrig && currentOrig.stok_total > item.jumlah) {
        // Just move this portion out of original
        await supabase
          .from("sarpras")
          .update({
            stok_total: currentOrig.stok_total - item.jumlah,
            stok_tersedia: currentOrig.stok_tersedia - item.jumlah, // subtract because it was added by rpc above
          })
          .eq("id", payload.sarpras_id);

        // Find or create target record for this condition
        const { data: existingTarget } = await supabase
          .from("sarpras")
          .select("id, stok_total, stok_tersedia")
          .eq("nama", sarpras.nama)
          .eq("kategori_id", sarpras.kategori_id)
          .eq("lokasi_id", sarpras.lokasi_id)
          .eq("kondisi", item.kondisi)
          .eq("is_active", true)
          .maybeSingle();

        if (existingTarget) {
          await supabase
            .from("sarpras")
            .update({
              stok_total: existingTarget.stok_total + item.jumlah,
              stok_tersedia: existingTarget.stok_tersedia + item.jumlah,
            })
            .eq("id", existingTarget.id);
        } else {
          const newCode = generateSarprasCode(
            sarpras.nama,
            (sarpras.kategori as any)?.nama || "XYZ",
            item.kondisi as any,
          );
          await supabase.from("sarpras").insert({
            nama: sarpras.nama,
            kode: newCode,
            kategori_id: sarpras.kategori_id,
            lokasi_id: sarpras.lokasi_id,
            stok_total: item.jumlah,
            stok_tersedia: item.jumlah,
            kondisi: item.kondisi,
            tanggal_perolehan: sarpras.tanggal_perolehan,
            foto: sarpras.foto,
          });
        }
      } else {
        // Entire remaining original stock changes condition
        await supabase
          .from("sarpras")
          .update({ kondisi: item.kondisi })
          .eq("id", payload.sarpras_id);
      }
    } else {
      // Condition is the same -> Regular return
      await supabase.rpc("update_stock", {
        p_sarpras_id: payload.sarpras_id,
        p_jumlah: item.jumlah,
        p_jenis: "kembali",
        p_referensi_id: returnRec.id,
      });
    }

    // 3c. Automatic complaint if lost
    if (item.kondisi === "hilang") {
      await supabase.rpc("create_pengaduan_from_lost_item", {
        p_sarpras_id: payload.sarpras_id,
        p_user_id: payload.user_id,
        p_peminjaman_id: payload.peminjaman_id,
      });
    }

    // 3d. Record to Riwayat Kondisi Alat
    await supabase.from("riwayat_kondisi_alat").insert({
      sarpras_id: payload.sarpras_id,
      kondisi: item.kondisi,
      deskripsi: item.catatan,
      sumber: `Pengembalian ${payload.kode_peminjaman}`,
      foto: item.foto,
      created_by: payload.petugas_id,
    });
  }

  // 4. Update Peminjaman status (Final)
  const { error: lpError } = await supabase
    .from("peminjaman")
    .update({
      status: "dikembalikan",
      tanggal_kembali_real: new Date().toISOString(),
    })
    .eq("id", payload.peminjaman_id);

  if (lpError) throw lpError;

  // 5. Record Activity Log
  const totalQty = payload.items.reduce((acc, curr) => acc + curr.jumlah, 0);
  await recordActivityLog({
    user_id: payload.petugas_id,
    action: "PROCESS_RETURN",
    module: "PEMINJAMAN",
    description: `Petugas memproses pengembalian ${totalQty} unit untuk ${payload.kode_peminjaman} dengan breakdown beragam kondisi`,
    data_after: {
      peminjaman_id: payload.peminjaman_id,
      breakdown: payload.items,
    },
  });

  return returnRec;
};
