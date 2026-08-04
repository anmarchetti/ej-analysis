import sanitize from 'sanitize-html';

export const isEmptyHtmlContent = (value: string) => !sanitize(value, { allowedTags: [] }).trim().length;
