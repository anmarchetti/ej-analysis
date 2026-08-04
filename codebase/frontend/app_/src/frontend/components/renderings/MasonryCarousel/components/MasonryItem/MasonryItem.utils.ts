import { getUrlFromName } from 'frontend/utils/route.utils';
import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

export const createMasonryItemHref = (
    currentPath: string,
    item: IDestinationWithPrice,
    isVirtualPage: boolean,
): string => {
    if (!currentPath) {
        return '';
    }

    let formattedPath = currentPath;

    // remove the virtual segment from the end of the URL
    if (isVirtualPage) {
        const pathSegments = currentPath.split('/').filter(Boolean);

        pathSegments.pop();

        formattedPath = '/' + pathSegments.join('/');
    }

    return formattedPath + (formattedPath.endsWith('/') ? '' : '/') + getUrlFromName(item.displayName);
};
