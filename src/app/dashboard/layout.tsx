"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthRoleGuard } from "@/components/auth-role-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRoleGuard>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthRoleGuard>
  );
}
