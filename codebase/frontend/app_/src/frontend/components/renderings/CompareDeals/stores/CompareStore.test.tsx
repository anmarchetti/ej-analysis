import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { IOffer } from 'models/data/IOffer';
import SiteSettings from 'models/enum/SiteSettings';

import { CompareStore, IOfferWithActionFields } from './CompareStore';

const createRootStore = () =>
    createMockStores({
        layoutStore: {
            isShortlistPage: true,
        },
    });
const mockComparisonListItem = { ...mockedOffer, shortlist: { id: '111' } } as IOfferWithActionFields;
let rootStore;
let store: CompareStore;

describe('CompareStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
        store = new CompareStore(rootStore);
        store.updateComparisonList(mockComparisonListItem);
    });

    it('should return comparison list length', () => {
        expect(store.comparisonListLength).toEqual(1);
    });

    it('should return comparison list', () => {
        expect(store.comparisonList).toStrictEqual([mockComparisonListItem]);
    });

    describe('hasMaxItemsToCompare', () => {
        beforeEach(() => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(3);
        });

        it(`should return false when count selected offers is less than compareDealsMaxItemsCount`, () => {
            expect(store.hasMaxItemsToCompare).toBe(false);
        });

        it(`should return true when count selected offers is equal to compareDealsMaxItemsCount`, () => {
            store.updateComparisonList({ ...mockComparisonListItem, shortlist: { id: '222' } });
            store.updateComparisonList({ ...mockComparisonListItem, shortlist: { id: '333' } });

            expect(store.hasMaxItemsToCompare).toBe(true);
        });
    });

    describe('hasMinItemsToCompare', () => {
        beforeEach(() => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(2);
        });

        it(`should return true when count selected offers is more than compareDealsMinItemsCount`, () => {
            store.updateComparisonList({ ...mockComparisonListItem, shortlist: { id: '222' } });
            expect(store.hasMinItemsToCompare).toBe(true);
        });

        it(`should return false when count selected offers is less than compareDealsMinItemsCount`, () => {
            expect(store.hasMinItemsToCompare).toBe(false);
        });
    });

    describe('compareDealsMaxItemCount', () => {
        it('should return max compare items count when value is valid', () => {
            const spy = jest.spyOn(rootStore.layoutStore, 'getSettingAsNumber').mockReturnValue(4);

            expect(store.compareDealsMaxItemCount).toBe(4);
            expect(spy).toHaveBeenCalledWith(SiteSettings.MaxCompareItemCount);
        });

        it('should return default value when value is invalid', () => {
            jest.spyOn(rootStore.layoutStore, 'getSettingAsNumber').mockReturnValue(Number.NaN);

            expect(store.compareDealsMaxItemCount).toBe(3);
        });

        it('should return max value when value is bigger than max available', () => {
            jest.spyOn(rootStore.layoutStore, 'getSettingAsNumber').mockReturnValue(5);

            expect(store.compareDealsMaxItemCount).toBe(4);
        });
    });

    describe('compareDealsMinItemCount', () => {
        it('should return min compare items count when value is valid', () => {
            const spy = jest.spyOn(rootStore.layoutStore, 'getSettingAsNumber').mockReturnValue(5);

            expect(store.compareDealsMinItemCount).toBe(5);
            expect(spy).toHaveBeenCalledWith(SiteSettings.MinCompareItemCount);
        });

        it('should return default value when value is invalid', () => {
            expect(store.compareDealsMinItemCount).toBe(2);
        });
    });

    describe('isOfferSelectedToCompare', () => {
        it('should return true when get offer with the same id', () => {
            expect(store.isOfferSelectedToCompare(mockComparisonListItem)).toBe(true);
        });

        it('should return false when get offer with different id', () => {
            expect(store.isOfferSelectedToCompare({ ...mockedOffer, shortlist: { id: '333' } })).toBe(false);
        });
    });

    it('should activate compare mode', () => {
        expect(store.isCompareModeEnabled).toEqual(false);
        store.activateCompareMode();
        expect(store.isCompareModeEnabled).toEqual(true);
    });

    it('should deactivate shortlist compare mode', () => {
        store.activateCompareMode();
        store.openCompareOverlay();
        expect(store.comparisonList.length).toEqual(1);

        expect(store.isCompareModeEnabled).toEqual(true);
        expect(store.isCompareOverlayOpened).toEqual(true);

        store.deactivateCompareMode();

        expect(store.isCompareModeEnabled).toEqual(false);
        expect(store.isCompareOverlayOpened).toEqual(false);
        expect(store.comparisonList.length).toEqual(0);
    });

    it('should clear comparison list', () => {
        expect(store.comparisonListLength).toEqual(1);
        store.clearComparisonList();
        expect(store.comparisonListLength).toEqual(0);
    });

    it('should update shortlist comparison list', () => {
        const shortlist = { shortlist: { id: '333' } };
        store.updateComparisonList({ ...mockComparisonListItem, ...shortlist });
        expect(store.comparisonListLength).toEqual(2);
        store.updateComparisonList({ ...mockComparisonListItem, ...shortlist });
        expect(store.comparisonListLength).toEqual(1);
    });

    it('should return comparison list', () => {
        expect(store.comparisonList).toMatchObject([{ ...mockedOffer, shortlist: { id: '111' } }]);
    });

    it('should close and open compare overlay', () => {
        expect(store.isCompareOverlayOpened).toBe(false);

        store.openCompareOverlay();
        expect(store.isCompareOverlayOpened).toBe(true);

        store.closeCompareOverlay();
        expect(store.isCompareOverlayOpened).toBe(false);
    });

    describe('isOfferIdMatch', () => {
        it('should return true when is ids are the same', () => {
            const offerA = { shortlist: { id: '123' } } as IOffer;
            const offerB = { shortlist: { id: '123' } } as IOffer;
            expect(store.isOfferIdMatch(offerA, offerB)).toBe(true);
        });

        it('should return false when ids are different', () => {
            const offerA = { shortlist: { id: '123' } } as IOffer;
            const offerB = { shortlist: { id: '456' } } as IOffer;
            expect(store.isOfferIdMatch(offerA, offerB)).toBe(false);
        });

        it('should return false when both id are missing', () => {
            expect(store.isOfferIdMatch(mockedOffer, mockedOffer)).toBe(false);
        });

        it('should return false when first id is missing', () => {
            expect(store.isOfferIdMatch(mockedOffer, { ...mockedOffer, shortlist: { id: '123' } })).toBe(false);
        });

        it('should return false when second id is missing', () => {
            expect(store.isOfferIdMatch({ ...mockedOffer, shortlist: { id: '123' } }, mockedOffer)).toBe(false);
        });
    });

    describe('getOfferIdPerPageType', () => {
        const offer = {
            shortlist: { id: '111' },
            accom: {
                id: '222',
            },
        } as IOffer;

        it('should return shortlist id on shortlist page', () => {
            expect(store.getOfferIdPerPageType(offer)).toBe('111');
        });

        it('should return accom id on non-shortlist page', () => {
            rootStore.layoutStore.isShortlistPage = false;
            expect(store.getOfferIdPerPageType(offer)).toBe('222');
        });

        it('should return undefined when no shortlist id', () => {
            expect(store.getOfferIdPerPageType(mockedOffer)).toBe(undefined);
        });
    });
});
