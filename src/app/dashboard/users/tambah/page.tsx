"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm, UserFormValues } from "@/components/users/user-form";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function TambahUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: UserFormValues) => {
    setLoading(true);
    try {
      // Create new user using RPC
      const { data: rpcRes, error: rpcError } = await supabase.rpc("create_user_with_username", {
        p_username: values.username,
        p_password: values.password || "user123",
        p_nama_lengkap: values.nama_lengkap,
        p_role: values.role,
        p_email: values.email || null,
        p_no_telepon: values.no_telepon || null
      });

      if (rpcError || !rpcRes.success) {
        throw new Error(rpcRes?.error || rpcError?.message || "Gagal menambahkan user");
      }

      toast.success("User berhasil ditambahkan");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan user");
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
          <h1 className="text-2xl font-bold tracking-tight">Tambah User</h1>
          <p className="text-muted-foreground text-sm">
            Buat akun pengguna baru dalam sistem.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Formulir User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
