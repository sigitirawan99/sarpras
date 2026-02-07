"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { Sarpras } from "@/lib/types";
import { getSarprasList, deleteSarpras } from "@/lib/api/sarpras";
import { toast } from "sonner";

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

export default function SarprasPage() {
  const [data, setData] = useState<Sarpras[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const { data: sarprasRes, count } = await getSarprasList(page, pageSize);
      setData(sarprasRes);
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteSarpras(id);
      toast.success("Data Sarpras berhasil dihapus");
      fetchData(currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuthRoleGuard allowedRoles={["admin", "petugas"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">
              Data Sarpras
            </h1>
            <p className="text-muted-foreground">
              Kelola data sarana dan prasarana sekolah secara detail.
            </p>
          </div>
          <Link href="/dashboard/sarpras/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah Sarpras
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 text-nowrap">
                <TableHead>No</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Alat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-center">Stok (T/A)</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
                      Loading data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground font-medium"
                  >
                    Tidak ada data sarpras.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="text-nowrap group hover:bg-blue-50/30 transition-colors"
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-600 bg-blue-50/50 py-1 px-2 rounded-lg inline-block my-4">
                      {item.kode}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {item.nama}
                    </TableCell>
                    <TableCell>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase text-gray-500">
                        {item.kategori?.nama || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">
                      {item.lokasi?.nama_lokasi || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-blue-700">
                        {item.stok_tersedia}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold">
                        {" "}
                        / {item.stok_total}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.kondisi === "baik"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : item.kondisi === "rusak_ringan"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : item.kondisi === "rusak_berat"
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.kondisi.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 pr-2">
                        <Link href={`/dashboard/sarpras/edit/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-gray-200 hover:bg-blue-50 hover:text-blue-600"
                          >
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
                                  {item.nama}
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
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </div>
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
              Menampilkan{" "}
              <span className="font-bold text-gray-900">
                {filteredData.length}
              </span>{" "}
              dari <span className="font-bold text-gray-900">{totalCount}</span>{" "}
              data
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
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Logic for showing pages (simple version)
                  if (totalPages > 5) {
                    if (
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (Math.abs(pageNum - currentPage) === 2)
                        return <PaginationEllipsis key={pageNum} />;
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
                      if (currentPage < totalPages)
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AuthRoleGuard>
  );
}
