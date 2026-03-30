// ============================================================================
// Blog Types — matches NestJS backend /blog/*
// ============================================================================

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  author?: string;
  publishedAt?: string;
  categoryName?: string;
  tags: string[];
  readTime: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}
