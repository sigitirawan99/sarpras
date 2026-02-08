"use client";

import { Resolver, useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { generateSarprasCode } from "@/lib/utils/sarpras-utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Kategori, Lokasi, Sarpras } from "@/lib/types";
import {
  Barcode,
  Package,
  Layers,
  MapPin,
  Activity,
  Calendar,
  Loader2,
} from "lucide-react";

const sarprasSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  kode: z.string().optional(),
  kategori_id: z.string().min(1, "Kategori wajib dipilih"),
  lokasi_id: z.string().min(1, "Lokasi wajib dipilih"),
  stok_total: z.coerce.number().min(1, "Stok minimal 1"),
  kondisi: z.enum(["baik", "rusak_ringan", "rusak_berat", "hilang"]),
  tanggal_perolehan: z.string().min(1, "tanggal perolehan tidak boleh kosong"),
});

export type SarprasFormValues = z.infer<typeof sarprasSchema>;

interface SarprasFormProps {
  initialData?: Sarpras;
  kategoriList: Kategori[];
  lokasiList: Lokasi[];
  onSubmit: (values: SarprasFormValues) => Promise<void>;
  loading?: boolean;
}

export function SarprasForm({
  initialData,
  kategoriList,
  lokasiList,
  onSubmit,
  loading = false,
}: SarprasFormProps) {
  const form = useForm<SarprasFormValues>({
    resolver: zodResolver(sarprasSchema) as Resolver<SarprasFormValues>,
    defaultValues: {
      nama: initialData?.nama || "",
      kode: initialData?.kode || "",
      kategori_id: initialData?.kategori_id || "",
      lokasi_id: initialData?.lokasi_id || "",
      stok_total: initialData?.stok_total || 0,
      kondisi: initialData?.kondisi || "baik",
      tanggal_perolehan: initialData?.tanggal_perolehan || "",
    },
  });

  const nama = form.watch("nama");
  const kategori_id = form.watch("kategori_id");
  const kondisi = form.watch("kondisi");

  useEffect(() => {
    if (!initialData && nama && kategori_id) {
      const kat = kategoriList.find((k) => k.id === kategori_id);
      const code = generateSarprasCode(nama, kat?.nama || "XYZ", kondisi);
      form.setValue("kode", code);
    }
  }, [nama, kategori_id, kondisi, initialData, kategoriList, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="kode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-blue-500" />
                  Kode Sarpras (Otomatis)
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled placeholder="Otomatis" className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Nama Alat
                </FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Proyektor Epson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="kategori_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Kategori
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {kategoriList.map((kat) => (
                      <SelectItem key={kat.id} value={kat.id}>
                        {kat.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lokasi_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Lokasi
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Lokasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lokasiList.map((lok) => (
                      <SelectItem key={lok.id} value={lok.id}>
                        {lok.nama_lokasi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="stok_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Stok Total
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kondisi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Kondisi
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kondisi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                    <SelectItem value="hilang">Hilang</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tanggal_perolehan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Tanggal Perolehan
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-md font-semibold transition-all shadow-md active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {initialData ? "Simpan Perubahan" : "Simpan Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
