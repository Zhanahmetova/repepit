import type { User } from "./user";

export interface AlternativeTranslation {
  id: number;
  text: string;
}

export interface Word {
  id: number;
  title: string;
  description: string;
  pronunciation: string;
  createdAt: string;
  updatedAt: string;
  documentId: string;
  favorites: Favorite[];
  translation: string;
  alternative_translations?: AlternativeTranslation[];
  publishedAt: string;

  // Значения по умолчанию для слов, которых нет в избранном
  ease_factor?: number;
  interval?: number;
  repetition?: number;
  next_review?: string;
  is_learned?: boolean;
}

export interface TResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface Favorite {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  user?: User;
  word?: Word;
  ease_factor?: number;
  interval?: number;
  repetition?: number;
  next_review?: string;
  is_learned?: boolean;
}
