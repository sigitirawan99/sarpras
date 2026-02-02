"use client";

import { useState, useEffect } from "react";
import {
  ScanLine,
  Search,
  Package,
  User,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Camera,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getPeminjamanByCode, processReturn } from "@/lib/api/pengembalian";
import { uploadFile } from "@/lib/api/storage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Peminjaman, Profile, PeminjamanDetail, Sarpras } from "@/lib/types";

type PeminjamanWithRelations = Peminjaman & {
  profile: Pick<Profile, "id" | "nama_lengkap" | "username">;
  peminjaman_detail: (PeminjamanDetail & {
    sarpras: Pick<
      Sarpras,
      "id" | "nama" | "kode" | "kondisi" | "stok_tersedia"
    >;
  })[];
};

export default function PengembalianPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [loanData, setLoanData] = useState<PeminjamanWithRelations | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Return form state
  const [kondisi, setKondisi] = useState<string>("baik");
  const [catatan, setCatatan] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleSearch = async () => {
    if (!searchCode) return;
    setLoading(true);
    setLoanData(null);
    try {
      const data = await getPeminjamanByCode(searchCode);
      setLoanData(data as unknown as PeminjamanWithRelations);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mencari data peminjaman");
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `returns/${fileName}`;

      const publicUrl = await uploadFile("media", filePath, file);

      setFoto(publicUrl);
      toast.success("Foto berhasil diunggah");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!loanData || !user) return;

    setSubmitting(true);
    try {
      const detail = loanData.peminjaman_detail[0];

      await processReturn({
        peminjaman_id: loanData.id,
        petugas_id: user.id,
        catatan: catatan,
        kondisi: kondisi,
        foto: foto,
        sarpras_id: detail.sarpras.id,
        jumlah: detail.jumlah,
        user_id: loanData.user_id,
        kode_peminjaman: loanData.kode_peminjaman,
      });

      toast.success("Pengembalian berhasil dicatat!");
      router.push("/dashboard/pengembalian/riwayat");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mencatat pengembalian");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Pencatatan Pengembalian
        </h1>
        <p className="text-muted-foreground">
          Scan QR Code pada tanda bukti atau masukkan kode peminjaman secara
          manual.
        </p>
      </div>

      <Card className="border-none shadow-xl bg-blue-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ScanLine className="w-48 h-48" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label
                htmlFor="search-code"
                className="text-blue-100 font-bold uppercase tracking-wider text-[10px]"
              >
                Masukkan Kode Peminjaman
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="search-code"
                  placeholder="PJM-XXXXXXXX-XXXX"
                  className="bg-white text-gray-900 h-14 pl-12 rounded-xl border-none text-lg font-mono font-bold transition-all focus:ring-4 focus:ring-blue-300"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !searchCode}
              className="h-14 px-8 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ScanLine className="h-5 w-5" />
              )}
              Cek Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {loanData && (
        <div className="grid md:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Summary Side */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden border-t-4 border-blue-500">
              <CardHeader className="bg-gray-50/50">
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-black">
                  Informasi Peminjaman
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Peminjam
                    </p>
                    <p className="font-black text-gray-900">
                      {loanData.profile?.nama_lengkap}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Item & Jumlah
                    </p>
                    <p className="font-black text-gray-900">
                      {loanData.peminjaman_detail[0]?.sarpras?.nama}
                    </p>
                    <p className="text-xs font-bold text-orange-600">
                      {loanData.peminjaman_detail[0]?.jumlah} Unit
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Tgl Pinjam
                    </p>
                    <p className="text-xs font-bold">
                      {format(new Date(loanData.tanggal_pinjam), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Target Kembali
                    </p>
                    <p className="text-xs font-bold text-red-600">
                      {format(
                        new Date(loanData.tanggal_kembali_estimasi),
                        "dd MMM yyyy",
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 flex gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
              <div className="text-sm">
                <p className="font-black text-yellow-800 uppercase tracking-wider mb-1">
                  Instruksi Petugas
                </p>
                <p className="text-yellow-700 leading-relaxed font-medium">
                  Lakukan inspeksi fisik secara mendetail pada barang. Pastikan
                  jumlah sesuai dan tidak ada kerusakan yang tidak dilaporkan.
                </p>
              </div>
            </div>
          </div>

          {/* Inspection Form */}
          <div className="md:col-span-3">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-blue-900 text-white p-6">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" /> Form Inspeksi &
                  Pengembalian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-wider text-gray-500">
                    Status Kondisi Saat Ini
                  </Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <ConditionOption
                      id="baik"
                      label="BAIK"
                      icon={<ShieldCheck className="h-4 w-4" />}
                      active={kondisi === "baik"}
                      onClick={() => setKondisi("baik")}
                      color="green"
                    />
                    <ConditionOption
                      id="rusak_ringan"
                      label="CACAT"
                      icon={<AlertTriangle className="h-4 w-4" />}
                      active={kondisi === "rusak_ringan"}
                      onClick={() => setKondisi("rusak_ringan")}
                      color="yellow"
                    />
                    <ConditionOption
                      id="rusak_berat"
                      label="RUSAK"
                      icon={<XCircleIcon />}
                      active={kondisi === "rusak_berat"}
                      onClick={() => setKondisi("rusak_berat")}
                      color="orange"
                    />
                    <ConditionOption
                      id="hilang"
                      label="HILANG"
                      icon={<Search className="h-4 w-4" />}
                      active={kondisi === "hilang"}
                      onClick={() => setKondisi("hilang")}
                      color="red"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-wider text-gray-500">
                    Catatan / Deskripsi Kerusakan
                  </Label>
                  <Textarea
                    placeholder="Tuliskan detail kondisi barang, misalnya: 'Body tergores', 'Kelengkapan kabel kurang', dsb."
                    className="min-h-30 rounded-2xl bg-gray-50 interface focus:bg-white transition-all"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-wider text-gray-500">
                    Foto Pengembalian (Opsional)
                  </Label>
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all ${foto ? "border-blue-500" : "border-gray-200"}`}
                    >
                      {foto ? (
                        <img
                          src={foto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-gray-300" />
                          <span className="text-[10px] font-bold text-gray-300 uppercase mt-2">
                            Preview
                          </span>
                        </>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Unggah foto sebagai bukti kondisi saat barang
                        dikembalikan.
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFotoUpload(e)}
                        disabled={uploading}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-6 flex justify-end">
                <Button
                  onClick={handleSubmitReturn}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-blue-200"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-6 w-6" />
                  )}
                  PROSES PENGEMBALIAN
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ConditionOption({
  label,
  icon,
  active,
  onClick,
  color,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: "green" | "yellow" | "orange" | "red";
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    yellow:
      "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    orange:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    red: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  };

  const activeColors: Record<string, string> = {
    green: "bg-green-600 text-white border-green-700 ring-4 ring-green-100",
    yellow: "bg-yellow-500 text-white border-yellow-600 ring-4 ring-yellow-100",
    orange: "bg-orange-600 text-white border-orange-700 ring-4 ring-orange-100",
    red: "bg-red-600 text-white border-red-700 ring-4 ring-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all font-black text-[10px] gap-2 tracking-widest ${active ? activeColors[color] : colors[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function XCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
