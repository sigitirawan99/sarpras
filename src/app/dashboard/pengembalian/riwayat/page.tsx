"use client";

import { useEffect, useState } from "react";
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  User, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search as SearchIcon,
  Filter,
  Eye,
  Camera
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import { toast } from "sonner";
import { Pengembalian, Profile, Peminjaman, PengembalianDetail, Sarpras } from "@/lib/types";

type PengembalianWithRelations = Pengembalian & {
  petugas: Pick<Profile, 'id' | 'nama_lengkap'>;
  peminjaman: Pick<Peminjaman, 'id' | 'kode_peminjaman' | 'tanggal_pinjam'> & {
    profile: Pick<Profile, 'id' | 'nama_lengkap'>;
  };
  pengembalian_detail: (PengembalianDetail & {
    sarpras: Pick<Sarpras, 'id' | 'nama' | 'kode'>;
  })[];
};

export default function RiwayatPengembalianPage() {
  const [data, setData] = useState<PengembalianWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<PengembalianWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = async () => {
    const user = getCurrentUser();
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("pengembalian")
        .select(`
          *,
          petugas:petugas_id (id, nama_lengkap),
          peminjaman:peminjaman_id (
            id, 
            kode_peminjaman, 
            tanggal_pinjam,
            profile:user_id (id, nama_lengkap)
          ),
          pengembalian_detail (
            id,
            jumlah,
            kondisi,
            deskripsi,
            foto,
            sarpras:sarpras_id (id, nama, kode)
          )
        `)
        .order("created_at", { ascending: false });

      // If normal user, filter by their loans
      if (user.role === "pengguna") {
         // Join condition in Supabase JS is tricky for deep nesting, 
         // but we can query peminjaman first if needed. 
         // For now assume staff view as per requirement "Melihat Riwayat Pengembalian & Kondisi Alat ✓ ✓ -"
      }

      const { data: returns, error } = await query;
      if (error) throw error;
      setData((returns as unknown as PengembalianWithRelations[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getConditionBadge = (kondisi: string) => {
    switch (kondisi) {
      case "baik": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Baik</Badge>;
      case "rusak_ringan": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Rusak Ringan</Badge>;
      case "rusak_berat": return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Rusak Berat</Badge>;
      case "hilang": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Hilang</Badge>;
      default: return <Badge variant="outline">{kondisi}</Badge>;
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.peminjaman?.kode_peminjaman?.toLowerCase().includes(searchLower) ||
      item.peminjaman?.profile?.nama_lengkap?.toLowerCase().includes(searchLower) ||
      item.pengembalian_detail[0]?.sarpras?.nama?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Pengembalian</h1>
        <p className="text-muted-foreground">
          Daftar pengembalian sarpras beserta inspeksi kondisinya.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan kode, nama peminjam, atau nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
           <RotateCcw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Tgl Kembali</TableHead>
              <TableHead>Peminjaman</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Tidak ada data.</TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm font-medium">
                    {format(new Date(item.tanggal_kembali_real), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold">{item.peminjaman?.kode_peminjaman}</span>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col text-sm">
                        <span className="font-medium">{item.pengembalian_detail[0]?.sarpras?.nama}</span>
                        <span className="text-xs text-muted-foreground">{item.pengembalian_detail[0]?.jumlah} Unit</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.peminjaman?.profile?.nama_lengkap}
                  </TableCell>
                  <TableCell>
                    {getConditionBadge(item.pengembalian_detail[0]?.kondisi)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
         <DialogContent className="max-w-2xl">
            <DialogHeader>
               <DialogTitle>Detail Pengembalian & Inspeksi</DialogTitle>
               <DialogDescription>Informasi lengkap kondisi asset saat dikembalikan.</DialogDescription>
            </DialogHeader>
            {selectedItem && (
               <div className="grid md:grid-cols-2 gap-8 py-4">
                  <div className="space-y-6">
                     <section className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b pb-1">Data Transaksi</p>
                        <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Kode PJM</span>
                              <span className="font-bold font-mono">{selectedItem.peminjaman?.kode_peminjaman}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tgl Kembali</span>
                              <span className="font-bold">{format(new Date(selectedItem.tanggal_kembali_real), 'dd MMMM yyyy HH:mm', { locale: idLocale })}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Inspektor</span>
                              <span className="font-bold">{selectedItem.petugas?.nama_lengkap}</span>
                           </div>
                        </div>
                     </section>

                     <section className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b pb-1">Kondisi Asset</p>
                        <div className="p-4 rounded-2xl border-2 border-dashed bg-gray-50 space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">{selectedItem.pengembalian_detail[0]?.sarpras?.nama}</span>
                              {getConditionBadge(selectedItem.pengembalian_detail[0]?.kondisi)}
                           </div>
                           <div className="text-sm italic text-muted-foreground bg-white p-2 rounded border">
                              "{selectedItem.catatan || "Tidak ada catatan tambahan."}"
                           </div>
                        </div>
                     </section>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b pb-1">Foto Bukti</p>
                     <div className="aspect-square bg-gray-100 rounded-2xl border overflow-hidden flex items-center justify-center relative">
                        {selectedItem.pengembalian_detail[0]?.foto ? (
                           <img 
                            src={selectedItem.pengembalian_detail[0]?.foto} 
                            alt="Bukti Pengembalian" 
                            className="w-full h-full object-cover" 
                           />
                        ) : (
                           <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Camera className="h-12 w-12 opacity-20" />
                              <span className="text-xs uppercase font-bold tracking-tighter opacity-40">Tidak ada foto</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
            <DialogFooter className="bg-gray-50 -mx-6 -mb-6 p-4 border-t">
               <Button variant="default" className="w-full bg-blue-600" onClick={() => setIsDetailOpen(false)}>Tutup Riwayat</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
