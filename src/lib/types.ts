export type Role = "admin" | "petugas" | "pengguna";

export type Profile = {
  id: string;
  role: Role;
  username: string;
  email: string | null;
  nama_lengkap: string | null;
  no_telepon: string | null;
  foto_profil: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Kategori = {
  id: string;
  nama: string;
  deskripsi: string | null;
  created_at: string;
};

export type Lokasi = {
  id: string;
  nama_lokasi: string;
  lantai: string | null;
  keterangan: string | null;
  created_at: string;
};

export type Sarpras = {
  id: string;
  kode: string;
  nama: string;
  kategori_id: string;
  lokasi_id: string;
  stok_total: number;
  stok_tersedia: number;
  kondisi: "baik" | "rusak_ringan" | "rusak_berat" | "hilang";
  tanggal_perolehan: string | null;
  foto: string | null;
  is_active: boolean;
  kategori?: {
    id: string;
    nama: string;
  };
  lokasi?: {
    id: string;
    nama_lokasi: string;
  };
  created_at: string;
};

export type PeminjamanStatus =
  | "menunggu"
  | "disetujui"
  | "dipinjam"
  | "dikembalikan"
  | "ditolak";

export type Peminjaman = {
  id: string;
  kode_peminjaman: string;
  user_id: string;
  petugas_id: string | null;
  petugas_approval_id: string | null;
  tanggal_pinjam: string;
  tanggal_kembali_estimasi: string;
  tanggal_kembali_real: string | null;
  tanggal_approval: string | null;
  tujuan: string | null;
  status: PeminjamanStatus;
  catatan_admin: string | null;
  alasan_penolakan: string | null;
  created_at: string;
  profile?: Profile;
};

export type PeminjamanDetail = {
  id: string;
  peminjaman_id: string;
  sarpras_id: string;
  jumlah: number;
  kondisi_pinjam: string | null;
  kondisi_kembali: string | null;
  catatan: string | null;
  sarpras?: Sarpras;
};

export type ConditionStatus =
  | "baik"
  | "rusak_ringan"
  | "rusak_berat"
  | "hilang";

export type Pengembalian = {
  id: string;
  peminjaman_id: string;
  tanggal_kembali_real: string;
  petugas_id: string | null;
  catatan: string | null;
  created_at: string;
};

export type PengembalianDetail = {
  id: string;
  pengembalian_id: string;
  sarpras_id: string;
  jumlah: number;
  kondisi: ConditionStatus;
  deskripsi: string | null;
  foto: string | null;
  damage_detected: boolean;
  kategori_kerusakan: string | null;
};

export type PengaduanPrioritas = "rendah" | "normal" | "tinggi" | "urgent";
export type PengaduanStatus = "menunggu" | "diproses" | "selesai" | "ditolak";

export type Pengaduan = {
  id: string;
  user_id: string;
  judul: string;
  deskripsi: string;
  lokasi: string | null;
  sarpras_id: string | null;
  foto: string | null;
  kategori_kerusakan: string | null;
  prioritas: PengaduanPrioritas;
  status: PengaduanStatus;
  created_at: string;
  profile?: Profile;
  sarpras?: Sarpras;
};

export type ActivityLog = {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  data_before: Record<string, unknown> | null;
  data_after: Record<string, unknown> | null;
  created_at: string;
  profile?: Profile;
};

export type PengaduanProgress = {
  id: string;
  pengaduan_id: string;
  petugas_id: string | null;
  catatan: string;
  status: PengaduanStatus;
  created_at: string;
};

export type RiwayatKondisiAlat = {
  id: string;
  sarpras_id: string;
  kondisi: ConditionStatus;
  deskripsi: string | null;
  sumber: string | null;
  foto: string | null;
  created_by: string | null;
  created_at: string;
};
