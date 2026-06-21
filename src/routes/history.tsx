// src/routes/history.tsx

import { createFileRoute } from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PostsService } from "@/services/api";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

import type { Post } from "@/services/api";

/**
 * =========================
 * ROUTE
 * =========================
 */
export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [{ title: "History — Instagram Auto Poster" }],
  }),
  component: HistoryPage,
});

const PAGE_SIZE = 10;

/**
 * =========================
 * PAGE
 * =========================
 */
function HistoryPage() {
  const qc = useQueryClient();

  const { data: historyRaw = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: PostsService.history,
  });

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  /**
   * =========================
   * SAFE NORMALIZATION
   * =========================
   */
  const posts = useMemo(() => {
    if (Array.isArray(historyRaw)) return historyRaw;
    if ((historyRaw as any)?.data && Array.isArray((historyRaw as any).data))
      return (historyRaw as any).data;
    if ((historyRaw as any)?.items && Array.isArray((historyRaw as any).items))
      return (historyRaw as any).items;
    return [];
  }, [historyRaw]);

  /**
   * =========================
   * SEARCH FILTER
   * =========================
   */
  const filtered = useMemo(() => {
    return posts.filter((p: any) => {
      if (!q) return true;
      return (
        p.title?.toLowerCase().includes(q.toLowerCase()) ||
        p.caption?.toLowerCase().includes(q.toLowerCase())
      );
    });
  }, [posts, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /**
   * =========================
   * DELETE MUTATION
   * =========================
   */
  const removeM = useMutation({
    mutationFn: (id: string) => PostsService.remove(id),
    onSuccess: () => {
      toast.success("Removed from history");

      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="History"
        description="Posts that have been published or attempted."
      />

      <Card className="glass">
        <CardContent className="p-4">
          {/* SEARCH */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search history…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* LOADING */}
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : pageItems.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No history yet"
              description="Once posts go live, they'll show up here."
            />
          ) : (
            <>
              {/* TABLE */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Preview</TableHead>
                      <TableHead>Title & Caption</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pageItems.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <img
                            src={p.thumbnail}
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {p.caption}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              p.type === "reel"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {p.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {p.postedAt
                            ? new Date(p.postedAt).toLocaleString()
                            : "—"}
                        </TableCell>

                        <TableCell>
                          {p.status === "posted" ? (
                            <Badge className="bg-success/20 text-success">
                              Posted
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/20 text-destructive">
                              Failed
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setToDelete(p)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="px-3 text-sm">
                    {page} / {totalPages}
                  </span>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this entry?
            </AlertDialogTitle>

            <AlertDialogDescription>
              "{toDelete?.title}" will be removed from history.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (toDelete) {
                  removeM.mutate(toDelete.id);
                  setToDelete(null);
                }
              }}
              className="bg-destructive text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}