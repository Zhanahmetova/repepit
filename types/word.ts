export interface Word {
    id: number;
    title: string;
    description: string;
    pronunciation: string;
    createdAt: string;
    updatedAt: string;
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
