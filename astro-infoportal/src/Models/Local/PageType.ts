export const PageType = {
    OVERVIEW: 'overview',
    OTHER: 'other',
};

export type CurrentPage = typeof PageType[keyof typeof PageType];
