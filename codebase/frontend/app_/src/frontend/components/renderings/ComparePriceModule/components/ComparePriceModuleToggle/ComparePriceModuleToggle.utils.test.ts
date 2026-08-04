import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IComparePriceModuleFields } from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceContent/ComparePriceContent.utils';

import { getComparePriceLabels, IComparePriceLabels } from './ComparePriceModuleToggle.utils';

describe('getComparePriceLabels', () => {
    const createMockFields = () =>
        ({
            KeepRoomSingularLabel: mockSitecoreField('Keep Room'),
            KeepRoomPluralLabel: mockSitecoreField('Keep Rooms'),
            CheapestRoomSingularLabel: mockSitecoreField('Cheapest Room'),
            CheapestRoomPluralLabel: mockSitecoreField('Cheapest Rooms'),
        } as IComparePriceModuleFields);

    describe('Single Room (Singular Labels)', () => {
        it('should return singular labels when selectedOffer has 1 room', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}],
                },
            } as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });

        it('should return singular labels when selectedOffer has 0 rooms', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [],
                },
            } as unknown as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });
    });

    describe('Multiple Rooms (Plural Labels)', () => {
        it('should return plural labels when selectedOffer has 2 rooms', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}, {}],
                },
            } as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Rooms',
                cheapestRoomLabel: 'Cheapest Rooms',
            });
        });

        it('should return plural labels when selectedOffer has 3 rooms', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}, {}, {}],
                },
            } as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Rooms',
                cheapestRoomLabel: 'Cheapest Rooms',
            });
        });
    });

    describe('Null/Undefined selectedOffer', () => {
        it('should return singular labels when selectedOffer is null', () => {
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(null, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });

        it('should return singular labels when selectedOffer is undefined', () => {
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(undefined, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });

        it('should return singular labels when selectedOffer.accom is undefined', () => {
            const selectedOffer: IOfferWithoutAltBoards = {} as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });

        it('should return singular labels when selectedOffer.accom.unit is undefined', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {},
            } as IOfferWithoutAltBoards;
            const fields = createMockFields();

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: 'Keep Room',
                cheapestRoomLabel: 'Cheapest Room',
            });
        });
    });

    describe('Missing/Undefined Fields', () => {
        it('should return empty strings when fields is undefined', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}],
                },
            } as IOfferWithoutAltBoards;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, undefined);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });

        it('should return empty strings when field values are missing (singular)', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}],
                },
            } as IOfferWithoutAltBoards;
            const fields = {
                KeepRoomSingularLabel: undefined,
                KeepRoomPluralLabel: mockSitecoreField('Keep Rooms'),
                CheapestRoomSingularLabel: undefined,
                CheapestRoomPluralLabel: mockSitecoreField('Cheapest Rooms'),
            } as unknown as IComparePriceModuleFields;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });

        it('should return empty strings when field values are missing (plural)', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}, {}],
                },
            } as IOfferWithoutAltBoards;
            const fields = {
                KeepRoomSingularLabel: mockSitecoreField('Keep Room'),
                KeepRoomPluralLabel: undefined,
                CheapestRoomSingularLabel: mockSitecoreField('Cheapest Room'),
                CheapestRoomPluralLabel: undefined,
            } as unknown as IComparePriceModuleFields;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });

        it('should return empty strings when field values are empty strings (singular)', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}],
                },
            } as IOfferWithoutAltBoards;
            const fields = {
                KeepRoomSingularLabel: mockSitecoreField(''),
                KeepRoomPluralLabel: mockSitecoreField('Keep Rooms'),
                CheapestRoomSingularLabel: mockSitecoreField(''),
                CheapestRoomPluralLabel: mockSitecoreField('Cheapest Rooms'),
            } as unknown as IComparePriceModuleFields;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle when only singular labels are provided but plural is needed', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}, {}],
                },
            } as IOfferWithoutAltBoards;
            const fields = {
                KeepRoomSingularLabel: mockSitecoreField('Keep Room'),
                KeepRoomPluralLabel: undefined,
                CheapestRoomSingularLabel: mockSitecoreField('Cheapest Room'),
                CheapestRoomPluralLabel: undefined,
            } as unknown as IComparePriceModuleFields;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });

        it('should handle when only plural labels are provided but singular is needed', () => {
            const selectedOffer: IOfferWithoutAltBoards = {
                accom: {
                    unit: [{}],
                },
            } as IOfferWithoutAltBoards;
            const fields = {
                KeepRoomSingularLabel: undefined,
                KeepRoomPluralLabel: mockSitecoreField('Keep Rooms'),
                CheapestRoomSingularLabel: undefined,
                CheapestRoomPluralLabel: mockSitecoreField('Cheapest Rooms'),
            } as unknown as IComparePriceModuleFields;

            const result: IComparePriceLabels = getComparePriceLabels(selectedOffer, fields);

            expect(result).toEqual({
                keepRoomLabel: '',
                cheapestRoomLabel: '',
            });
        });
    });
});
