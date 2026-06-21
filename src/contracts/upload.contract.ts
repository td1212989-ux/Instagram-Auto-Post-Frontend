// Upload contracts.
import type { Post, PostType } from "./post.contract";

/** Per-file metadata included alongside multipart files. */
export interface UploadItemPayload {
  title: string;
  caption: string;
  type: PostType;
}

/**
 * POST /api/posts/upload — sent as multipart/form-data:
 *   - files: File[]               (one or more image/video files)
 *   - posts: string (JSON)        (UploadItemPayload[] matching files[] by index)
 */
export interface UploadPayload {
  files: File[];
  posts: UploadItemPayload[];
}

export interface UploadResponse {
  ok: true;
  count: number;
  created: Post[];
}

export interface UploadRejectedFile {
  filename: string;
  reason: string;
}

export interface UploadValidationError {
  ok: false;
  message: string;
  rejected: UploadRejectedFile[];
}
