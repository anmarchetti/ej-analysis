import { IExtraPriceBreakdown } from 'models/data/IValidPackageInfo';

import { calculatePriceBreakdown } from './priceBreakdown.utils';

jest.mock('mobx', () => ({
    toJS: jest.fn(x => x),
}));

describe('calculatePriceBreakdown', () => {
    it('should return an empty array when extraPriceBreakdown is undefined', () => {
        const result = calculatePriceBreakdown(undefined);
        expect(result).toEqual([]);
    });

    it('should flatten subcategories and sort correctly', () => {
        const mockData: IExtraPriceBreakdown[] = [
            {
                name: 'B',
                amount: 100,
                subcategories: [
                    { name: 'Sub A', amount: 50, code: 'ANY', quantity: 1 },
                    { name: 'Sub B', amount: 150, code: 'ANY', quantity: 1 },
                ],
                code: 'ANY',
                quantity: 1,
            },
            {
                name: 'A',
                amount: 200,
                code: 'ANY',
                quantity: 1,
            },
            {
                name: 'C',
                amount: -50,
                code: 'ANY',
                quantity: 1,
            },
        ];

        const expectedResult = [
            { name: 'A', amount: 200, code: 'ANY', quantity: 1 },
            { name: 'Sub A', amount: 50, code: 'ANY', quantity: 1 },
            { name: 'Sub B', amount: 150, code: 'ANY', quantity: 1 },
            { name: 'C', amount: -50, code: 'ANY', quantity: 1 },
        ];

        const result = calculatePriceBreakdown(mockData);
        expect(result).toEqual(expectedResult);
    });

    it('should sort negative amounts to the end', () => {
        const mockData: IExtraPriceBreakdown[] = [
            { name: 'Discount', amount: -100, code: 'ANY', quantity: 1 },
            { name: 'Service Fee', amount: 50, code: 'ANY', quantity: 1 },
            { name: 'Tax', amount: 200, code: 'ANY', quantity: 1 },
        ];

        const expectedResult = [
            { name: 'Service Fee', amount: 50, code: 'ANY', quantity: 1 },
            { name: 'Tax', amount: 200, code: 'ANY', quantity: 1 },
            { name: 'Discount', amount: -100, code: 'ANY', quantity: 1 },
        ];

        const result = calculatePriceBreakdown(mockData);
        expect(result).toEqual(expectedResult);
    });

    it('should sort alphabetically when amounts are equal', () => {
        const mockData: IExtraPriceBreakdown[] = [
            { name: 'B', amount: 100, code: 'ANY', quantity: 1 },
            { name: 'A', amount: 100, code: 'ANY', quantity: 1 },
            { name: 'C', amount: 100, code: 'ANY', quantity: 1 },
        ];

        const expectedResult = [
            { name: 'A', amount: 100, code: 'ANY', quantity: 1 },
            { name: 'B', amount: 100, code: 'ANY', quantity: 1 },
            { name: 'C', amount: 100, code: 'ANY', quantity: 1 },
        ];

        const result = calculatePriceBreakdown(mockData);
        expect(result).toEqual(expectedResult);
    });
});
