import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Home,
  List,
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

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: Home,
  },
  {
    title: "Manajemen User",
    url: "#",
    icon: Users,
  },
  {
    title: "Kategori",
    url: "#",
    icon: List,
  },
  {
    title: "Sarpras",
    url: "#",
    icon: Package,
  },
  {
    title: "Peminjaman",
    url: "#",
    icon: ClipboardList,
  },
  {
    title: "Pengembalian",
    url: "#",
    icon: RotateCcw,
  },
  {
    title: "Pengaduan",
    url: "#",
    icon: AlertTriangle,
  },
  {
    title: "Laporan Asset Health",
    url: "#",
    icon: BarChart3,
  },
  {
    title: "Activity Log",
    url: "#",
    icon: Activity,
  },
];

const user = {
  name: "Admin",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-center my-4">
            <h1 className="text-2xl font-extrabold">Admin Panel</h1>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
