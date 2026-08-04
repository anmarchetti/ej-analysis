import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { createABTestsPipedList, getLayoutABTests, getStorageABTests } from './abTests.utils';

const storageUtils = require('frontend/utils/webStorage.utils');
storageUtils.getWebStorageItem = jest.fn();

describe('abTests.util', () => {
    describe('getStorageABTests()', () => {
        it('should call getWebStorageItem()', () => {
            getStorageABTests();
            expect(storageUtils.getWebStorageItem).toBeCalledWith(WebStorageKeys.ABTestVariant, false, sessionStorage);
        });

        it('should returns empty array if nothing is stored', () => {
            storageUtils.getWebStorageItem.mockReturnValue();
            const res = getStorageABTests();

            expect(res).toEqual([]);
        });

        it('should returns empty array if storage value is not string', () => {
            storageUtils.getWebStorageItem.mockReturnValue({});
            const res = getStorageABTests();

            expect(res).toEqual([]);
        });

        it('should returns empty array if storage value is invalid string', () => {
            storageUtils.getWebStorageItem.mockReturnValue('fddg');
            const res = getStorageABTests();

            expect(res).toEqual([]);
        });

        it('should parse stored value and returns A/B tests array', () => {
            storageUtils.getWebStorageItem.mockReturnValue('100A|200B');
            const res = getStorageABTests();

            expect(res).toEqual([
                { testId: '100', testVariant: 'A' },
                { testId: '200', testVariant: 'B' },
            ]);
        });
    });

    describe('getLayoutABTests()', () => {
        it("should return empty array if layout doesn't have placeholders tree", () => {
            const res = getLayoutABTests({} as any);
            expect(res).toEqual([]);
        });

        it('should return all tests if layout has placeholders tree', () => {
            const layout = {
                sitecore: {
                    route: {
                        placeholders: {
                            body: [
                                {},
                                {
                                    componentName: 'test',
                                    fields: null,
                                },
                                {
                                    componentName: 'test',
                                    fields: { TestVariant: { value: null }, TestId: { value: null } },
                                },
                                {
                                    componentName: 'test',
                                    fields: { TestVariant: { value: 'A' }, TestId: { value: '100' } },
                                    placeholders: {
                                        childTest: [
                                            {
                                                componentName: 'test',
                                                fields: { TestVariant: { value: 'B' }, TestId: { value: '200' } },
                                            },
                                        ],
                                    },
                                },
                                {
                                    componentName: 'test',
                                    fields: { data: { TestVariant: { value: 'A' }, TestId: { value: 300 } } },
                                },
                            ],
                        },
                    },
                },
            };

            const res = getLayoutABTests(layout as any);
            expect(res).toEqual([
                { testId: '100', testVariant: 'A', componentName: 'test' },
                { testId: '200', testVariant: 'B', componentName: 'test' },
                { testId: '300', testVariant: 'A', componentName: 'test' },
            ]);
        });
    });

    describe('createABTestsPipedList', () => {
        it('should return piped list', () => {
            const res = createABTestsPipedList([
                { testId: '100', testVariant: 'A' },
                { testId: '200', testVariant: 'B' },
                { testId: '300', testVariant: 'A' },
            ]);

            expect(res).toEqual('100A|200B|300A');
        });

        it('should return empty string if array is empty', () => {
            const res = createABTestsPipedList([]);

            expect(res).toEqual('');
        });
    });
});
