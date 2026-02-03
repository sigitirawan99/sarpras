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

export default function PeminjamanPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [data, setData] = useState<PeminjamanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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

  const fetchData = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);

    setLoading(true);
    try {
      const loans = await getLoans({
        userId: currentUser.role === "pengguna" ? currentUser.id : undefined,
      });
      setData((loans as unknown as PeminjamanWithRelations[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data peminjaman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (loan: PeminjamanWithRelations) => {
    if (!confirm("Setujui peminjaman ini? Stok akan berkurang otomatis."))
      return;

    setActionLoading(true);
    try {
      const detail = loan.peminjaman_detail[0];
      if (!detail) throw new Error("Detail peminjaman tidak ditemukan");

      await approveLoan(loan.id, detail, user?.id || "");

      toast.success("Peminjaman disetujui");
      fetchData();
    } catch (error) {
      console.error(error);
      console.log(error);
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
      fetchData();
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
            Ditolak
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

  return (
    <AuthRoleGuard>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Peminjaman</h1>
          <p className="text-muted-foreground">
            {user?.role === "pengguna"
              ? "Lacak riwayat peminjaman Anda."
              : "Kelola semua permohonan peminjaman sarpras."}
          </p>
        </div>
        {user?.role === "pengguna" && (
          <Button asChild className="bg-blue-600">
            <Link href="/dashboard/sarpras-tersedia">Pinjam Baru</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama peminjam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
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

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
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
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold">
                        {item.kode_peminjaman}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.tanggal_pinjam), "dd MMM yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {item.profile?.nama_lengkap}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{item.profile?.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {item.peminjaman_detail[0]?.sarpras?.nama}
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {item.peminjaman_detail[0]?.jumlah} Unit
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                        </DropdownMenuItem>
                        {item.status === "menunggu" && (
                          <DropdownMenuItem>
                            <X className="mr-2 h-4 w-4" /> Batalkan
                          </DropdownMenuItem>
                        )}

                        {user?.role !== "pengguna" &&
                          item.status === "menunggu" && (
                            <>
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => handleApprove(item)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />{" "}
                                Setujui
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
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
                          <DropdownMenuItem asChild>
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

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Peminjaman</DialogTitle>
            <DialogDescription>
              Informasi lengkap pengajuan peminjaman.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-b pb-4">
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Kode Pinjam</p>
                  <p className="font-mono font-bold">
                    {selectedItem.kode_peminjaman}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tanggal Pinjam</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedItem.tanggal_pinjam),
                      "dd MMMM yyyy",
                      { locale: idLocale },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Estimasi Kembali</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedItem.tanggal_kembali_estimasi),
                      "dd MMMM yyyy",
                      { locale: idLocale },
                    )}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                    Item yang Dipinjam
                  </p>
                  <p className="font-bold text-blue-900">
                    {selectedItem.peminjaman_detail[0]?.sarpras?.nama}
                  </p>
                  <p className="text-sm font-medium text-blue-700">
                    {selectedItem.peminjaman_detail[0]?.jumlah} Unit
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Tujuan Peminjaman
                </p>
                <p className="text-sm border p-2 rounded bg-gray-50">
                  {selectedItem.tujuan || "-"}
                </p>
              </div>
              {selectedItem.alasan_penolakan && (
                <div className="border-l-4 border-red-500 pl-3 py-1">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                    Alasan Penolakan
                  </p>
                  <p className="text-sm italic">
                    {selectedItem.alasan_penolakan}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Tolak Peminjaman</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa peminjaman ini ditolak.
            </DialogDescription>
          </DialogHeader>
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
                    <FormLabel>Alasan Penolakan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Stok sedang maintenance, atau data kurang lengkap"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Memproses..." : "Konfirmasi Tolak"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
      className={`rounded-full px-4 ${isActive ? "bg-blue-600 hover:bg-blue-700" : ""}`}
    >
      {label}
    </Button>
  );
}
