"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm, UserFormValues } from "@/components/users/user-form";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { toast } from "sonner";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setData(profile as Profile);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data user");
        router.push("/dashboard/users");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (values: UserFormValues) => {
    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nama_lengkap: values.nama_lengkap,
          role: values.role,
          email: values.email || null,
          no_telepon: values.no_telepon || null,
          is_active: values.is_active,
        })
        .eq("id", id);

      if (profileError) throw profileError;

      // Update password if provided
      if (values.password) {
        // Based on existing logic in users/page.tsx
        const { error: rpcError } = await supabase.rpc("change_user_password", {
          p_profile_id: id,
          p_new_password: values.password,
          p_old_password: "admin", // Existing logic had this hardcoded limit/placeholder
        });
        if (rpcError) throw rpcError;
      }

      toast.success("User berhasil diperbarui");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui user",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

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
          <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground text-sm">
            Ubah informasi akun pengguna.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Formulir User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            initialData={data}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
