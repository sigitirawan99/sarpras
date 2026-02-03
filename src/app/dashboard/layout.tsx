"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthRoleGuard } from "@/components/auth-role-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRoleGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 p-5">{children}</main>
      </SidebarProvider>
    </AuthRoleGuard>
  );
}
