export const debounce = (func: (...args: any[]) => void, wait = 100): ((...args: any[]) => void) => {
    let timeout: any;

    return function (...args: any[]) {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            // @ts-ignore
            func.apply(this, args);
        }, wait);
    };
};
