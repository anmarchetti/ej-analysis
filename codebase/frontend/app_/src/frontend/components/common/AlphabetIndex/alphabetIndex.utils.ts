import { IAlphabeticAnchor } from './IAlphabeticAnchor';

export const buildAlphabeticAnchors = <T>(
    items: T[],
    nameKey: keyof T,
    getAnchorId: (item: T, letter: string) => string,
): IAlphabeticAnchor<T>[] => {
    const anchorsByLetter: Record<string, IAlphabeticAnchor<T>> = {};

    items.forEach(item => {
        const name = item[nameKey];
        const letter = typeof name === 'string' ? name.charAt(0).toUpperCase() : null;

        if (letter) {
            anchorsByLetter[letter] = anchorsByLetter[letter] || {
                letter,
                id: getAnchorId(item, letter),
                items: [],
            };
            anchorsByLetter[letter].items.push(item);
        }
    });

    return Object.values(anchorsByLetter);
};
