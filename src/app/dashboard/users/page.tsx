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
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

export default function UsersPage() {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setData(profiles as Profile[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola akun pengguna, petugas, dan administrator sistem.
          </p>
        </div>
        <Link href="/dashboard/users/tambah">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
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
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
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
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data user.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border">
                          <User className="h-5 w-5 text-gray-500" />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.nama_lengkap}</span>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-1.5">
                        {getRoleIcon(user.role)}
                        <span className="text-sm capitalize font-medium">{user.role}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col text-xs">
                        <span>{user.email || "-"}</span>
                        <span className="text-muted-foreground">{user.no_telepon || ""}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                       user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                     }`}>
                       {user.is_active ? 'Aktif' : 'Nonaktif'}
                     </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/users/edit/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
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
    </div>
  );
}
