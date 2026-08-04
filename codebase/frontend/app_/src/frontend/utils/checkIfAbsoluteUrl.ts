const ABSOLUTE_URL_REGEX =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm;

/**
 * Check if url is absolute.
 * @param url url yo check
 */
export const checkIfAbsoluteUrl = (url: string): Nullable<RegExpMatchArray> => url.match(ABSOLUTE_URL_REGEX);
