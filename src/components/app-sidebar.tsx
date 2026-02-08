"use client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Clock,
  History,
  Home,
  Layers,
  List,
  Map,
  Package,
  RotateCcw,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { getCurrentUser } from "@/lib/supabase/auth";
import Link from "next/link";

type Role = "admin" | "petugas" | "pengguna";

// Menu items.
const menuByRole = {
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Manajemen User", url: "/dashboard/users", icon: Users },
    { title: "Kategori Sarpras", url: "/dashboard/kategori", icon: List },
    { title: "Lokasi Sarpras", url: "/dashboard/lokasi", icon: Map },
    { title: "Data Sarpras", url: "/dashboard/sarpras", icon: Package },
    { title: "Peminjaman", url: "/dashboard/peminjaman", icon: ClipboardList },
    { title: "Pengembalian", url: "/dashboard/pengembalian", icon: RotateCcw },
    {
      title: "Riwayat Pengembalian",
      url: "/dashboard/riwayat-pengembalian",
      icon: History,
    },
    { title: "Pengaduan", url: "/dashboard/pengaduan", icon: AlertTriangle },
    {
      title: "Laporan Asset Health",
      url: "/dashboard/laporan/asset-health",
      icon: BarChart3,
    },
    { title: "Activity Log", url: "/dashboard/activity-log", icon: Activity },
  ],
  petugas: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Peminjaman", url: "/dashboard/peminjaman", icon: ClipboardList },
    { title: "Pengembalian", url: "/dashboard/pengembalian", icon: RotateCcw },
    { title: "Pengaduan", url: "/dashboard/pengaduan", icon: AlertTriangle },
  ],
  pengguna: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    {
      title: "Sarpras Tersedia",
      url: "/dashboard/sarpras-tersedia",
      icon: Package,
    },
    {
      title: "Peminjaman Saya",
      url: "/dashboard/peminjaman",
      icon: Clock,
    },
    {
      title: "Pengaduan Saya",
      url: "/dashboard/pengaduan",
      icon: AlertTriangle,
    },
  ],
};

export function AppSidebar() {
  const role = getCurrentUser()?.role as Role;
  const items = menuByRole[role] ?? [];
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader className="backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              SARPRAS
            </h1>
            <p className="text-xs text-gray-500 font-medium">Management System</p>
          </div>
        </div>
      </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
