export const getSplitText = (text: string): string[] => {
    if (!text) return ['', ''];

    const arr = text.split(' ');

    return [arr.slice(0, -1).join(' ') + ' ', arr[arr.length - 1]];
};
