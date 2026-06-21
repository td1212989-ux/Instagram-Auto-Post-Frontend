import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { PostsService } from "@/services/api";

/**
 * =========================
 * TYPES
 * =========================
 */
type LocalFile = {
  file: File;
  title: string;
  caption: string;
};

type UploadResponse = {
  count: number;
};

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

/**
 * =========================
 * PAGE
 * =========================
 */
function UploadPage() {
  const qc = useQueryClient();
  const [files, setFiles] = useState<LocalFile[]>([]);

  /**
   * =========================
   * FILE SELECT
   * =========================
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    const mapped: LocalFile[] = selected.map((f) => ({
      file: f,
      title: "",
      caption: "",
    }));

    setFiles((prev) => [...prev, ...mapped]);
  };

  /**
   * =========================
   * REMOVE FILE
   * =========================
   */
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * =========================
   * VALIDATION
   * =========================
   */
  const isValid = () => {
    return (
      files.length > 0 &&
      files.every(
        (f) => f.title.trim().length > 0 && f.caption.trim().length > 0
      )
    );
  };

  /**
   * =========================
   * UPLOAD MUTATION
   * =========================
   */
  const uploadM = useMutation({
    mutationFn: async (): Promise<UploadResponse> => {
      if (!isValid()) {
        throw new Error("Title & Caption required");
      }

      const formData = new FormData();

      const postsPayload = files.map((f) => ({
        title: f.title.trim(),
        caption: f.caption.trim(),
        type: f.file.type.startsWith("video") ? "reel" : "image",
      }));

      files.forEach((f) => {
        formData.append("files", f.file);
      });

      formData.append("posts", JSON.stringify(postsPayload));

      const res = await PostsService.upload(formData);

      return res as UploadResponse;
    },

    onSuccess: (res: UploadResponse) => {
      const count = res?.count ?? 0;

      toast.success(`Uploaded ${count} posts 🚀`);

      setFiles([]);

      qc.invalidateQueries({ queryKey: ["pending"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },

    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Upload failed ❌";

      toast.error(message);
    },
  });

  /**
   * =========================
   * UI
   * =========================
   */
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Upload Posts</h1>

      {/* FILE INPUT */}
      <Card>
        <CardContent className="p-4">
          <label className="flex cursor-pointer items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            <span>Select Images / Videos</span>

            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <div className="space-y-3">
        {files.map((f, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{f.file.name}</p>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeFile(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Input
                placeholder="Title"
                value={f.title}
                onChange={(e) =>
                  setFiles((prev) =>
                    prev.map((item, idx) =>
                      idx === i
                        ? { ...item, title: e.target.value }
                        : item
                    )
                  )
                }
              />

              <Textarea
                placeholder="Caption"
                value={f.caption}
                onChange={(e) =>
                  setFiles((prev) =>
                    prev.map((item, idx) =>
                      idx === i
                        ? { ...item, caption: e.target.value }
                        : item
                    )
                  )
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* UPLOAD BUTTON */}
      {files.length > 0 && (
        <Button
          onClick={() => uploadM.mutate()}
          disabled={uploadM.isPending || !isValid()}
          className="w-full"
        >
          {uploadM.isPending ? "Uploading..." : "Upload to Queue"}
        </Button>
      )}
    </div>
  );
}