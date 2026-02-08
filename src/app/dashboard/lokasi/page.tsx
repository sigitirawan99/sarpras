"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
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
import { Lokasi } from "@/lib/types";
import { getLokasi, deleteLokasi } from "@/lib/api/lokasi";
import { toast } from "sonner";

import { AuthRoleGuard } from "@/components/auth-role-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LokasiPage() {
  const [data, setData] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getLokasi();
      setData(result as Lokasi[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data lokasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteLokasi(id);
      toast.success("Lokasi berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus lokasi");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = data.filter((item) =>
    item.nama_lokasi.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AuthRoleGuard allowedRoles={["admin", "petugas"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">
              Lokasi Sarpras
            </h1>
            <p className="text-muted-foreground">
              Kelola data ruangan atau tempat penyimpanan sarana dan prasarana.
            </p>
          </div>
          <Link href="/dashboard/lokasi/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-24">No</TableHead>
                <TableHead>Nama Lokasi</TableHead>
                <TableHead>Lantai</TableHead>
                <TableHead>Keterangan</TableHead>
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
                    Tidak ada data lokasi.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{item.nama_lokasi}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.lantai || "-"}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-50">
                      {item.keterangan || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/lokasi/edit/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black text-gray-900">
                                Hapus User?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500 font-medium">
                                Apakah Anda yakin ingin menghapus kategori{" "}
                                <span className="font-bold text-red-600">
                                  {item.nama_lokasi}
                                </span>
                                ? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-xl font-bold border-gray-200">
                                Batal
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(item.id);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Menghapus..." : "Hapus Kategori"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AuthRoleGuard>
  );
}
