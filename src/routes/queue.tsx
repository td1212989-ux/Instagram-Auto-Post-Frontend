import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Zap } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { PostsService } from "@/services/api";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * =========================
 * LOCAL BACKEND TYPE (NO MOCK FILE)
 * =========================
 */
type Post = {
  id: string;
  title: string;
  caption: string;
  type: "image" | "reel";
};

export const Route = createFileRoute("/queue")({
  component: QueuePage,
});

const PAGE_SIZE = 8;

function QueuePage() {
  const qc = useQueryClient();

  /**
   * =========================
   * FETCH POSTS (SAFE)
   * =========================
   */
  const { data: postsRaw, isLoading } = useQuery({
    queryKey: ["pending"],
    queryFn: PostsService.pending,
  });

  const posts: Post[] = Array.isArray(postsRaw) ? postsRaw : [];

  /**
   * =========================
   * STATE
   * =========================
   */
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "image" | "reel">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Post | null>(null);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  /**
   * =========================
   * FILTER LOGIC
   * =========================
   */
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.caption.toLowerCase().includes(q.toLowerCase());

      const matchType = type === "all" || p.type === type;
      return matchQ && matchType;
    });
  }, [posts, q, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /**
   * =========================
   * DELETE
   * =========================
   */
  const removeM = useMutation({
    mutationFn: (id: string) => PostsService.remove(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["pending"] });

      const prev = qc.getQueryData<Post[]>(["pending"]) ?? [];

      qc.setQueryData(
        ["pending"],
        prev.filter((p) => p.id !== id)
      );

      return { prev };
    },

    onError: (_err, _id, ctx: any) => {
      qc.setQueryData(["pending"], ctx?.prev ?? []);
      toast.error("Delete failed");
    },

    onSuccess: () => toast.success("Deleted successfully"),

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["pending"] });
    },
  });

  /**
   * =========================
   * UPDATE
   * =========================
   */
  const updateM = useMutation({
    mutationFn: (p: Post) =>
      PostsService.update(p.id, {
        title: p.title,
        caption: p.caption,
      }),

    onSuccess: () => {
      toast.success("Updated successfully");
      qc.invalidateQueries({ queryKey: ["pending"] });
      setEditing(null);
    },

    onError: () => toast.error("Update failed"),
  });

  /**
   * =========================
   * POST NOW
   * =========================
   */
  const postNowM = useMutation({
    mutationFn: (id: string) => PostsService.postNow(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["pending"] });

      const prev = qc.getQueryData<Post[]>(["pending"]) ?? [];

      qc.setQueryData(
        ["pending"],
        prev.filter((p) => p.id !== id)
      );

      return { prev };
    },

    onError: (_err, _id, ctx: any) => {
      qc.setQueryData(["pending"], ctx?.prev ?? []);
      toast.error("Post failed");
    },

    onSuccess: () => {
      toast.success("Posted successfully 🚀");
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });

  return (
    <div>
      <PageHeader title="Queue" description="Manage upcoming posts" />

      <Card>
        <CardContent className="p-4">

          {/* SEARCH */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />

            <Select
              value={type}
              onValueChange={(v: "all" | "image" | "reel") => {
                setType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TABLE */}
          {isLoading ? (
            <p>Loading...</p>
          ) : pageItems.length === 0 ? (
            <EmptyState title="No posts" description="Upload first post" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageItems.map((p, idx) => (
                  <TableRow key={(p as any)._id ?? p.id ?? idx}>
                    <TableCell>{p.title}</TableCell>

                    <TableCell>
                      <Badge>{p.type}</Badge>
                    </TableCell>

                    <TableCell className="flex gap-2">
                      <Button size="icon" onClick={() => postNowM.mutate(p.id)}>
                        <Zap />
                      </Button>

                      <Button size="icon" onClick={() => setEditing(p)}>
                        <Pencil />
                      </Button>

                      <Button size="icon" onClick={() => setToDelete(p)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>

          {editing && (
            <>
              <Input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />

              <Textarea
                value={editing.caption}
                onChange={(e) =>
                  setEditing({ ...editing, caption: e.target.value })
                }
              />
            </>
          )}

          <DialogFooter>
            <Button onClick={() => editing && updateM.mutate(editing)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && removeM.mutate(toDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}