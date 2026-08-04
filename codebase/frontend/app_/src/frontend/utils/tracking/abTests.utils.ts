import { PlaceholdersData } from '@sitecore-jss/sitecore-jss-nextjs';

import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { IABTest } from 'models/data/tracking/IABTest';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { createUniquePipedList } from './tracking.utils';

/** Get A/B tests stored in sessionStorage */
export const getStorageABTests = (): IABTest[] => {
    const storedTests = getWebStorageItem(WebStorageKeys.ABTestVariant, false, sessionStorage);

    // Tests are stored as string '100A|200B|...|'
    // Parse this string to array IABTest[]
    if (storedTests && typeof storedTests === 'string') {
        return storedTests
            .split('|')
            .map(t => {
                const match = t.match(/^(\d+)([A-Z])$/);

                return match ? { testId: match[1], testVariant: match[2] } : null;
            })
            .filter(Boolean) as IABTest[];
    }

    return [];
};

/** Find renderings with A/B tests in layout. Returns these A/B tests data (test ID and Variant) */
export const getLayoutABTests = (layout: ISitecoreLayout): IABTest[] =>
    getPlaceholderABTests(layout?.sitecore?.route?.placeholders);

/** Recursive function that find A/B tests in placeholders tree */
export const getPlaceholderABTests = (placeholders: PlaceholdersData | undefined): IABTest[] => {
    if (!placeholders) return [];

    const abTests: IABTest[] = [];

    Object.keys(placeholders).forEach(key => {
        placeholders[key].forEach(rendering => {
            // If it's ComponentRendering (has componentName), check its and children AB tests
            if ('componentName' in rendering) {
                const test = getRenderingABTest(rendering);
                test && abTests.push(test);

                // Recursive find A/B Tests in children placeholders
                abTests.push(...getPlaceholderABTests(rendering.placeholders));
            }
        });
    });

    return abTests;
};

export const getRenderingABTest = (rendering): IABTest | null => {
    const { fields, componentName } = rendering;

    if (!fields) return null;

    const testId = (fields.TestId || fields.data?.TestId)?.value;
    const testVariant = (fields.TestVariant || fields.data?.TestVariant)?.value;

    return testId && testVariant ? { testId: String(testId), testVariant, componentName } : null;
};

/**  Convert array of IABTest to piped string, e.g '100A|200B'  */
export const createABTestsPipedList = (abTests: IABTest[]) => {
    const testsVariants: string[] = abTests.map(t => `${t.testId}${t.testVariant}`);

    return createUniquePipedList(testsVariants);
};
