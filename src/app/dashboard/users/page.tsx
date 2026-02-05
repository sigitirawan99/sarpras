"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Search, User, ShieldCheck, ShieldAlert, UserCheck } from "lucide-react";
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
import { Profile, Role } from "@/lib/types";
import { getProfiles } from "@/lib/api/profiles";
import { toast } from "sonner";
import Link from "next/link";
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

export default function UsersPage() {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const { data: profiles, count } = await getProfiles(page, pageSize);
      setData(profiles);
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const filteredData = data.filter((item) =>
    item.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "admin": return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "petugas": return <ShieldAlert className="h-4 w-4 text-blue-500" />;
      default: return <UserCheck className="h-4 w-4 text-green-500" />;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuthRoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">Manajemen User</h1>
            <p className="text-muted-foreground">
              Kelola akun pengguna, petugas, dan administrator sistem.
            </p>
          </div>
          <Link href="/dashboard/users/tambah">
            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold gap-2">
              <Plus className="h-4 w-4" /> Tambah User
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari user berdasarkan nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    Loading data user...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    Tidak ada data user yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3 py-1">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <User className="h-5 w-5 text-blue-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900 leading-tight">{user.nama_lengkap}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">@{user.username}</span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5">
                          {getRoleIcon(user.role)}
                          <span className="text-xs font-black uppercase tracking-widest text-gray-600">{user.role}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col text-xs font-medium">
                          <span className="text-gray-900">{user.email || "-"}</span>
                          <span className="text-muted-foreground text-[10px]">{user.no_telepon || ""}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         user.is_active 
                           ? 'bg-green-100 text-green-700 border border-green-200' 
                           : 'bg-gray-100 text-gray-700 border border-gray-200'
                       }`}>
                         {user.is_active ? 'Aktif' : 'Nonaktif'}
                       </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/users/edit/${user.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-gray-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
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
                Menampilkan <span className="font-bold text-gray-900">{filteredData.length}</span> dari <span className="font-bold text-gray-900">{totalCount}</span> user
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
      </div>
    </AuthRoleGuard>
  );
}
