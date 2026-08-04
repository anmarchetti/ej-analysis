export const addLeadingZero = (value: number): string => {
    let result = value.toString();

    while (result.length < 2) {
        result = '0' + result;
    }

    return result;
};
