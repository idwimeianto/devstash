import { AiAccessProvider } from "@/components/ai/AiAccessProvider";
import { EditorPreferencesProvider } from "@/components/code/EditorPreferencesProvider";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { CommandPaletteProvider } from "@/components/search/CommandPaletteProvider";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionCanUseAi } from "@/lib/ai-access";
import { getSessionEditorPreferences } from "@/lib/db/users";

// Shared shell for the signed-in app pages (dashboard, items).
// The drawer provider wraps the top bar too, so the command palette can open items.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider className="flex-col [--header-height:calc(--spacing(14))]">
      {/* Not awaited: only the code editors read it, and they mount after the page loads. */}
      <EditorPreferencesProvider preferencesPromise={getSessionEditorPreferences()}>
        {/* Not awaited either: only the item forms' AI buttons read it. */}
        <AiAccessProvider canUseAiPromise={getSessionCanUseAi()}>
          <ItemDrawerProvider>
            <CommandPaletteProvider>
              <TopBar />
              <div className="flex flex-1">
                <AppSidebar />
                {/* min-w-0: a flex item otherwise grows to its content's min width and scrolls the page sideways. */}
                <SidebarInset className="min-w-0 p-6">{children}</SidebarInset>
              </div>
              <GlobalSearch />
            </CommandPaletteProvider>
          </ItemDrawerProvider>
        </AiAccessProvider>
      </EditorPreferencesProvider>
    </SidebarProvider>
  );
}
