import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Moon, Clock } from "lucide-react";
import { mockPending, mockStats } from "@/lib/mock-data";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function TopNav() {
  const qc = useQueryClient();

  // Safe fallbacks so the UI never crashes even if mock-data
  // exports are missing, renamed, or temporarily undefined.
  const pendingCount = mockPending?.length ?? 0;
  const postedCount = mockStats?.postedSuccessfully ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/60 px-3 backdrop-blur-xl md:px-6">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 text-sm">
        <span className="font-display font-semibold gradient-text">Instagram Auto Poster</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5">
          <Clock className="h-3 w-3" />
          Today: 10:00 AM
        </Badge>
        <Badge className="hidden sm:inline-flex gap-1.5 bg-[image:var(--gradient-primary)] text-primary-foreground">
          Queue: {pendingCount}
        </Badge>
        <Badge variant="outline" className="hidden md:inline-flex">
          Posted: {postedCount}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            qc.invalidateQueries();
            toast.success("Refreshed");
          }}
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Theme">
          <Moon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}