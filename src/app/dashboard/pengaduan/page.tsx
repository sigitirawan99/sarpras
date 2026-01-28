"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MessageSquare,
  Package,
  MapPin,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import { toast } from "sonner";
import {
  Sarpras,
  Profile,
  PengaduanStatus,
  PengaduanPrioritas,
  Pengaduan,
  PengaduanProgress,
} from "@/lib/types";

type PengaduanWithRelations = Pengaduan & {
  profile: Pick<Profile, "id" | "nama_lengkap" | "username" | "foto_profil">;
  sarpras: Pick<Sarpras, "id" | "nama" | "kode"> | null;
  progress: Pick<
    PengaduanProgress,
    "id" | "catatan" | "status" | "created_at"
  >[];
};

export default function PengaduanPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [data, setData] = useState<PengaduanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] =
    useState<PengaduanWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);

    setLoading(true);
    try {
      let query = supabase
        .from("pengaduan")
        .select(
          `
          *,
          profile:user_id (id, nama_lengkap, username, foto_profil),
          sarpras:sarpras_id (id, nama, kode),
          progress:pengaduan_progress (id, catatan, status, created_at)
        `,
        )
        .order("created_at", { ascending: false });

      if (currentUser.role === "pengguna") {
        query = query.eq("user_id", currentUser.id);
      }

      const { data: complaints, error } = await query;
      if (error) throw error;
      setData((complaints as unknown as PengaduanWithRelations[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data pengaduan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (
    complaintId: string,
    newStatus: string,
    catatan: string,
  ) => {
    if (!user) return;
    try {
      const { error: pError } = await supabase
        .from("pengaduan_progress")
        .insert({
          pengaduan_id: complaintId,
          petugas_id: user.id,
          catatan: catatan,
          status: newStatus,
        });
      if (pError) throw pError;

      const { error: uError } = await supabase
        .from("pengaduan")
        .update({ status: newStatus })
        .eq("id", complaintId);

      if (uError) throw uError;

      toast.success(`Status diperbarui menjadi ${newStatus}`);
      fetchData();
      if (selectedItem?.id === complaintId) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui status");
    }
  };

  const getStatusBadge = (status: PengaduanStatus) => {
    switch (status) {
      case "menunggu":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Belum Ditindaklanjuti
          </Badge>
        );
      case "diproses":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Sedang Diproses
          </Badge>
        );
      case "selesai":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Selesai
          </Badge>
        );
      case "ditolak":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Ditolak
          </Badge>
        );
    }
  };

  const getPrioritasBadge = (prio: PengaduanPrioritas) => {
    switch (prio) {
      case "urgent":
        return (
          <Badge className="bg-red-600 text-white border-none">URGENT</Badge>
        );
      case "tinggi":
        return (
          <Badge className="bg-orange-500 text-white border-none">TINGGI</Badge>
        );
      case "normal":
        return (
          <Badge className="bg-blue-500 text-white border-none">NORMAL</Badge>
        );
      case "rendah":
        return (
          <Badge className="bg-gray-400 text-white border-none">RENDAH</Badge>
        );
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(searchLower) ||
      item.profile?.nama_lengkap?.toLowerCase().includes(searchLower) ||
      item.sarpras?.nama?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">
            Pusat Pengaduan
          </h1>
          <p className="text-muted-foreground">
            Laporkan kerusakan atau masalah pada sarana dan prasarana sekolah.
          </p>
        </div>
        <Link href="/dashboard/pengaduan/ajukan">
          <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-blue-200">
            <Plus className="h-5 w-5" /> Ajukan Pengaduan
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari judul, pelapor, atau sarpras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-50 border rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Belum Ada Pengaduan</h3>
          <p className="text-muted-foreground">
            Semua sistem berjalan lancar atau tidak ada pengaduan ditemukan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((complaint) => (
            <Card
              key={complaint.id}
              className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col bg-white"
            >
              <div className="relative h-4 w-full">
                <div
                  className={`h-full w-full ${
                    complaint.status === "menunggu"
                      ? "bg-yellow-400"
                      : complaint.status === "diproses"
                        ? "bg-blue-500"
                        : complaint.status === "selesai"
                          ? "bg-green-500"
                          : "bg-red-500"
                  }`}
                ></div>
              </div>
              <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-3">
                  {getPrioritasBadge(complaint.prioritas)}
                  <span className="text-[10px] text-muted-foreground font-bold font-mono">
                    {format(new Date(complaint.created_at), "dd/MM/yyyy")}
                  </span>
                </div>
                <CardTitle className="text-lg font-black line-clamp-2 leading-tight min-h-14 group-hover:text-blue-600 transition-colors">
                  {complaint.judul}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">
                    {complaint.profile?.nama_lengkap?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-none">
                      {complaint.profile?.nama_lengkap}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pelapor</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate font-medium">
                      {complaint.lokasi}
                    </span>
                  </div>
                  {complaint.sarpras && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span className="truncate font-medium">
                        {complaint.sarpras.nama}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-gray-50/50 flex justify-between items-center border-t">
                {getStatusBadge(complaint.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:bg-blue-50 hover:text-blue-600 font-bold text-xs"
                  onClick={() => {
                    setSelectedItem(complaint);
                    setIsDetailOpen(true);
                  }}
                >
                  Detail <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {selectedItem && (
            <div className="flex flex-col">
              {/* Header Image/Pattern */}
              <div className="h-48 bg-blue-900 relative flex items-center justify-center p-6 text-white text-center overflow-hidden">
                {selectedItem.foto ? null : (
                  <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4">
                    {[...Array(20)].map((_, i) => (
                      <MessageSquare key={i} className="w-12 h-12" />
                    ))}
                  </div>
                )}
                <div className="relative z-10 space-y-2">
                  {getPrioritasBadge(selectedItem.prioritas)}
                  <h2 className="text-2xl font-black leading-tight drop-shadow-md">
                    {selectedItem.judul}
                  </h2>
                </div>
              </div>

              <div className="p-8 grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3 space-y-6">
                  <section>
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3">
                      Deskripsi Masalah
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                      &quot;{selectedItem.deskripsi}&quot;
                    </p>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3">
                      Timeline & Tindak Lanjut
                    </h3>
                    <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                      {/* Original Submission */}
                      <div className="relative">
                        <div className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900">
                            Pengaduan Diterima
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(
                              new Date(selectedItem.created_at),
                              "dd MMM yyyy HH:mm",
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress Updates */}
                      {selectedItem.progress?.map((p) => (
                        <div key={p.id} className="relative">
                          <div
                            className={`absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full ${
                              p.status === "selesai"
                                ? "bg-green-500"
                                : "bg-blue-400"
                            }`}
                          ></div>
                          <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">
                                {p.status}
                              </p>
                              <span className="text-[9px] font-bold text-muted-foreground">
                                {format(new Date(p.created_at), "dd MMM HH:mm")}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-snug">
                              {p.catatan}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <section className="bg-gray-50 p-4 rounded-3xl border border-gray-200">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
                      Informasi Pelapor
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none">
                          {selectedItem.profile?.nama_lengkap}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          @{selectedItem.profile?.username}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Staff Actions */}
                  {user?.role !== "pengguna" &&
                    selectedItem.status !== "selesai" && (
                      <section className="space-y-4 pt-4 border-t">
                        <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest text-center">
                          Update Progress
                        </h3>
                        <UpdateStatusForm
                          currentStatus={selectedItem.status}
                          onUpdate={(status, catatan) =>
                            updateStatus(selectedItem.id, status, catatan)
                          }
                        />
                      </section>
                    )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin size={12} className="text-red-400" />
                      <span className="font-bold text-gray-500">
                        {selectedItem.lokasi}
                      </span>
                    </div>
                    {selectedItem.sarpras && (
                      <div className="flex items-center gap-2 text-xs">
                        <Package size={12} className="text-blue-400" />
                        <span className="font-bold text-gray-500">
                          {selectedItem.sarpras.nama}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl px-10 border-gray-300 font-bold"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Kembali
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UpdateStatusForm({
  currentStatus,
  onUpdate,
}: {
  currentStatus: string;
  onUpdate: (status: string, catatan: string) => void;
}) {
  const [status, setStatus] = useState<string>(
    currentStatus === "menunggu" ? "diproses" : "selesai",
  );
  const [catatan, setCatatan] = useState("");

  return (
    <div className="space-y-3 p-4 bg-blue-50 rounded-3xl border border-blue-100">
      <Select onValueChange={setStatus} defaultValue={status}>
        <SelectTrigger className="bg-white rounded-xl border-blue-200">
          <SelectValue placeholder="Pilih Status Baru" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="diproses">Sedang Diproses</SelectItem>
          <SelectItem value="selesai">Selesai / Teratasi</SelectItem>
          <SelectItem value="ditolak">Tolak Pengaduan</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Tambahkan catatan tindak lanjut..."
        className="bg-white rounded-xl text-xs min-h-20 border-blue-200"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs"
        onClick={() => onUpdate(status, catatan)}
        disabled={!catatan}
      >
        Simpan Update
      </Button>
    </div>
  );
}
