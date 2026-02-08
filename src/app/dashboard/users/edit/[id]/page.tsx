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
import {
  getProfileById,
  updateProfile,
  changeUserPassword,
} from "@/lib/api/profiles";
import { getCurrentUser } from "@/lib/supabase/auth";

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
        const profile = await getProfileById(id);
        setData(profile);
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
    const currentUser = getCurrentUser();
    setLoading(true);
    try {
      // Update profile
      await updateProfile(
        id,
        {
          nama_lengkap: values.nama_lengkap,
          username: values.username,
          role: values.role,
          email: values.email || null,
          no_telepon: values.no_telepon || null,
          is_active: values.is_active,
        },
        currentUser?.id,
      );

      // Update password if provided
      if (values.password) {
        await changeUserPassword(id, values.password);
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
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit User
          </h1>
          <p className="text-muted-foreground text-sm">
            Ubah informasi akun pengguna.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Formulir User</CardTitle>
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
