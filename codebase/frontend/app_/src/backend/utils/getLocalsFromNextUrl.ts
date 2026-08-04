import qs from 'qs';

import { TSitecoreLangs } from 'code/cmsLang';
import { TResponseLocals } from 'lib/page-props';

/** Get local variables such as basePath, path and lang from next url
 * e.g. _next/data/holidays-lcrnko7i/en/holidays/spain.json?path=en&path=holidays&path=spain
 */
export const getLocalsFromNextUrl = (url: string, routes: string[]): TResponseLocals => {
    const pathsObj = qs.parse(url.split('?')[1]);

    // ensure that we have an array of string in path
    if (
        !(
            pathsObj?.path &&
            Array.isArray(pathsObj.path) &&
            pathsObj.path.length &&
            typeof pathsObj.path[0] === 'string'
        )
    ) {
        return {};
    }

    const wholePath = `/${pathsObj.path.join('/')}`.toLowerCase();

    for (const route of routes) {
        // get basePath dynamically according to routes constant
        const routeRegex = new RegExp(route);
        const match = wholePath.match(routeRegex);

        if (!match) {
            continue;
        }

        const basePath = match[0];
        const path = wholePath.replace(basePath, '');

        return {
            basePath: basePath,
            path: path || '/',
            lang: pathsObj.path?.[0].toLowerCase() as TSitecoreLangs,
        };
    }

    return {};
};
