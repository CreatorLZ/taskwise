import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewTaskModal } from "./ui/newTask";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./sidebar";
import type React from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-space-grotesk relative min-h-screen">
      <SidebarProvider defaultOpen={false}>
        <DashboardSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>

      <div className="fixed bottom-6 right-6 z-50">
        <NewTaskModal
          trigger={
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Create New Task</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}
