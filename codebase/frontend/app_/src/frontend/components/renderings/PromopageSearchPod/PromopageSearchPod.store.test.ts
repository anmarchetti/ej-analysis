import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { RoomAllocation } from 'models/RoomAllocation';
import * as roomAllocationUtils from 'models/RoomAllocation.utils';

import createStore from './PromopageSearchPod.store';

const spyIsRoomAllocationNonStandard = jest.spyOn(roomAllocationUtils, 'isRoomAllocationNonStandard');
const spyScrollTo = jest.fn();

Object.defineProperty(global.window, 'scrollTo', { value: spyScrollTo });

const mockSource = () => ({
    clearFilterStoreValues: jest.fn(),
    prefillPromoPageFilters: jest.fn(),
    closeFilters: jest.fn(),
    changePage: jest.fn(),
    clearBookingFlow: jest.fn(),
    clearPaymentStore: jest.fn(),
    clearIsClickBackToSearch: jest.fn(),
    setSelectedOfferIndex: jest.fn(),
    updateDataLayer: jest.fn(),
    fetchOffers: jest.fn(),
    clearErrorMessage: jest.fn(),
    loadAllDestinations: jest.fn(),
    updateAvailableOrigins: jest.fn(),
    updateAvailableDates: jest.fn(),
    updateAvailableDstCodes: jest.fn(),
    prefillPromoPage: jest.fn(),
    savePromoSpecialFilters: jest.fn(),
    clearSearchParams: jest.fn(),
    isApplySpecialFilter: jest.fn(),
    setBackgroundFilters: jest.fn(),
    hasErrorInField: jest.fn(),
    validateChildrenAge: jest.fn(),
    setDates: jest.fn(),
    setRoomsAllocation: jest.fn(),
    setIsAutoAllocation: jest.fn(),
});

let source;

