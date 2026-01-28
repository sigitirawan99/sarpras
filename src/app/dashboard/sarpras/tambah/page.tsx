"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SarprasForm,
  type SarprasFormValues,
} from "@/components/sarpras/sarpras-form";
import { getKategori } from "@/lib/api/kategori";
import { getLokasi } from "@/lib/api/lokasi";
import { createSarpras } from "@/lib/api/sarpras";
import { Kategori, Lokasi } from "@/lib/types";
import { toast } from "sonner";

export default function TambahSarprasPage() {
  const router = useRouter();
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kategoriRes, lokasiRes] = await Promise.all([
          getKategori(),
          getLokasi(),
        ]);
        setKategoriList(kategoriRes as Kategori[]);
        setLokasiList(lokasiRes as Lokasi[]);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data pendukung");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values: SarprasFormValues) => {
    setLoading(true);
    try {
      await createSarpras(values);
      toast.success("Data Sarpras berhasil ditambahkan");
      router.push("/dashboard/sarpras");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan data sarpras");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tambah Sarpras Baru
          </h1>
          <p className="text-muted-foreground text-sm">
            Lengkapi detail sarana dan prasarana di bawah ini.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Formulir Data Sarpras</CardTitle>
        </CardHeader>
        <CardContent>
          <SarprasForm
            kategoriList={kategoriList}
            lokasiList={lokasiList}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
