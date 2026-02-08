"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LokasiForm,
  type LokasiFormValues,
} from "@/components/lokasi/lokasi-form";
import { createLokasi } from "@/lib/api/lokasi";
import { toast } from "sonner";

export default function TambahLokasiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LokasiFormValues) => {
    setLoading(true);
    try {
      await createLokasi(values);
      toast.success("Lokasi berhasil ditambahkan");
      router.push("/dashboard/lokasi");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan lokasi");
    } finally {
      setLoading(false);
    }
  };

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
            Tambah Lokasi
          </h1>
          <p className="text-muted-foreground text-sm">
            Buat lokasi atau ruangan baru untuk penyimpanan sarpras.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Formulir Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <LokasiForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
