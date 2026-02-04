"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Resolver } from "react-hook-form";
import * as z from "zod";
import { Loader2, Package } from "lucide-react";
import { format, addDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { getSarprasById } from "@/lib/api/sarpras";
import { Sarpras } from "@/lib/types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { createPeminjaman, getEffectiveStock } from "@/lib/api/peminjaman";

const loanSchema = z
  .object({
    sarpras_id: z.string().min(1, "Item wajib dipilih"),
    jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
    tanggal_pinjam: z.string().min(1, "Tanggal pinjam wajib diisi"),
    tanggal_kembali_estimasi: z
      .string()
      .min(1, "Estimasi pengembalian wajib diisi"),
    tujuan: z.string().min(5, "Tujuan minimal 5 karakter"),
  })
  .refine(
    (data) => {
      const pinjam = new Date(data.tanggal_pinjam);
      const kembali = new Date(data.tanggal_kembali_estimasi);
      return kembali >= pinjam;
    },
    {
      message: "Estimasi pengembalian tidak boleh sebelum tanggal pinjam",
      path: ["tanggal_kembali_estimasi"],
    },
  );

type LoanFormValues = z.infer<typeof loanSchema>;

function LoanApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sarprasId = searchParams.get("item");

  const [sarpras, setSarpras] = useState<Sarpras | null>(null);
  const [effectiveStock, setEffectiveStock] = useState<{
    stok_tersedia: number;
    total_pending: number;
    effective_stock: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema) as Resolver<LoanFormValues>,
    defaultValues: {
      sarpras_id: sarprasId || "",
      jumlah: 1,
      tanggal_pinjam: format(new Date(), "yyyy-MM-dd"),
      tanggal_kembali_estimasi: format(addDays(new Date(), 3), "yyyy-MM-dd"),
      tujuan: "",
    },
  });

  useEffect(() => {
    if (sarprasId) {
      Promise.all([getSarprasById(sarprasId), getEffectiveStock(sarprasId)])
        .then(([sData, eData]) => {
          setSarpras(sData);
          setEffectiveStock(eData);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Gagal mengambil data item");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sarprasId]);

  const onSubmit = async (values: LoanFormValues) => {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Sesi berakhir, silakan login kembali");
      router.push("/sign-in");
      return;
    }

    if (effectiveStock && values.jumlah > effectiveStock.effective_stock) {
      toast.error(
        `Stok efektif tidak mencukupi. Tersedia: ${effectiveStock.stok_tersedia}, Sudah dipesan: ${effectiveStock.total_pending}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await createPeminjaman({
        user_id: user.id,
        tanggal_pinjam: values.tanggal_pinjam,
        tanggal_kembali_estimasi: values.tanggal_kembali_estimasi,
        tujuan: values.tujuan,
        sarpras_id: values.sarpras_id,
        jumlah: values.jumlah,
        kondisi_pinjam: sarpras?.kondisi,
      });

      toast.success("Permohonan peminjaman berhasil diajukan!");
      router.push("/dashboard/peminjaman");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengajukan peminjaman");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sarprasId || !sarpras) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-sm">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Item Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2">
          Silakan pilih item dari daftar sarpras tersedia.
        </p>
        <Button
          asChild
          className="mt-4 bg-blue-600"
          onClick={() => router.push("/dashboard/sarpras-tersedia")}
        >
          Cari Sarpras
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Item Info Summary */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-40 bg-gray-100 overflow-hidden">
              {sarpras.foto ? null : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{sarpras.nama}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {sarpras.kode}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategori</span>
                <span className="font-medium">{sarpras.kategori?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lokasi</span>
                <span className="font-medium">
                  {sarpras.lokasi?.nama_lokasi}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tersedia</span>
                <span className="font-bold">
                  {sarpras.stok_tersedia} Unit
                </span>
              </div>
              {effectiveStock && effectiveStock.total_pending > 0 && (
                <>
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>Sedang Dipesan</span>
                    <span>{effectiveStock.total_pending} Unit</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="font-medium">Stok Efektif</span>
                    <span className="font-bold text-blue-600">
                      {effectiveStock.effective_stock} Unit
                    </span>
                  </div>
                </>
              )}
              {effectiveStock && effectiveStock.total_pending === 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bisa Dipinjam</span>
                  <span className="font-bold text-blue-600">
                    {effectiveStock.effective_stock} Unit
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loan Form */}
        <div className="md:col-span-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Ajukan Peminjaman</CardTitle>
              <CardDescription>
                Isi formulir di bawah ini untuk meminjam sarana/prasarana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values: LoanFormValues) =>
                    onSubmit(values),
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jumlah"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumlah Pinjam</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={effectiveStock?.effective_stock || sarpras.stok_tersedia}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maks bisa dipinjam: {effectiveStock?.effective_stock ?? sarpras.stok_tersedia}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tanggal_pinjam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Pinjam</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tanggal_kembali_estimasi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimasi Pengembalian</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Kapan Anda berencana mengembalikan item ini?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tujuan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tujuan Peminjaman</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Misal: Untuk kegiatan praktikum di Lab Komputer"
                            className="min-h-25"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1"
                      onClick={() => router.back()}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Ajukan Sekarang
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { AuthRoleGuard } from "@/components/auth-role-guard";

export default function LoanApplicationPage() {
  return (
    <AuthRoleGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <LoanApplicationContent />
      </Suspense>
    </AuthRoleGuard>
  );
}
