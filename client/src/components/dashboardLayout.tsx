import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <DashboardSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
