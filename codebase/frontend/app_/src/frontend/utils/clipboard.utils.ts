export const copyToClipboard = (text: string): Promise<string> =>
    new Promise((resolve, reject) => {
        if (!('clipboard' in navigator)) {
            return reject(new Error('Clipboard not supported'));
        }

        navigator.clipboard.writeText(text).then(
            () => resolve(text),
            error => reject(error),
        );
    });
