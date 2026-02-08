"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Package,
  History,
  TrendingDown,
  TrendingUp,
  MapPin,
  FileBarChart,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ReactNode } from "react";

interface SarprasCondition {
  id: string;
  nama: string;
  kondisi: string;
  kategori: { nama: string } | { nama: string }[] | null;
}

interface ConditionCounts {
  baik: number;
  rusak_ringan: number;
  rusak_berat: number;
  hilang: number;
  [key: string]: number;
}

interface DamagedItem {
  name: string;
  count: number;
}

interface MaintenanceHistory {
  id: string;
  sarpras_id: string;
  kondisi: string;
  deskripsi: string | null;
  sumber: string | null;
  created_at: string;
  sarpras: {
    nama: string;
    kode: string;
    lokasi:
      | {
          nama_lokasi: string;
        }
      | {
          nama_lokasi: string;
        }[]
      | null;
  } | null;
}

interface HistoryItem {
  kondisi: string;
  sarpras:
    | {
        nama: string;
        kode: string;
      }
    | {
        nama: string;
        kode: string;
      }[]
    | null;
}

import { AuthRoleGuard } from "@/components/auth-role-guard";

const COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

export default function AssetHealthPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSarpras: 0,
    baik: 0,
    rusakRingan: 0,
    rusakBerat: 0,
    hilang: 0,
  });
  const [conditionData, setConditionData] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [topDamaged, setTopDamaged] = useState<DamagedItem[]>([]);
  const [recentMaintenance, setRecentMaintenance] = useState<
    MaintenanceHistory[]
  >([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch condition stats
      const { data: sarpras, error: sError } = await supabase
        .from("sarpras")
        .select("id, nama, kondisi, kategori(nama)");

      if (sError) throw sError;

      const counts = (sarpras || []).reduce(
        (acc: ConditionCounts, curr: SarprasCondition) => {
          acc[curr.kondisi] = (acc[curr.kondisi] || 0) + 1;
          return acc;
        },
        { baik: 0, rusak_ringan: 0, rusak_berat: 0, hilang: 0 },
      );

      setStats({
        totalSarpras: sarpras.length,
        baik: counts.baik,
        rusakRingan: counts.rusak_ringan,
        rusakBerat: counts.rusak_berat,
        hilang: counts.hilang,
      });

      setConditionData([
        { name: "Baik", value: counts.baik },
        { name: "Rusak Ringan", value: counts.rusak_ringan },
        { name: "Rusak Berat", value: counts.rusak_berat },
        { name: "Hilang", value: counts.hilang },
      ]);

      // 2. Fetch top damaged items from riwayat_kondisi_alat
      const { data: history, error: hError } = await supabase
        .from("riwayat_kondisi_alat")
        .select("sarpras:sarpras_id(nama, kode), kondisi");

      if (hError) throw hError;

      const damagedMap = ((history as unknown as HistoryItem[]) || []).reduce(
        (acc: Record<string, number>, curr) => {
          if (curr.kondisi !== "baik" && curr.sarpras) {
            const sarprasData = Array.isArray(curr.sarpras)
              ? curr.sarpras[0]
              : curr.sarpras;
            const key = sarprasData.nama;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const sortedDamaged = Object.entries(damagedMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a: DamagedItem, b: DamagedItem) => b.count - a.count)
        .slice(0, 5);

      setTopDamaged(sortedDamaged);

      // 3. Fetch recent maintenance (all non-baik returns/updates)
      const { data: recent, error: rError } = await supabase
        .from("riwayat_kondisi_alat")
        .select(
          `
            *,
            sarpras:sarpras_id (nama, kode, lokasi:lokasi_id (nama_lokasi))
         `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (rError) throw rError;
      setRecentMaintenance(recent || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data analitik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center font-black animate-pulse text-blue-600">
        MENGANALISIS KESEHATAN ASET...
      </div>
    );
  }

  return (
    <AuthRoleGuard allowedRoles={["admin", "petugas"]}>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">
              Analitik Kesehatan Aset
            </h1>
            <p className="text-muted-foreground">
              Insight mendalam tentang kondisi fisik dan keberlanjutan sarana
              prasarana.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 py-1 px-4 rounded-full border-blue-100"
            >
              <Activity className="h-3 w-3 mr-2" /> Real-time Data
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Aset"
            value={stats.totalSarpras}
            icon={<Package className="text-blue-600" />}
            color="blue"
            desc="Jumlah seluruh sarpras terdaftar"
          />
          <StatCard
            title="Kondisi Sempurna"
            value={stats.baik}
            icon={<CheckCircle2 className="text-green-600" />}
            color="green"
            desc={`${Math.round((stats.baik / stats.totalSarpras) * 100)}% dari total aset`}
          />
          <StatCard
            title="Butuh Perbaikan"
            value={stats.rusakRingan + stats.rusakBerat}
            icon={<AlertTriangle className="text-orange-600" />}
            color="orange"
            desc="Terdapat kerusakan minor/major"
          />
          <StatCard
            title="Aset Hilang"
            value={stats.hilang}
            icon={<TrendingDown className="text-red-600" />}
            color="red"
            desc="Perlu penggantian segera"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Condition Distribution Chart */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-blue-600" /> Distribusi
                Kondisi Aset
              </CardTitle>
              <CardDescription>
                Persentase kondisi aset saat ini berdasarkan data master.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-87.5 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {conditionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Most Frequently Damaged Items */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" /> Aset Paling
                Sering Bermasalah
              </CardTitle>
              <CardDescription>
                Top 5 aset dengan frekuensi laporan kerusakan tertinggi.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-87.5 pt-6 flex flex-col justify-center">
              {topDamaged.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDamaged}
                    layout="vertical"
                    margin={{ left: 40, right: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      style={{ fontSize: "10px", fontWeight: "bold" }}
                    />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[0, 10, 10, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-20 text-muted-foreground italic">
                  Belum ada data kerusakan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History Table */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-blue-900 text-white p-6">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Riwayat Perubahan Kondisi Aset
            </CardTitle>
            <CardDescription className="text-blue-200">
              Timeline kerusakan dan perbaikan terbaru.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-900/50 hover:bg-blue-900/50 border-blue-800">
                  <TableHead className="text-blue-100 font-bold uppercase tracking-wider text-[10px] pl-6">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-blue-100 font-bold uppercase tracking-wider text-[10px]">
                    Aset / Kode
                  </TableHead>
                  <TableHead className="text-blue-100 font-bold uppercase tracking-wider text-[10px]">
                    Kondisi
                  </TableHead>
                  <TableHead className="text-blue-100 font-bold uppercase tracking-wider text-[10px]">
                    Lokasi
                  </TableHead>
                  <TableHead className="text-blue-100 font-bold uppercase tracking-wider text-[10px]">
                    Catatan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMaintenance.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-gray-50 border-gray-100"
                  >
                    <TableCell className="pl-6 text-xs font-medium">
                      {format(new Date(item.created_at), "dd/MM/yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">
                          {item.sarpras?.nama}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.sarpras?.kode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                                text-[9px] font-black uppercase tracking-tighter
                                ${
                                  item.kondisi === "baik"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : item.kondisi === "rusak_ringan"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : item.kondisi === "rusak_berat"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }
                             `}
                      >
                        {item.kondisi.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin size={10} />
                        {(() => {
                          const lokasi = item.sarpras?.lokasi;
                          if (!lokasi) return "-";
                          return Array.isArray(lokasi)
                            ? lokasi[0]?.nama_lokasi
                            : lokasi.nama_lokasi;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">
                      <span className="truncate block max-w-50">
                        &quot;{item.deskripsi || item.sumber || "-"}&quot;
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthRoleGuard>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "red";
  desc: string;
}

function StatCard({ title, value, icon, color, desc }: StatCardProps) {
  const variants: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    orange: "bg-orange-50 border-orange-100",
    red: "bg-red-50 border-red-100",
  };

  return (
    <Card
      className={`border-2 shadow-sm rounded-3xl transition-all hover:scale-[1.02] ${variants[color]}`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            {icon}
          </div>
          <Badge className="bg-white/50 text-gray-500 hover:bg-white/50 border-none text-[10px] font-bold">
            LIVE
          </Badge>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
            {title}
          </p>
          <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">
            {value}
          </h3>
          <p className="text-[10px] font-medium text-gray-400 leading-tight">
            {desc}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
