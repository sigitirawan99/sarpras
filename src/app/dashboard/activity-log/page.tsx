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

import { toast } from "sonner";
import { ActivityLog } from "@/lib/types";
import { getActivityLogs } from "@/lib/api/activity-log";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { AuthRoleGuard } from "@/components/auth-role-guard";

export default function ActivityLogPage() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Helper to force Jakarta time (UTC+7)
const formatJakarta = (dateStr: string, pattern: string = "dd/MM/yyyy HH:mm:ss") => {
  try {
    const date = new Date(dateStr + 'Z');
    const jakartaDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    return format(jakartaDate, pattern, { locale: idLocale });
  } catch (e) {
    return dateStr;
  }
};


  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const { data: logs, count } = await getActivityLogs(page, pageSize);
      setData(logs as unknown as ActivityLog[]);
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuthRoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">
              Audit Log Aktivitas
            </h1>
            <p className="text-muted-foreground">
              Rekam jejak seluruh perubahan dan aktivitas penting dalam sistem.
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchData(currentPage)} className="gap-2 rounded-xl border-gray-200">
            <RotateCcw className="h-4 w-4" /> Refresh Log
          </Button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan aksi, modul, deskripsi atau nama user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-gray-100">
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                    Loading data log...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                    Tidak ada log aktivitas yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-blue-50/30 transition-colors">
                    <TableCell className="text-xs font-bold text-gray-500">
                      {formatJakarta(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getModuleIcon(log.module)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                          {log.module}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-gray-900">
                          {log.profile?.nama_lengkap || "System"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          @{log.profile?.username || "system"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 border-blue-100 rounded-md"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg hover:bg-blue-50 hover:text-blue-600"
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

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
             <p className="text-xs text-muted-foreground font-medium">
                Menampilkan <span className="font-bold text-gray-900">{filteredData.length}</span> dari <span className="font-bold text-gray-900">{totalCount}</span> log
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
                      {formatJakarta(selectedLog.created_at, "dd MMMM yyyy, HH:mm:ss")}
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
    </AuthRoleGuard>
  );
}
