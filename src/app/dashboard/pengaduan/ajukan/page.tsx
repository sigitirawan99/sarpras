"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PengaduanForm,
  type PengaduanFormValues,
} from "@/components/pengaduan/pengaduan-form";
import { getSarprasList } from "@/lib/api/sarpras";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { createPengaduan } from "@/lib/api/pengaduan";
import { Sarpras, Profile } from "@/lib/types";
import { toast } from "sonner";

export default function AjukanPengaduanPage() {
  const router = useRouter();
  const [sarprasList, setSarprasList] = useState<Sarpras[]>([]);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        const sarprasRes = await getSarprasList();
        setSarprasList(sarprasRes);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data sarpras");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [router]);

  const handleSubmit = async (values: PengaduanFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      await createPengaduan({
        user_id: user.id,
        ...values,
      });

      toast.success("Pengaduan berhasil diajukan!");
      router.push("/dashboard/pengaduan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim pengaduan");
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
    <div className="space-y-6 max-w-3xl mx-auto py-6">
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
          <h1 className="text-2xl font-bold tracking-tight text-blue-900">
            Ajukan Pengaduan
          </h1>
          <p className="text-muted-foreground text-sm">
            Laporkan masalah sarana dan prasarana sekolah.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-blue-900 text-white p-8">
          <CardTitle className="text-2xl">Buat Pengaduan Baru</CardTitle>
          <CardDescription className="text-blue-100">
            Jelaskan masalah sarpras dengan detail agar dapat segera
            ditindaklanjuti.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <PengaduanForm
            sarprasList={sarprasList}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
