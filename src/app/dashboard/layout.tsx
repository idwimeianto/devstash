import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <SidebarProvider className="flex-col [--header-height:calc(--spacing(14))]">
      <TopBar />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset className="p-6">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
