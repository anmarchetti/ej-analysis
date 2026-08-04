import { mockSitecoreField } from 'frontend/utils/tests.utils';

import {
    getFlexibilityTrackingLabel,
    getQuizEventsCoreParamsOverride,
    getQuizTabIdentifyingUrl,
} from './inspireMeQuiz.utils';

describe('inspireMeQuiz.utils', () => {
    describe('getQuizEventsCoreParamsOverride', () => {
        it('Should return core params equal to identifying url with TrackingItemName value at the end of string', () => {
            const fields = {
                TrackingItemName: mockSitecoreField('Tracking Item Name'),
            };
            const result = getQuizEventsCoreParamsOverride(fields);
            const { origin, pathname } = window.location;
            const mockUrl = `${origin}${pathname}/quiz/tracking-item-name`;

            expect(result).toEqual({
                pageUrl: mockUrl,
            });
        });

        it('Should return core params equal to identifying url without TrackingItemName value at the end of string', () => {
            const result = getQuizEventsCoreParamsOverride(undefined);
            const { origin, pathname } = window.location;
            const mockUrl = `${origin}${pathname}/quiz/`;

            expect(result).toEqual({
                pageUrl: mockUrl,
            });
        });
    });

    describe('getQuizTabIdentifyingUrl', () => {
        it('should add query params to end of the string', () => {
            Object.defineProperty(window, 'location', {
                value: {
                    origin: 'https://www.easyjet.com',
                    pathname: '/en/holidays/holiday-inspiration',
                    search: '?test1=test',
                },
                writable: true,
            });

            const trackingItemName = mockSitecoreField('Tracking Item Name');
            const result = getQuizTabIdentifyingUrl(trackingItemName);

            expect(result).toBe(
                `https://www.easyjet.com/en/holidays/holiday-inspiration/quiz/tracking-item-name?test1=test`,
            );
        });
    });

    describe('getFlexibilityTrackingLabel', () => {
        it('should return expected string when function is called with a number value', () => {
            const result = getFlexibilityTrackingLabel(3);

            expect(result).toBe('+/- 3 Day');
        });

        it('should return null string when function is called with undefined value', () => {
            const result = getFlexibilityTrackingLabel(undefined);

            expect(result).toBe(null);
        });
    });
});
