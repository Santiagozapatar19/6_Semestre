export interface ThreadInput {
    title: string;
    content: string;
    boardId: string; // id of the board the thread belongs to
    replies?: string[];
}


export interface ThreadInputUpdate {
    title?: string;
    content?: string;
    replies?: string[];
}