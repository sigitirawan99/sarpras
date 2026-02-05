"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  MoreVertical,
  Package,
  X,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import {
  Peminjaman,
  PeminjamanStatus,
  Profile,
  PeminjamanDetail,
  Sarpras,
} from "@/lib/types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getLoans, approveLoan, rejectLoan } from "@/lib/api/peminjaman";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

const rejectionSchema = z.object({
  alasan: z.string().min(5, "Alasan penolakan minimal 5 karakter"),
});

type PeminjamanWithRelations = Peminjaman & {
  profile: Pick<Profile, "id" | "nama_lengkap" | "username">;
  peminjaman_detail: (PeminjamanDetail & {
    sarpras: Pick<Sarpras, "id" | "nama" | "kode" | "stok_tersedia">;
  })[];
};

import { AuthRoleGuard } from "@/components/auth-role-guard";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function PeminjamanPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [data, setData] = useState<PeminjamanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Dialog states
  const [selectedItem, setSelectedItem] =
    useState<PeminjamanWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const rejectForm = useForm({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { alasan: "" },
  });

  const fetchData = async (page = 1) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);

    setLoading(true);
    try {
      const { data: loans, count } = await getLoans({
        userId: currentUser.role === "pengguna" ? currentUser.id : undefined,
        page,
        pageSize,
      });
      setData((loans as unknown as PeminjamanWithRelations[]) || []);
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data peminjaman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleApprove = async (loan: PeminjamanWithRelations) => {
    if (!confirm("Setujui peminjaman ini? Stok akan berkurang otomatis."))
      return;

    setActionLoading(true);
    try {
      const detail = loan.peminjaman_detail[0];
      if (!detail) throw new Error("Detail peminjaman tidak ditemukan");

      await approveLoan(loan.id, detail, user?.id || "");

      toast.success("Peminjaman disetujui");
      fetchData(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyetujui peminjaman");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (values: { alasan: string }) => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      await rejectLoan(selectedItem.id, values.alasan, user?.id || "");

      toast.success("Peminjaman ditolak");
      setIsRejectOpen(false);
      setSelectedItem(null);
      rejectForm.reset();
      fetchData(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menolak peminjaman");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: PeminjamanStatus) => {
    switch (status) {
      case "menunggu":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Menunggu
          </Badge>
        );
      case "disetujui":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Disetujui
          </Badge>
        );
      case "dipinjam":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Dipinjam
          </Badge>
        );
      case "dikembalikan":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Kembali
          </Badge>
        );
      case "ditolak":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Ditolak
          </Badge>
        );
      case "dibatalkan":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Dibatalkan
          </Badge>
        );
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.kode_peminjaman?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.profile?.nama_lengkap
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuthRoleGuard>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">Data Peminjaman</h1>
          <p className="text-muted-foreground">
            {user?.role === "pengguna"
              ? "Lacak riwayat peminjaman Anda."
              : "Kelola semua permohonan peminjaman sarpras."}
          </p>
        </div>
        {user?.role === "pengguna" && (
          <Link href="/dashboard/sarpras-tersedia">
            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold gap-2">Pinjam Baru</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama peminjam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <SelectButton
            value="all"
            label="Semua"
            active={selectedStatus}
            onClick={setSelectedStatus}
          />
          <SelectButton
            value="menunggu"
            label="Menunggu"
            active={selectedStatus}
            onClick={setSelectedStatus}
          />
          <SelectButton
            value="disetujui"
            label="Disetujui"
            active={selectedStatus}
            onClick={setSelectedStatus}
          />
          <SelectButton
            value="dikembalikan"
            label="Selesai"
            active={selectedStatus}
            onClick={setSelectedStatus}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Kode / Tgl</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                  Tidak ada data peminjaman yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md w-fit mb-1">
                        {item.kode_peminjaman}
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        {format(new Date(item.tanggal_pinjam), "dd MMM yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-bold text-gray-900">
                        {item.profile?.nama_lengkap}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        @{item.profile?.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-bold text-gray-800">
                        {item.peminjaman_detail[0]?.sarpras?.nama}
                      </span>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full w-fit">
                        {item.peminjaman_detail[0]?.jumlah} Unit
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
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
                          <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                        </DropdownMenuItem>
                        {item.status === "menunggu" && (
                          <DropdownMenuItem className="rounded-lg font-bold text-xs">
                            <X className="mr-2 h-4 w-4" /> Batalkan
                          </DropdownMenuItem>
                        )}

                        {user?.role !== "pengguna" &&
                          item.status === "menunggu" && (
                            <>
                              <DropdownMenuItem
                                className="text-blue-600 rounded-lg font-bold text-xs"
                                onClick={() => handleApprove(item)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />{" "}
                                Setujui
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 rounded-lg font-bold text-xs"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsRejectOpen(true);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Tolak
                              </DropdownMenuItem>
                            </>
                          )}

                        {(item.status === "disetujui" ||
                          item.status === "dipinjam") && (
                          <DropdownMenuItem asChild className="rounded-lg font-bold text-xs text-nowrap">
                            <Link
                              href={`/dashboard/peminjaman/${item.id}/ticket`}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" /> Cetak
                              Tanda Bukti
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
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
               
               {[...Array(totalPages)].map((_, i) => {
                 const pageNum = i + 1;
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
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                 />
               </PaginationItem>
             </PaginationContent>
           </Pagination>
        </div>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-blue-900 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">Detail Peminjaman</DialogTitle>
              <DialogDescription className="text-blue-100 text-xs">
                Informasi lengkap pengajuan peminjaman sarpras.
              </DialogDescription>
            </DialogHeader>
          </div>
          {selectedItem && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Status</p>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Kode Pinjam</p>
                  <p className="font-mono font-bold text-sm bg-gray-50 px-2 py-1 rounded w-fit">
                    {selectedItem.kode_peminjaman}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Tgl Pinjam</p>
                  <p className="font-bold text-sm">
                    {format(
                      new Date(selectedItem.tanggal_pinjam),
                      "dd MMMM yyyy",
                      { locale: idLocale },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Estimasi Kembali</p>
                  <p className="font-bold text-sm">
                    {format(
                      new Date(selectedItem.tanggal_kembali_estimasi),
                      "dd MMMM yyyy",
                      { locale: idLocale },
                    )}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-4 border border-blue-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                   <Package className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
                    Item yang Dipinjam
                  </p>
                  <p className="font-black text-blue-900 text-base leading-tight">
                    {selectedItem.peminjaman_detail[0]?.sarpras?.nama}
                  </p>
                  <p className="text-xs font-bold text-blue-700 mt-1">
                    {selectedItem.peminjaman_detail[0]?.jumlah} Unit
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Tujuan Peminjaman
                </p>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 italic text-sm text-gray-700">
                  &quot;{selectedItem.tujuan || "-"}&quot;
                </div>
              </div>
              {selectedItem.alasan_penolakan && (
                <div className="border-l-4 border-red-500 pl-4 py-1 bg-red-50 rounded-r-xl">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
                    Alasan Penolakan
                  </p>
                  <p className="text-sm font-bold text-red-900">
                    {selectedItem.alasan_penolakan}
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                 <Button
                    variant="outline"
                    className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-gray-200"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Tutup
                  </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">Tolak Peminjaman</DialogTitle>
              <DialogDescription className="text-red-100">
                Berikan alasan yang jelas mengapa peminjaman ini ditolak.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <Form {...rejectForm}>
              <form
                onSubmit={rejectForm.handleSubmit((values) =>
                  handleReject(values as { alasan: string }),
                )}
                className="space-y-4"
              >
                <FormField
                  control={rejectForm.control}
                  name="alasan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Alasan Penolakan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contoh: Stok sedang maintenance, atau data kurang lengkap"
                          className="rounded-2xl border-gray-200 focus:ring-red-500 focus:border-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1 rounded-xl font-bold border-gray-200"
                    onClick={() => setIsRejectOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl font-bold"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Memproses..." : "Konfirmasi Tolak"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </AuthRoleGuard>
  );
}

function SelectButton({
  value,
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: string;
  onClick: (val: string) => void;
}) {
  const isActive = active === value;
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => onClick(value)}
      className={`rounded-full px-4 font-black uppercase text-[10px] tracking-widest h-8 transition-all duration-300 ${isActive ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 ring-2 ring-blue-100" : "border-gray-200 bg-white hover:bg-blue-50"}`}
    >
      {label}
    </Button>
  );
}
