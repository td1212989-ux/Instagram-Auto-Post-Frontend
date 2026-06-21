// Reusable, UI-only types. Domain types live in src/contracts/*.

import type { LucideIcon } from "lucide-react";

export type AccentTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

export interface IconRef {
  Icon: LucideIcon;
}

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;

export type QueryKey = readonly (string | number)[];
