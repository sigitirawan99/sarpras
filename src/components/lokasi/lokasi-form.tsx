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
import { Lokasi } from "@/lib/types";
import { Loader2 } from "lucide-react";

const lokasiSchema = z.object({
  nama_lokasi: z.string().min(2, "Nama lokasi minimal 2 karakter"),
  lantai: z.string().optional(),
  keterangan: z.string().optional(),
});

export type LokasiFormValues = z.infer<typeof lokasiSchema>;

interface LokasiFormProps {
  initialData?: Lokasi;
  onSubmit: (values: LokasiFormValues) => Promise<void>;
  loading?: boolean;
}

export function LokasiForm({
  initialData,
  onSubmit,
  loading = false,
}: LokasiFormProps) {
  const form = useForm<LokasiFormValues>({
    resolver: zodResolver(lokasiSchema),
    defaultValues: {
      nama_lokasi: initialData?.nama_lokasi || "",
      lantai: initialData?.lantai || "",
      keterangan: initialData?.keterangan || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nama_lokasi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lokasi / Ruangan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Lab Komputer 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lantai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lantai</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 1, 2, atau Basement" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keterangan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan</FormLabel>
              <FormControl>
                <Input placeholder="Keterangan tambahan..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initialData ? "Simpan Perubahan" : "Simpan Lokasi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
