"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SarprasForm,
  type SarprasFormValues,
} from "@/components/sarpras/sarpras-form";
import { getKategori } from "@/lib/api/kategori";
import { getLokasi } from "@/lib/api/lokasi";
import { updateSarpras, getSarprasById } from "@/lib/api/sarpras";
import { Kategori, Lokasi, Sarpras } from "@/lib/types";
import { toast } from "sonner";

export default function EditSarprasPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<Sarpras | null>(null);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kategoriRes, lokasiRes, sarprasRes] = await Promise.all([
          getKategori(),
          getLokasi(),
          getSarprasById(id),
        ]);
        setKategoriList(kategoriRes as Kategori[]);
        setLokasiList(lokasiRes as Lokasi[]);
        setInitialData(sarprasRes);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (values: SarprasFormValues) => {
    setLoading(true);
    try {
      await updateSarpras(id, values);
      toast.success("Data Sarpras berhasil diperbarui");
      router.push("/dashboard/sarpras");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui data sarpras");
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

  if (!initialData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Data tidak ditemukan</h2>
        <Button variant="link" onClick={() => router.back()}>
          Kembali
        </Button>
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Sarpras</h1>
          <p className="text-muted-foreground text-sm">
            Perbarui informasi sarana dan prasarana.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Formulir Edit Sarpras</CardTitle>
        </CardHeader>
        <CardContent>
          <SarprasForm
            initialData={initialData}
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
