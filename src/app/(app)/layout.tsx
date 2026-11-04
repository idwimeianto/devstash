import { EditorPreferencesProvider } from "@/components/code/EditorPreferencesProvider";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { CommandPaletteProvider } from "@/components/search/CommandPaletteProvider";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionEditorPreferences } from "@/lib/db/users";

// Shared shell for the signed-in app pages (dashboard, items).
// The drawer provider wraps the top bar too, so the command palette can open items.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider className="flex-col [--header-height:calc(--spacing(14))]">
      {/* Not awaited: only the code editors read it, and they mount after the page loads. */}
      <EditorPreferencesProvider preferencesPromise={getSessionEditorPreferences()}>
        <ItemDrawerProvider>
          <CommandPaletteProvider>
            <TopBar />
            <div className="flex flex-1">
              <AppSidebar />
              <SidebarInset className="p-6">{children}</SidebarInset>
            </div>
            <GlobalSearch />
          </CommandPaletteProvider>
        </ItemDrawerProvider>
      </EditorPreferencesProvider>
    </SidebarProvider>
  );
}
