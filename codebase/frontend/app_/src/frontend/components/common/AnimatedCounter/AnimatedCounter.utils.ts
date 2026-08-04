export const getDigits = (number: number): { id: number; value: number }[] =>
    parseFloat(Math.max(number, 0).toString())
        .toFixed(0)
        .split('')
        .reverse()
        .map((i, index) => ({ value: +i, id: index }));
