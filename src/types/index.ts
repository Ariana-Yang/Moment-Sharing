export interface MemoryWithPhotos {
  id: string;
  date: string;
  note: string;
  photos: Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
    url?: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface ImageWithUrl {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
  url: string;
  publicUrl?: string; // Supabase存储的公共URL
  thumbnailUrl?: string; // 缩略图URL
}