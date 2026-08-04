import { purifyUrl } from './url.utils';

export function getParsedPath(path: string) {
    const purifiedURL = purifyUrl(path);
    const pathParts = purifiedURL ? purifiedURL.split('/').filter(Boolean) : [];

    return pathParts.map((part, index) => ({
        label: part
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
        path: [''].concat(pathParts.slice(0, index + 1)).join('/'),
    }));
}