describe('PromopageSearchPod.store', () => {
    beforeEach(() => {
        source = mockSource();
    });

    describe('initialize', () => {
        it('should call expected', () => {
            const store = createStore(source);
            store.prefillPromoPage = jest.fn();
            store.savePromoSpecialFilters = jest.fn();

            store.initialize();

            expect(source.clearErrorMessage).toHaveBeenCalled();
            expect(source.loadAllDestinations).toHaveBeenCalled();
            expect(source.updateAvailableOrigins).toHaveBeenCalledWith(true);
            expect(source.updateAvailableDates).toHaveBeenCalled();
            expect(source.updateAvailableDstCodes).toHaveBeenCalledWith(true);
            expect(store.prefillPromoPage).toHaveBeenCalled();
            expect(store.savePromoSpecialFilters).toHaveBeenCalled();
        });

        it('should NOT call clearSearchParams when prevTemplateId is undefined', () => {
            const store = createStore(source);

            store.initialize();

            expect(source.clearSearchParams).not.toHaveBeenCalled();
        });

        it('should NOT call clearSearchParams when prevTemplateId is equal to SitecoreTemplateId.HotelDetailsBook', () => {
            source = { ...source, prevTemplateId: SitecoreTemplateId.HotelDetailsBook };
            const store = createStore(source);

            store.initialize();

            expect(source.clearSearchParams).not.toHaveBeenCalled();
        });

        it('should call clearSearchParams when prevTemplateId is defined and is not equal to SitecoreTemplateId.HotelDetailsBook', () => {
            source = { ...source, prevTemplateId: SitecoreTemplateId.AmendFlightsPage };
            const store = createStore(source);

            store.initialize();

            expect(source.clearSearchParams).toHaveBeenCalled();
        });
    });

    describe('hasErrorInField', () => {
        it('should call hasErrorInField from source with passed param', () => {
            const store = createStore(source);
            const mockSearchBarField = SearchBarDropdown.From;

            store.hasErrorInField(mockSearchBarField);

            expect(source.hasErrorInField).toHaveBeenCalledWith(mockSearchBarField);
        });
    });

    describe('_onSubmitSearchFromPromoPage', () => {
        it('should call closeFilter when both date and who are not changed', () => {
            const store = createStore(source);

            const date = '01/01/2023';
            const who = '1';

            store._submittedWhen = date;
            store._submittedWho = who;

            jest.spyOn(store, 'whenValue', 'get').mockReturnValue(date);
            jest.spyOn(store, 'whoValue', 'get').mockReturnValue(who);

            store._onSubmitSearchFromPromoPage();

            expect(source.closeFilters).toHaveBeenCalled();

            expect(source.changePage).toHaveBeenCalledWith(1);
            expect(source.clearBookingFlow).toHaveBeenCalled();
            expect(source.clearPaymentStore).toHaveBeenCalled();
            expect(source.clearIsClickBackToSearch).toHaveBeenCalled();

            expect(source.setSelectedOfferIndex).toHaveBeenCalledWith(-1);

            expect(source.updateDataLayer).toHaveBeenCalled();

            expect(spyScrollTo).toHaveBeenCalledWith(0, 0);
            expect(source.fetchOffers).toHaveBeenCalledWith(true);
        });

        it('should clear filter when either date or who has been changed ', () => {
            const store = createStore(source);

            jest.spyOn(store, 'whenValue', 'get').mockReturnValue('01/01/2023');
            jest.spyOn(store, 'whoValue', 'get').mockReturnValue('1');

            store._onSubmitSearchFromPromoPage();

            expect(source.clearFilterStoreValues).toHaveBeenCalled();
            expect(source.prefillPromoPageFilters).toHaveBeenCalled();
        });
    });

    describe('_isCloseBtnHidden', () => {
        it('should return false when call with neither When nor Who SearchBarDropdown type', () => {
            const store = createStore(source);

            const res = store._isCloseBtnHidden(SearchBarDropdown.From);

            expect(res).toBe(false);
        });

        describe('SearchBarDropdown.When is passed', () => {
            it('should return true when dates store field is an empty array', () => {
                const store = createStore(source);
                jest.spyOn(store, 'dates', 'get').mockReturnValue([]);

                const res = store._isCloseBtnHidden(SearchBarDropdown.When);

                expect(res).toBe(true);
            });

            it('should return false when dates store field is not an empty array', () => {
                const store = createStore(source);
                jest.spyOn(store, 'dates', 'get').mockReturnValue([{}]);

                const res = store._isCloseBtnHidden(SearchBarDropdown.When);

                expect(res).toBe(false);
            });
        });

        describe('SearchBarDropdown.Who is passed', () => {
            it('should return true when', () => {
                source.isAutoAllocation = false;
                source.rooms = [{}];
                const store = createStore(source);
                spyIsRoomAllocationNonStandard.mockReturnValue(false);

                const res = store._isCloseBtnHidden(SearchBarDropdown.Who);

                expect(res).toBe(true);
            });

            it('should return false when rooms store field is an empty array', () => {
                source.isAutoAllocation = false;
                source.rooms = [];
                const store = createStore(source);
                spyIsRoomAllocationNonStandard.mockReturnValue(false);

                const res = store._isCloseBtnHidden(SearchBarDropdown.Who);

                expect(res).toBe(false);
            });

            it('should return false when isAutoAllocation source field is true', () => {
                source.isAutoAllocation = true;
                source.rooms = [{}];
                const store = createStore(source);
                spyIsRoomAllocationNonStandard.mockReturnValue(false);

                const res = store._isCloseBtnHidden(SearchBarDropdown.Who);

                expect(res).toBe(false);
            });

            it('should return false when isRoomAllocationNonStandard util returns true', () => {
                source.isAutoAllocation = false;
                source.rooms = [{}];
                const store = createStore(source);
                spyIsRoomAllocationNonStandard.mockReturnValue(true);

                const res = store._isCloseBtnHidden(SearchBarDropdown.Who);

                expect(res).toBe(false);
            });
        });
    });

    describe('_restoreFromClone', () => {
        it('should restore dates, rooms and auto-distribution from saved', () => {
            const store = createStore(source);
            store._savedFrom = new Date(2024, 5, 1);
            store._savedTo = new Date(2024, 5, 10);
            store._savedRooms = [new RoomAllocation()];
            store._savedIsAutoAllocation = true;

            store._restoreFromClone();

            expect(source.clearErrorMessage).toHaveBeenCalled();
            expect(source.setDates).toHaveBeenCalledWith([
                new Date(store._savedFrom.getTime()),
                new Date(store._savedTo.getTime()),
            ]);
            expect(source.setRoomsAllocation).toHaveBeenCalled();
            expect(source.setIsAutoAllocation).toHaveBeenCalledWith(true);
            expect(source.validateChildrenAge).toHaveBeenCalled();
            expect(store._savedRooms?.length).toBe(1);
        });
    });
});
