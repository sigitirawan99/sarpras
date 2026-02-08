"use client";

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Kategori } from "@/lib/types";
import { Tags, Info, Loader2 } from "lucide-react";

const kategoriSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  deskripsi: z.string().optional(),
});

export type KategoriFormValues = z.infer<typeof kategoriSchema>;

interface KategoriFormProps {
  initialData?: Kategori;
  onSubmit: (values: KategoriFormValues) => Promise<void>;
  loading?: boolean;
}

export function KategoriForm({
  initialData,
  onSubmit,
  loading = false,
}: KategoriFormProps) {
  const form = useForm<KategoriFormValues>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: {
      nama: initialData?.nama || "",
      deskripsi: initialData?.deskripsi || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Tags className="h-4 w-4 text-blue-500" />
                Nama Kategori
              </FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Elektronik" {...field} />
              </FormControl>
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
                <Info className="h-4 w-4 text-blue-500" />
                Deskripsi
              </FormLabel>
              <FormControl>
                <Input placeholder="Keterangan singkat..." {...field} />
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
            {initialData ? "Simpan Perubahan" : "Simpan Kategori"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
