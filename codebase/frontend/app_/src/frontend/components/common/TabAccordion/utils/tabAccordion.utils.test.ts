import {
    mockSitecoreItems,
    tabAccordionItems,
} from 'frontend/components/common/TabAccordion/__mocks__/tabAccordionItems';
import { mockFAQItems, mockFaqTabItems } from 'frontend/components/renderings/Help/__mocks__/mockFAQItems';

import { getFaqTabItems, getTabItems } from './tabAccordion.utils';

describe('tabAccordion.utils', () => {
    describe('getTabItems', () => {
        it('Should convert sitecore item to tab accordion items', () => {
            const result = getTabItems(mockSitecoreItems);

            expect(result).toStrictEqual(tabAccordionItems);
        });
    });

    describe('getTabItems', () => {
        it('Should convert sitecore item to tab accordion items', () => {
            const result = getFaqTabItems(mockFAQItems);

            expect(result).toStrictEqual(mockFaqTabItems);
        });
    });
});
