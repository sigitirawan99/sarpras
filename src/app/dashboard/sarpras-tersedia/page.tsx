"use client";

import { useEffect, useState } from "react";
import { Search, Package, ShoppingCart, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sarpras, Kategori } from "@/lib/types";
import { getSarprasList } from "@/lib/api/sarpras";
import { getKategori } from "@/lib/api/kategori";
import { toast } from "sonner";
import Link from "next/link";

import { AuthRoleGuard } from "@/components/auth-role-guard";
import LetterAvatar from "@/components/letter-avatar";

export default function SarprasTersediaPage() {
  const [data, setData] = useState<Sarpras[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sarprasRes, kategoriRes] = await Promise.all([
        getSarprasList(),
        getKategori(),
      ]);
      // Filter only available items with stock > 0 and konditi 'baik' or 'rusak_ringan'
      const availableItems = sarprasRes.data.filter(
        (item) =>
          item.stok_tersedia > 0 &&
          (item.kondisi === "baik" || item.kondisi === "rusak_ringan"),
      );
      setData(availableItems);
      setKategoriList(kategoriRes as Kategori[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data sarpras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori =
      selectedKategori === "all" || item.kategori_id === selectedKategori;
    return matchesSearch && matchesKategori;
  });

  return (
    <AuthRoleGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Sarpras Tersedia
          </h1>
          <p className="text-muted-foreground">
            Pilih sarana atau prasarana yang ingin Anda pinjam.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari alat atau buku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Button
              variant={selectedKategori === "all" ? "default" : "outline"}
              onClick={() => setSelectedKategori("all")}
              className="h-11 px-6 rounded-full"
            >
              Semua
            </Button>
            {kategoriList.map((kat) => (
              <Button
                key={kat.id}
                variant={selectedKategori === kat.id ? "default" : "outline"}
                onClick={() => setSelectedKategori(kat.id)}
                className="h-11 px-6 rounded-full whitespace-nowrap"
              >
                {kat.nama}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-87.5 bg-gray-100 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold">Tidak Ada Sarpras</h3>
            <p className="text-muted-foreground">
              Maaf, saat ini tidak ada item yang tersedia for kategori atau
              pencarian tersebut.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {item.foto ? (
                    <img
                      src={item.foto}
                      alt={item.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LetterAvatar name={item.nama} size={200} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-white/90 text-blue-600 hover:bg-white backdrop-blur-sm border-none shadow-sm capitalize">
                      {item.kategori?.nama}
                    </Badge>
                    <Badge
                      className={`${item.kondisi === "baik" ? "bg-green-500" : "bg-yellow-500"} text-white border-none shadow-sm capitalize`}
                    >
                      {item.kondisi.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-blue-600 transition-colors">
                      {item.nama}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-mono">
                    <Tag className="h-3 w-3" />
                    {item.kode}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span className="truncate">{item.lokasi?.nama_lokasi}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50">
                    <span className="text-xs font-medium text-blue-700">
                      Tersedia
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                      {item.stok_tersedia} Unit
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 p-4 border-t bg-gray-50/50">
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-xl"
                  >
                    <Link href={`/dashboard/peminjaman/ajukan?item=${item.id}`}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Pinjam Sekarang
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthRoleGuard>
  );
}
