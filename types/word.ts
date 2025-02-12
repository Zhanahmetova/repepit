import type { User } from "./user";

export interface Word {
    id: number;
    title: string;
    description: string;
    pronunciation: string;
    createdAt: string;
    updatedAt: string;
    documentId: string;
    favorites: Favorite[];
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
    user_id?: User;
    word_id?: Word;
}