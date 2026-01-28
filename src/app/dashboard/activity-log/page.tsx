"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  Clock,
  Layers,
  FileJson,
  RotateCcw,
  Package,
  ShieldCheck,
  AlertTriangle,
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
  DialogDescription,
} from "@/components/ui/dialog";

import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ActivityLog } from "@/lib/types";

export default function ActivityLogPage() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from("activity_log")
        .select(
          `
          *,
          profile:user_id (id, nama_lengkap, username, role)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setData(logs || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case "auth":
        return <ShieldCheck className="h-4 w-4 text-purple-500" />;
      case "sarpras":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "peminjaman":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "pengaduan":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Layers className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.action?.toLowerCase().includes(searchLower) ||
      item.module?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.profile?.nama_lengkap?.toLowerCase().includes(searchLower) ||
      item.profile?.username?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audit Log Aktivitas
          </h1>
          <p className="text-muted-foreground">
            Rekam jejak seluruh perubahan dan aktivitas penting dalam sistem.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Refresh Log
        </Button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan aksi, modul, deskripsi atau nama user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Waktu</TableHead>
              <TableHead>Modul</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada log aktivitas.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-medium">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getModuleIcon(log.module)}
                      <span className="text-xs font-bold uppercase tracking-tighter">
                        {log.module}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold">
                        {log.profile?.nama_lengkap || "System"}
                      </span>
                      <span className="text-muted-foreground">
                        @{log.profile?.username || "system"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 border-blue-100"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {log.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailOpen(true);
                      }}
                    >
                      <FileJson className="h-4 w-4" />
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
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" /> Detail Aktivitas
            </DialogTitle>
            <DialogDescription>
              Informasi detail meta-data aktivitas sistem.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                    Aksi & Modul
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 font-black">
                      {selectedLog.action}
                    </Badge>
                    <Badge variant="outline" className="font-bold">
                      {selectedLog.module}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                    Waktu Kejadian
                  </p>
                  <p className="text-sm font-bold">
                    {format(
                      new Date(selectedLog.created_at),
                      "dd MMMM yyyy, HH:mm:ss",
                      { locale: idLocale },
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Deskripsi
                </p>
                <p className="text-sm bg-white p-4 rounded-xl border italic font-medium leading-relaxed">
                  &quot;{selectedLog.description}&quot;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Client Info
                  </p>
                  <p className="text-[10px] text-muted-foreground break-all">
                    {selectedLog.user_agent || "-"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    IP Address
                  </p>
                  <p className="text-[10px] font-mono font-bold text-gray-600">
                    {selectedLog.ip_address || "Unknown"}
                  </p>
                </div>
              </div>

              {(selectedLog.data_before || selectedLog.data_after) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Data Diff (JSON)
                  </p>
                  <div className="grid grid-cols-2 gap-3 h-48">
                    <div className="overflow-auto bg-gray-900 text-green-400 p-3 rounded-xl text-[10px] font-mono border border-gray-800">
                      <p className="text-[8px] uppercase font-black text-gray-500 mb-2 border-b border-gray-800 pb-1">
                        Before
                      </p>
                      <pre>
                        {JSON.stringify(selectedLog.data_before, null, 2)}
                      </pre>
                    </div>
                    <div className="overflow-auto bg-gray-900 text-blue-400 p-3 rounded-xl text-[10px] font-mono border border-gray-800">
                      <p className="text-[8px] uppercase font-black text-gray-500 mb-2 border-b border-gray-800 pb-1">
                        After
                      </p>
                      <pre>
                        {JSON.stringify(selectedLog.data_after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="bg-gray-50 -mx-6 -mb-6 p-4 border-t">
            <Button
              variant="default"
              className="w-full bg-blue-600"
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
