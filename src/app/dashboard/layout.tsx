import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getUser } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { push } = useRouter();
  const user = getUser();
  if (!user) {
    push("/sign-in");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-5">{children}</main>
    </SidebarProvider>
  );
}
