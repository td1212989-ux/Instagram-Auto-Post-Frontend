import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive" | "accent";
  index?: number;
}

const accentMap = {
  primary: "from-primary/30 to-transparent text-primary",
  success: "from-success/30 to-transparent text-success",
  warning: "from-warning/30 to-transparent text-warning",
  destructive: "from-destructive/30 to-transparent text-destructive",
  accent: "from-accent/30 to-transparent text-accent",
};

export function StatCard({ label, value, icon: Icon, hint, accent = "primary", index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="glass relative overflow-hidden">
        <div className={cn("pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-60 blur-2xl", accentMap[accent])} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
            <div className={cn("grid h-9 w-9 place-items-center rounded-xl border border-border/60", accentMap[accent])}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
