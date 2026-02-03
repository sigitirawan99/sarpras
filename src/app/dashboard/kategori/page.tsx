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
import { Kategori } from "@/lib/types";
import { getKategori, deleteKategori } from "@/lib/api/kategori";
import { toast } from "sonner";

import { AuthRoleGuard } from "@/components/auth-role-guard";

export default function KategoriPage() {
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getKategori();
      setData(result as Kategori[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      try {
        await deleteKategori(id);
        toast.success("Kategori berhasil dihapus");
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus kategori");
      }
    }
  };

  const filteredData = data.filter((item) =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AuthRoleGuard allowedRoles={["admin", "petugas"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kategori Sarpras</h1>
            <p className="text-muted-foreground">
              Kelola kategori untuk mengelompokkan sarana dan prasarana.
            </p>
          </div>
          <Link href="/dashboard/kategori/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
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
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Tidak ada data kategori.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.deskripsi || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/kategori/edit/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
