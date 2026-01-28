"use client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Clock,
  Home,
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
    {
      title: "Riwayat Aktivitas",
      url: "/dashboard/activity-log",
      icon: Activity,
    },
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
          <SidebarGroupLabel className="flex justify-center my-4">
            <h1 className="text-2xl font-extrabold">SARPRAS</h1>
          </SidebarGroupLabel>
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
