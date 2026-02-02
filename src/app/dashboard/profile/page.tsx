"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Camera,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { getCurrentUser, setAuthSession } from "@/lib/supabase/auth";
import {
  changeUserPassword,
  updateProfile,
} from "@/lib/api/profiles";
import { uploadFile } from "@/lib/api/storage";
import { toast } from "sonner";
import { Profile } from "@/lib/types";

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Password lama wajib diisi"),
    new_password: z.string().min(6, "Password baru minimal 6 karakter"),
    confirm_password: z
      .string()
      .min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<Profile>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser as Profile);
    setLoading(false);
  }, []);

  const handlePasswordChange = async (values: PasswordFormValues) => {
    if (!user) return;
    try {
      await changeUserPassword(user.id, values.new_password, values.old_password);

      toast.success("Password berhasil diubah!");
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const publicUrl = await uploadFile("media", filePath, file);

      // Update profile in DB
      await updateProfile(user.id, { foto_profil: publicUrl }, user.id);

      // Update local session
      const updatedUser = { ...user, foto_profil: publicUrl };
      setAuthSession(updatedUser);
      setUser(updatedUser);
      toast.success("Foto profil berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah foto profil");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse">Memuat Profil...</div>
    );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
              <AvatarImage src={user?.foto_profil || ""} />
              <AvatarFallback className="text-2xl font-black bg-blue-600 text-white">
                {user?.nama_lengkap?.[0]}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">
              {user?.nama_lengkap}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-blue-100 text-blue-700 border-none px-3 font-bold uppercase tracking-wider text-[10px]">
                {user?.role}
              </Badge>
              <span className="text-muted-foreground text-sm font-medium">
                @{user?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Account Information */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-6 border-b">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid md:grid-cols-2 gap-8">
              <InfoItem
                label="Email"
                value={user?.email || "-"}
                icon={<Mail />}
              />
              <InfoItem
                label="Nomor Telepon"
                value={user?.no_telepon || "-"}
                icon={<Phone />}
              />
              <InfoItem
                label="Username"
                value={`@${user?.username}`}
                icon={<User />}
              />
              <InfoItem
                label="Hak Akses"
                value={user?.role?.toUpperCase()}
                icon={<Shield />}
              />
            </CardContent>
          </Card>

          {/* Activities summary or stats */}
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <StatItem
                label="Status Akun"
                value="Aktif"
                icon={<CheckCircle2 />}
              />
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <Shield size={180} />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Password Change Form */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-blue-900 text-white p-6">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <KeyRound className="h-5 w-5" /> Ganti Password
              </CardTitle>
              <CardDescription className="text-blue-200">
                Perbarui keamanan akun Anda secara berkala.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handlePasswordChange)}
                  className="space-y-4 pt-2"
                >
                  <FormField
                    control={form.control}
                    name="old_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Password Lama
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="rounded-xl bg-gray-50 focus:bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Password Baru
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="rounded-xl bg-gray-50 focus:bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Konfirmasi Password Baru
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="rounded-xl bg-gray-50 focus:bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-3xl p-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-1" />
            <p className="text-xs font-medium text-yellow-800 leading-relaxed">
              Gunakan password yang kuat (minimal 6 karakter) dengan kombinasi
              huruf dan angka untuk keamanan maksimal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string | undefined;
  icon: ReactNode;
}

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
        {icon ? <span className="text-blue-500">{icon}</span> : null}
        {label}
      </div>
      <p className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">
        {value}
      </p>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 opacity-60">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
