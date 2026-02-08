"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sarpras } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  MapPin,
  AlertTriangle,
  Package,
  AlignLeft,
  Camera,
  Loader2,
} from "lucide-react";

const pengaduanSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  sarpras_id: z.string().optional().nullable(),
  lokasi: z.string().min(2, "Lokasi wajib diisi"),
  prioritas: z.enum(["rendah", "normal", "tinggi", "urgent"]),
  foto: z.string().optional().nullable(),
});

export type PengaduanFormValues = z.infer<typeof pengaduanSchema>;

interface PengaduanFormProps {
  sarprasList: Sarpras[];
  onSubmit: (values: PengaduanFormValues) => Promise<void>;
  loading?: boolean;
}

export function PengaduanForm({
  sarprasList,
  onSubmit,
  loading = false,
}: PengaduanFormProps) {
  const [uploading, setUploading] = useState(false);

  const form = useForm<PengaduanFormValues>({
    resolver: zodResolver(pengaduanSchema),
    defaultValues: {
      judul: "",
      deskripsi: "",
      sarpras_id: null,
      lokasi: "",
      prioritas: "normal",
      foto: null,
    },
  });

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `complaints/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      form.setValue("foto", publicUrl);
      toast.success("Foto berhasil diunggah");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="judul"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Subjek / Judul
              </FormLabel>
              <FormControl>
                <Input placeholder="Contoh: AC Lab 1 Tidak Dingin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="lokasi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Ruangan / Lokasi
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Misal: Lantai 2, Ruang Kelas 12A"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prioritas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  Prioritas
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Prioritas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rendah">Rendah</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="tinggi">Tinggi</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sarpras_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Jenis Sarpras (Opsional)
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Sarpras Terkait" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sarprasList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      [{item.kode}] {item.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih jika pengaduan spesifik pada satu alat.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deskripsi"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-blue-500" />
                Deskripsi Masalah
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan secara detail apa yang terjadi..."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-500" />
            Foto Bukti (Opsional)
          </FormLabel>
          <div className="flex items-center gap-4">
            {form.watch("foto") ? null : (
              <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                <Camera size={24} />
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                disabled={uploading}
                className="rounded-xl border-gray-200 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            disabled={loading || uploading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              "Kirim Pengaduan"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
