"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KategoriForm,
  type KategoriFormValues,
} from "@/components/kategori/kategori-form";
import { createKategori } from "@/lib/api/kategori";
import { toast } from "sonner";

export default function TambahKategoriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: KategoriFormValues) => {
    setLoading(true);
    try {
      await createKategori(values);
      toast.success("Kategori berhasil ditambahkan");
      router.push("/dashboard/kategori");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan kategori");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
          <h1 className="text-2xl font-bold tracking-tight">Tambah Kategori</h1>
          <p className="text-muted-foreground text-sm">
            Buat kategori baru untuk sarana dan prasarana.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Formulir Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <KategoriForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
