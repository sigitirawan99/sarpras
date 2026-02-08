"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm, UserFormValues } from "@/components/users/user-form";
import { toast } from "sonner";
import { signUpWithUsername } from "@/lib/api/profiles";
import { getCurrentUser } from "@/lib/supabase/auth";

export default function TambahUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: UserFormValues) => {
    const user = getCurrentUser();
    setLoading(true);
    try {
      await signUpWithUsername(
        {
          username: values.username,
          password: values.password,
          nama_lengkap: values.nama_lengkap,
          role: values.role,
          email: values.email,
          no_telepon: values.no_telepon,
        },
        user?.id,
      );

      toast.success("User berhasil ditambahkan");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan user",
      );
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
            Tambah User
          </h1>
          <p className="text-muted-foreground text-sm">
            Buat akun pengguna baru dalam sistem.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Formulir User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
