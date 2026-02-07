"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  History, 
  Search, 
  Eye, 
  Package, 
  User, 
  ClipboardCheck, 
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { getPengembalian } from "@/lib/api/pengembalian";
import { Pengembalian, PengembalianDetail, Profile } from "@/lib/types";
import { toast } from "sonner";
import { AuthRoleGuard } from "@/components/auth-role-guard";
import Image from "next/image";

type PengembalianWithRelations = Pengembalian & {
  pengembalian_detail: (PengembalianDetail & { sarpras: { nama: string } })[];
  petugas: { id: string; nama_lengkap: string };
  peminjaman: { kode_peminjaman: string; profile: { nama_lengkap: string } };
};

export default function RiwayatPengembalianPage() {
  const [data, setData] = useState<PengembalianWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [selectedItem, setSelectedItem] = useState<PengembalianWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Helper to force Jakarta time (UTC+7)
  const formatJakarta = (dateStr: string | null, pattern: string = "dd MMM yyyy") => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      const jakartaDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      return format(jakartaDate, pattern, { locale: idLocale });
    } catch (e) {
      return dateStr;
    }
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const { data: response, count } = await getPengembalian(page, pageSize);
      setData(response as unknown as PengembalianWithRelations[]);
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data riwayat pengembalian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const filteredData = data.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.peminjaman?.kode_peminjaman?.toLowerCase().includes(searchStr) ||
      item.peminjaman?.profile?.nama_lengkap?.toLowerCase().includes(searchStr) ||
      item.petugas?.nama_lengkap?.toLowerCase().includes(searchStr)
    );
  });

  const getConditionBadge = (kondisi: string) => {
    switch (kondisi) {
      case "baik":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Baik</Badge>;
      case "rusak_ringan":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Rusak Ringan</Badge>;
      case "rusak_berat":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Rusak Berat</Badge>;
      case "hilang":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Hilang</Badge>;
      default:
        return <Badge variant="outline">{kondisi}</Badge>;
    }
  };

  return (
    <AuthRoleGuard>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900 flex items-center gap-2">
              <History className="h-8 w-8 text-blue-600" />
              Riwayat Pengembalian
            </h1>
            <p className="text-muted-foreground mt-1">
              Daftar pengembalian sarana dan prasarana yang telah diproses.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kode peminjaman, nama peminjam, atau petugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white border-gray-200 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[180px]">Tanggal & Kode</TableHead>
                <TableHead>Peminjam</TableHead>
                <TableHead>Barang & Kondisi</TableHead>
                <TableHead>Petugas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    Tidak ada riwayat pengembalian ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => {
                  const totalItems = item.pengembalian_detail.reduce((acc, curr) => acc + curr.jumlah, 0);
                  const isMultiCondition = item.pengembalian_detail.length > 1;
                  
                  return (
                    <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatJakarta(item.tanggal_kembali_real)}
                          </span>
                          <span className="font-mono text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md w-fit">
                            {item.peminjaman?.kode_peminjaman}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-sm text-gray-900">
                            {item.peminjaman?.profile?.nama_lengkap || "Unknown User"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-sm text-gray-800">
                                {item.pengembalian_detail[0]?.sarpras?.nama}
                             </span>
                             <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100">
                                {totalItems} Unit
                             </Badge>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {isMultiCondition ? (
                              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 bg-blue-50">
                                Kondisi Beragam
                              </Badge>
                            ) : (
                              getConditionBadge(item.pengembalian_detail[0]?.kondisi)
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-600 italic">
                          {item.petugas?.nama_lengkap || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl">
                            <DropdownMenuItem
                              className="rounded-lg font-bold text-xs"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-600" /> Lihat Detail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        {!loading && Math.ceil(totalCount / pageSize) > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-muted-foreground font-medium">
              Menampilkan <span className="font-bold text-gray-900">{filteredData.length}</span> dari <span className="font-bold text-gray-900">{totalCount}</span> data
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(Math.ceil(totalCount / pageSize))].map((_, i) => {
                  const pageNum = i + 1;
                  const totalPages = Math.ceil(totalCount / pageSize);
                  if (totalPages > 5) {
                    if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                      if (Math.abs(pageNum - currentPage) === 2) return <PaginationEllipsis key={pageNum} />;
                      return null;
                    }
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < Math.ceil(totalCount / pageSize)) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === Math.ceil(totalCount / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* DETAIL DIALOG */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl overflow-hidden p-0">
            <div className="bg-blue-900 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
                  <ClipboardCheck className="h-6 w-6" />
                  Detail Pengembalian
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  Informasi lengkap pemrosesan pengembalian barang.
                </DialogDescription>
              </DialogHeader>
            </div>
            {selectedItem && (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-gray-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Kode Peminjaman</p>
                    <p className="font-mono font-bold text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                      {selectedItem.peminjaman?.kode_peminjaman}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Tanggal Kembali</p>
                    <p className="font-bold text-sm text-gray-900">
                      {formatJakarta(selectedItem.tanggal_kembali_real, "dd MMMM yyyy")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Peminjam</p>
                    <p className="font-bold text-sm text-gray-900">
                      {selectedItem.peminjaman?.profile?.nama_lengkap}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Ditangani Oleh</p>
                    <p className="font-bold text-sm text-gray-900">
                      {selectedItem.petugas?.nama_lengkap}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Daftar Barang & Kondisi</h3>
                  <div className="space-y-3">
                    {selectedItem.pengembalian_detail.map((detail, idx) => (
                      <div key={detail.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                        {detail.foto ? (
                          <div className="relative w-full md:w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                            <Image 
                              src={detail.foto} 
                              alt="Foto barang" 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full md:w-24 h-24 rounded-xl bg-gray-200 flex flex-col items-center justify-center text-gray-400">
                            <Package className="h-8 w-8 mb-1" />
                            <span className="text-[8px] font-bold uppercase">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-black text-blue-900">{detail.sarpras?.nama}</p>
                              <p className="text-xs font-bold text-blue-600">{detail.jumlah} Unit</p>
                            </div>
                            {getConditionBadge(detail.kondisi)}
                          </div>
                          {detail.deskripsi && (
                            <div className="bg-white p-2 rounded-lg border border-gray-200 text-xs italic text-gray-600">
                              &quot;{detail.deskripsi}&quot;
                            </div>
                          )}
                          {detail.damage_detected && (
                            <div className="flex items-center gap-1.5 text-red-600 animate-pulse">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-[10px] font-black uppercase tracking-tight">Kerusakan Terdeteksi</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedItem.catatan && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan Petugas</p>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 italic text-sm text-blue-800">
                      &quot;{selectedItem.catatan}&quot;
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t flex justify-end">
                   <Button
                      variant="outline"
                      className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Tutup
                    </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthRoleGuard>
  );
}
