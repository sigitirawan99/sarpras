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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile } from "@/lib/types";
import {
  User,
  Lock,
  BadgeCheck,
  Briefcase,
  ShieldCheck,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

const userSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  nama_lengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  role: z.enum(["admin", "petugas", "pengguna"]),
  email: z
    .string()
    .email("Email tidak valid")
    .nullable()
    .optional()
    .or(z.literal("")),
  no_telepon: z.string().nullable().optional().or(z.literal("")),
  is_active: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Profile;
  onSubmit: (values: UserFormValues) => Promise<void>;
  loading?: boolean;
}

export function UserForm({
  initialData,
  onSubmit,
  loading = false,
}: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: initialData?.username || "",
      password: "",
      nama_lengkap: initialData?.nama_lengkap || "",
      role: initialData?.role || "pengguna",
      email: initialData?.email || "",
      no_telepon: initialData?.no_telepon || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Username
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-500" />
                  {initialData
                    ? "Ganti Password (Kosongkan jika tidak diubah)"
                    : "Password"}
                </FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nama_lengkap"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-blue-500" />
                Nama Lengkap
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nama Sesuai KTP/Kartu Pelajar" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Role
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="petugas">Petugas</SelectItem>
                    <SelectItem value="pengguna">Pengguna</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  Status Akun
                </FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Nonaktif</SelectItem>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email
                </FormLabel>
                <FormControl>
                  <Input type="email" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="no_telepon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  No. Telepon
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-md font-semibold transition-all shadow-md active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {initialData ? "Simpan Perubahan" : "Simpan User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
