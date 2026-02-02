"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ClipboardList,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getDashboardStats, getRecentLoans } from "@/lib/api/stats";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { Profile } from "@/lib/types";
import { ReactNode } from "react";

interface DashboardStats {
  totalItems: number;
  stockRate: number;
  pendingLoans: number;
  activeComplaints: number;
  totalUsers: number;
}

interface LoanData {
  id: string;
  status: string;
  created_at: string;
  profile?: { nama_lengkap: string };
  detail?: Array<{ sarpras?: { nama: string } }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<LoanData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    setLoading(true);

    try {
      const statsData = await getDashboardStats();
      setStats({
        totalItems: statsData.totalItems,
        stockRate: statsData.stockRate,
        pendingLoans: statsData.pendingLoans,
        activeComplaints: statsData.activeComplaints,
        totalUsers: statsData.totalUsers,
      });

      const recentL = await getRecentLoans(
        currentUser.role === "pengguna" ? currentUser.id : undefined,
      );
      setRecentLoans(recentL as unknown as LoanData[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20 font-black animate-pulse">
        MEMUAT DASHBOARD...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">
            Halo,{" "}
            <span className="text-blue-600">
              {user?.nama_lengkap?.split(" ")[0]}
            </span>
            ! 👋
          </h1>
          <p className="text-muted-foreground font-medium">
            Selamat datang di panel kontrol{" "}
            <span className="font-bold text-blue-900">SARPRAS</span>. Berikut
            ringkasan hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              {format(new Date(), "EEEE", { locale: idLocale })}
            </p>
            <p className="text-sm font-bold text-gray-900">
              {format(new Date(), "dd MMMM yyyy", { locale: idLocale })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Activity />
          </div>
        </div>
      </div>

      {/* Grid Utama Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Aset Tersedia"
          value={(stats?.stockRate ?? 0) + "%"}
          icon={<Package className="text-blue-600" />}
          desc="Persentase stok barang siap pinjam"
          color="blue"
          footer={
            <Progress
              value={stats?.stockRate ?? 0}
              className="h-1 bg-blue-100"
            />
          }
        />
        <DashboardStatCard
          title="Peminjaman Baru"
          value={stats?.pendingLoans ?? 0}
          icon={<ClipboardList className="text-orange-600" />}
          desc="Pengajuan menunggu persetujuan"
          color="orange"
          action="/dashboard/peminjaman"
        />
        <DashboardStatCard
          title="Pengaduan Aktif"
          value={stats?.activeComplaints ?? 0}
          icon={<AlertTriangle className="text-red-600" />}
          desc="Laporan kerusakan belum selesai"
          color="red"
          action="/dashboard/pengaduan"
        />
        <DashboardStatCard
          title="Total Pengguna"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="text-green-600" />}
          desc="Anggota terdaftar di sistem"
          color="green"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Loans */}
        <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 flex flex-row items-center justify-between border-b border-gray-100 p-6">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Clock className="text-blue-600 h-5 w-5" /> Aktivitas Peminjaman
              </CardTitle>
              <CardDescription>
                Daftar transaksi peminjaman terbaru.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full text-blue-600 font-bold"
            >
              <Link href="/dashboard/peminjaman">
                Semua <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentLoans.length > 0 ? (
                recentLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                        {loan.detail?.[0]?.sarpras?.nama?.[0] || "A"}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">
                          {loan.detail?.[0]?.sarpras?.nama || "Item"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {loan.profile?.nama_lengkap} •{" "}
                          {format(new Date(loan.created_at), "dd MMM")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`
                           text-[9px] font-black uppercase tracking-tighter
                           ${
                             loan.status === "menunggu"
                               ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                               : loan.status === "disetujui"
                                 ? "bg-blue-50 text-blue-700 border-blue-200"
                                 : loan.status === "dikembalikan"
                                   ? "bg-green-50 text-green-700 border-green-200"
                                   : "bg-gray-50 text-gray-500 border-gray-200"
                           }
                        `}
                    >
                      {loan.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-muted-foreground italic text-sm">
                  Masih sepi, belum ada aktivitas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em] pl-2">
            Akses Cepat
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {user?.role === "pengguna" ? (
              <>
                <QuickLinkCard
                  title="Pinjam Barang"
                  desc="Ajukan peminjaman sarpras"
                  icon={<ClipboardList />}
                  href="/dashboard/sarpras-tersedia"
                  color="blue"
                />
                <QuickLinkCard
                  title="Buat Pengaduan"
                  desc="Laporkan masalah alat"
                  icon={<AlertTriangle />}
                  href="/dashboard/pengaduan"
                  color="red"
                />
              </>
            ) : (
              <>
                <QuickLinkCard
                  title="Data Sarpras"
                  desc="Kelola inventaris sekolah"
                  icon={<Package />}
                  href="/dashboard/sarpras"
                  color="blue"
                />
                <QuickLinkCard
                  title="Scan Pengembalian"
                  desc="Proses barang kembali"
                  icon={<RotateCcw />}
                  href="/dashboard/pengembalian"
                  color="green"
                />
                <QuickLinkCard
                  title="Lihat Laporan"
                  desc="Analisis kesehatan aset"
                  icon={<TrendingUp />}
                  href="/dashboard/laporan/asset-health"
                  color="orange"
                />
              </>
            )}
          </div>

          {/* Support Box */}
          <div className="bg-linear-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-lg mb-2">Butuh Bantuan?</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-6">
                Jika mengalami kendala sistem, hubungi administrator IT Sekolah
                segera.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 border-none px-6"
              >
                Hubungi Admin
              </Button>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  desc: string;
  color: "blue" | "orange" | "red" | "green";
  footer?: ReactNode;
  action?: string;
}

function DashboardStatCard({
  title,
  value,
  icon,
  desc,
  color,
  footer,
  action,
}: DashboardStatCardProps) {
  const colors: Record<string, string> = {
    blue: "border-blue-50 hover:border-blue-100",
    orange: "border-orange-50 hover:border-orange-100",
    red: "border-red-50 hover:border-red-100",
    green: "border-green-50 hover:border-green-100",
  };

  const Content = (
    <Card
      className={`border-2 shadow-sm rounded-3xl transition-all hover:scale-[1.02] cursor-default overflow-hidden ${colors[color]}`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-50">
            {icon}
          </div>
          <Badge className="bg-gray-50 text-[8px] font-black uppercase text-gray-400 border-none tracking-widest">
            Live Update
          </Badge>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
            {value}
          </h3>
          <p className="text-[10px] font-medium text-gray-400 leading-tight mb-4">
            {desc}
          </p>
          {footer}
        </div>
      </CardContent>
    </Card>
  );

  if (action)
    return (
      <Link href={action} className="block">
        {Content}
      </Link>
    );
  return Content;
}

interface QuickLinkCardProps {
  title: string;
  desc: string;
  icon: ReactNode;
  href: string;
  color: "blue" | "red" | "green" | "orange";
}

function QuickLinkCard({ title, desc, icon, href, color }: QuickLinkCardProps) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
    red: "bg-red-50 text-red-600 border-red-100 hover:bg-red-100",
    green: "bg-green-50 text-green-600 border-green-100 hover:bg-green-100",
    orange:
      "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${colors[color]}`}
    >
      <div className="bg-white p-2.5 rounded-xl shadow-sm border flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-black text-sm text-gray-900 leading-tight">
          {title}
        </p>
        <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 opacity-30" />
    </Link>
  );
}
