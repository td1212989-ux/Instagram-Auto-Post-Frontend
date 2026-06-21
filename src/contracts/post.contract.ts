export type PostType = "image" | "reel";

export type PostStatus =
  | "pending"
  | "posted"
  | "failed"
  | "scheduled";

export interface CloudinaryFile {
  publicId: string;
  secureUrl: string;
  resourceType: string;
}

export interface Post {
  id: string; // always frontend-safe id
  _id?: string; // optional backend fallback

  title: string;
  caption: string;
  type: "image" | "reel";
  status: "pending" | "posted" | "failed" | "scheduled";

  thumbnail: string;
  createdAt: string;

  scheduledFor?: string;
  postedAt?: string;
  position?: number;
  sizeMb?: number;
}

// Pending
export type GetPendingPostsRequest = void;
export type GetPendingPostsResponse = Post[];

// History
export type GetHistoryPostsRequest = void;
export type GetHistoryPostsResponse = Post[];

// Single
export interface GetPostRequest {
  id: string;
}

export type GetPostResponse = Post;

// Update
export interface UpdatePostRequest {
  id: string;
  title?: string;
  caption?: string;
  scheduledFor?: string;
  position?: number;
}

export type UpdatePostResponse = Post;

// Delete
export interface DeletePostRequest {
  id: string;
}

export interface DeletePostResponse {
  success: boolean;
  message: string;
}

// Post Now
export interface PostNowRequest {
  id: string;
}

export interface PostNowResponse {
  success: boolean;
  message: string;
  data: Post;
}