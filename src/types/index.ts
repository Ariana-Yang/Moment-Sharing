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
  publicUrl?: string; // Supabase存储的预览图URL
  originalPublicUrl?: string; // Supabase存储的原图URL
  thumbnailUrl?: string; // 缩略图URL
}