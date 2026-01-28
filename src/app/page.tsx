"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-blue-600 text-white font-black text-2xl animate-pulse">
      MENGALIHKAN...
    </div>
  );
}
