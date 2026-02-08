"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LokasiForm, LokasiFormValues } from "@/components/lokasi/lokasi-form";
import { updateLokasi, getLokasiById } from "@/lib/api/lokasi";
import { Lokasi } from "@/lib/types";
import { toast } from "sonner";

export default function EditLokasiPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<Lokasi | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLokasiById(id);
        setInitialData(data as Lokasi);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data lokasi");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (values: LokasiFormValues) => {
    setLoading(true);
    try {
      await updateLokasi(id, values);
      toast.success("Lokasi berhasil diperbarui");
      router.push("/dashboard/lokasi");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui lokasi");
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
        <h2 className="text-xl font-bold">Lokasi tidak ditemukan</h2>
        <Button variant="link" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Lokasi
          </h1>
          <p className="text-muted-foreground text-sm">
            Perbarui informasi lokasi atau ruangan.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Formulir Edit Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <LokasiForm
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
