import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import { createMasonryItemHref } from './MasonryItem.utils';

describe('MasonryItem.utils', () => {
    let currentPath;
    let item;
    let isVirtualPage;

    beforeEach(() => {
        currentPath = '/destinations/italy';
        item = {
            displayName: 'Spain',
        } as IDestinationWithPrice;
        isVirtualPage = false;
    });

    describe('createMasonryItemHref', () => {
        it('should return empty string when currentPath is not set', () => {
            currentPath = '';
            const res = createMasonryItemHref(currentPath, item, isVirtualPage);

            expect(res).toBe('');
        });

        it('should build href from currentPath and item displayName', () => {
            currentPath = '/destinations';

            const res = createMasonryItemHref(currentPath, item, isVirtualPage);

            expect(res).toBe('/destinations/spain');
        });

        it('should not add duplicate slash when currentPath already ends with slash', () => {
            currentPath = '/destinations/';

            const res = createMasonryItemHref(currentPath, item, isVirtualPage);

            expect(res).toBe('/destinations/spain');
        });

        it('should remove last path segment on virtual region browse page', () => {
            isVirtualPage = true;
            item.displayName = 'Venice';

            const res = createMasonryItemHref(currentPath, item, isVirtualPage);

            expect(res).toBe('/destinations/venice');
        });

        it('should remove last path segment on virtual resort browse page', () => {
            isVirtualPage = true;
            item.displayName = 'Venice';

            const res = createMasonryItemHref(currentPath, item, isVirtualPage);

            expect(res).toBe('/destinations/venice');
        });
    });
});
