"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  User,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface TicketData {
  id: string;
  kode_peminjaman: string;
  tanggal_pinjam: string;
  tanggal_kembali_estimasi: string;
  profile?: {
    id: string;
    nama_lengkap: string | null;
    username: string;
    no_telepon: string | null;
  };
  peminjaman_detail: {
    id: string;
    jumlah: number;
    sarpras: {
      id: string;
      nama: string;
      kode: string;
      lokasi:
        | {
            id: string;
            nama_lokasi: string;
          }
        | {
            id: string;
            nama_lokasi: string;
          }[]
        | null;
    } | null;
  }[];
}

export default function LoanTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: loan, error } = await supabase
          .from("peminjaman")
          .select(
            `
            *,
            profile:user_id (id, nama_lengkap, username, no_telepon),
            peminjaman_detail (
              id,
              jumlah,
              sarpras:sarpras_id (id, nama, kode, lokasi:lokasi_id (id, nama_lokasi))
            )
          `,
          )
          .eq("id", resolvedParams.id)
          .single();

        if (error) throw error;
        setData(loan);

        // Generate QR Code from the loan ID or Loan Code
        const qr = await QRCode.toDataURL(loan.kode_peminjaman);
        setQrCode(qr);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data tiket");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Data Peminjaman Tidak Ditemukan</h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const detail = data.peminjaman_detail?.[0];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 gap-2">
          <Printer className="h-4 w-4" /> Cetak Tiket
        </Button>
      </div>

      <div
        id="printable-ticket"
        className="bg-white border-2 border-dashed border-gray-300 rounded-2xl shadow-xl p-8 sm:p-12 relative overflow-hidden"
      >
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Package className="w-64 h-64 -translate-y-12 translate-x-12" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter">
                Tanda Bukti Peminjaman
              </h1>
            </div>
            <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest flex items-center gap-2">
              Sistem Informasi Sarpras Sekolah
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
              Nomor Peminjaman
            </p>
            <p className="font-mono text-xl font-black text-gray-900 border-b-2 border-blue-100 pb-1">
              {data.kode_peminjaman}
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-3 flex items-center gap-2">
                <User className="h-3 w-3" /> Informasi Peminjam
              </h3>
              <div className="pl-5 border-l-2 border-blue-50">
                <p className="font-black text-gray-900 text-lg">
                  {data.profile?.nama_lengkap}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  @{data.profile?.username} / {data.profile?.no_telepon || "-"}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-3 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Periode Peminjaman
              </h3>
              <div className="pl-5 border-l-2 border-blue-50 space-y-1">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg pr-4">
                  <span className="text-xs text-muted-foreground">Mulai</span>
                  <span className="font-bold text-sm">
                    {format(new Date(data.tanggal_pinjam), "dd MMMM yyyy", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg pr-4">
                  <span className="text-xs text-muted-foreground">
                    Estimasi Kembali
                  </span>
                  <span className="font-bold text-sm text-red-600">
                    {format(
                      new Date(data.tanggal_kembali_estimasi),
                      "dd MMMM yyyy",
                      { locale: idLocale },
                    )}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-3 flex items-center gap-2">
                <Package className="h-3 w-3" /> Detail Barang
              </h3>
              <div className="bg-blue-900 text-white rounded-2xl p-5 shadow-inner">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                    Item Name
                  </p>
                  <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                    Qty
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <p className="font-black text-lg flex-1 truncate">
                    {detail?.sarpras?.nama}
                  </p>
                  <p className="text-2xl font-black ml-4">{detail?.jumlah}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-800 flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-200">
                    Lokasi:{" "}
                    {(() => {
                      const lokasi = detail?.sarpras?.lokasi;
                      if (!lokasi) return "-";
                      return Array.isArray(lokasi)
                        ? lokasi[0]?.nama_lokasi
                        : lokasi.nama_lokasi;
                    })()}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex justify-center sm:justify-end">
              <div className="text-center">
                <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 mb-2">
                  {qrCode ? null : (
                    <div className="w-24 h-24 bg-gray-50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                  Scan to verify
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-8">
          <div className="space-y-12">
            <div className="text-center h-24 flex flex-col justify-end">
              <p className="text-xs font-bold text-gray-400 mb-1 border-t-2 border-gray-100 pt-2 mx-8">
                Petugas / Admin
              </p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="text-center h-24 flex flex-col justify-end">
              <p className="text-xs font-bold text-gray-400 mb-1 border-t-2 border-gray-100 pt-2 mx-8">
                Peminjam
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center no-print">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 px-6 py-1 gap-2 rounded-full"
          >
            <CheckCircle2 className="h-3 w-3" /> Tiket Valid & Terverifikasi
          </Badge>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          #printable-ticket {
            box-shadow: none !important;
            border: 2px solid #e5e7eb !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
