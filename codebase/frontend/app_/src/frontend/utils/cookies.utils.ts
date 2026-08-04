/**
 * Get cookie value from context (both server and client)
 * @param name - cookie name
 * @param cookieHeader - optional raw cookie header string from server (for SSR)
 * @returns cookie value or empty string
 */
export const getCookieFromContext = (name: string, cookieHeader?: string): string => {
    // Use provided cookie header (server-side) or document.cookie (client-side)
    const cookieString = cookieHeader || (typeof document === 'undefined' ? '' : document.cookie) || '';

    if (!cookieString) {
        return '';
    }

    const cookies: Record<string, string> = getSplittedCookieValue(cookieString);

    return cookies[name] || '';
};

export const getCookie = (name: string): string => {
    const cookie = getSplittedCookieValue(document.cookie);

    return cookie[name] || '';
};

export const getSplittedCookieValue = (cookieValue: string): Record<string, string> => {
    const cookies: Record<string, string> = {};

    cookieValue.split(';').forEach(el => {
        if (!el.trim()) {
            return;
        }

        // Split only on the first '=' to allow '=' in cookie values
        const index = el.indexOf('=');
        const [key, value] = [el.slice(0, index).trim(), el.slice(index + 1).trim()];

        cookies[key] = value;
    });

    return cookies;
};

export function setCookie(name: string, value: string, expires?: Date): void {
    document.cookie = `${name}=${value}; path=/;${expires ? ` expires=${expires.toUTCString()}` : ''}`;
}

export function listenCookieChange(
    name: string,
    callback: (cookie: { newValue: string; oldValue: string }) => void,
    interval: number = 1000,
): () => void {
    let lastCookie = getCookie(name);

    const intervalId = setInterval(() => {
        const cookie = getCookie(name);

        if (cookie !== lastCookie) {
            try {
                callback({ oldValue: lastCookie, newValue: cookie });
            } finally {
                lastCookie = cookie;
            }
        }
    }, interval);

    return () => clearInterval(intervalId);
}
