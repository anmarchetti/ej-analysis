import { createHolidaysAppStores, IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { validateChildrenAgesInRoom } from 'frontend/utils/guestsValidation';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';
import { isDefaultAmountPassengersInRooms, isRoomAllocationNonStandard } from 'models/RoomAllocation.utils';

import { ISearchWhoInitialState } from './SearchWhoStore';

jest.mock('frontend/utils/guestsValidation', () => ({
    ...jest.requireActual('frontend/utils/guestsValidation'),
    validateChildrenAgesInRoom: jest.fn(),
}));

jest.mock('models/RoomAllocation.utils', () => ({
    ...jest.requireActual('models/RoomAllocation.utils'),
    isRoomAllocationNonStandard: jest.fn(),
    isDefaultAmountPassengersInRooms: jest.fn(),
}));

let stores: IHolidaysStores;

describe('SearchWhoStore', () => {
    beforeEach(() => {
        stores = createHolidaysAppStores();
    });

    describe('constructor', () => {
        it('should set 1 room with 2 adults to roomAllocation', () => {
            expect(stores.searchStore.searchWho.adultsQuantity).toBe(2);
            expect(stores.searchStore.searchWho.childrenQuantity).toBe(0);
            expect(stores.searchStore.searchWho.infantsQuantity).toBe(0);
            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(1);
        });
    });

    describe('serialize', () => {
        it('should return initial state object', () => {
            stores.searchStore.searchWho.isAutoAllocation = true;
            stores.searchStore.searchWho.roomsAllocation = [new RoomAllocation()];

            expect(stores.searchStore.searchWho.serialize()).toEqual({
                isAutoAllocation: stores.searchStore.searchWho.isAutoAllocation,
                roomsAllocation: stores.searchStore.searchWho.roomsAllocation,
            });
        });
    });

    describe('deserialize', () => {
        it('should do nothing when no initialState', () => {
            stores.searchStore.searchWho.deserialize();

            expect(stores.searchStore.searchWho.isAutoAllocation).toBeUndefined();
            expect(stores.searchStore.searchWho.roomsAllocation).toHaveLength(1);
        });

        it('should initialize store using initial state', () => {
            const initialState: ISearchWhoInitialState = {
                isAutoAllocation: true,
                roomsAllocation: [new RoomAllocation(), new RoomAllocation(), new RoomAllocation()],
            };

            stores.searchStore.searchWho.deserialize(initialState);

            expect(stores.searchStore.searchWho.isAutoAllocation).toBe(initialState.isAutoAllocation);
            expect(stores.searchStore.searchWho.roomsAllocation).toHaveLength(initialState.roomsAllocation!.length);
        });
    });

    describe('quantity', () => {
        it('should return correct adultsQuantity in roomsAllocation', () => {
            stores.searchStore.searchWho.onChangeRooms(3);
            stores.searchStore.searchWho.roomsAllocation.forEach(room => {
                room.addAdult();
                room.addAdult();
                room.addAdult();
            });

            expect(stores.searchStore.searchWho.adultsQuantity).toBe(13);
        });

        it('should return correct childrenQuantity in roomsAllocation', () => {
            stores.searchStore.searchWho.onChangeRooms(3);
            stores.searchStore.searchWho.roomsAllocation.forEach(room => {
                room.addChild();
                room.addChild();
                room.addChild();
            });

            expect(stores.searchStore.searchWho.childrenQuantity).toBe(9);
        });

        it('should return correct infantsQuantity in roomsAllocation', () => {
            stores.searchStore.searchWho.onChangeRooms(3);
            stores.searchStore.searchWho.roomsAllocation.forEach(room => {
                room.addInfant();
                room.addInfant();
                room.addInfant();
            });

            expect(stores.searchStore.searchWho.infantsQuantity).toBe(9);
        });
    });

    describe('Default values for room', () => {
        it('should add 2 adults for 1st room by default', () => {
            expect(stores.searchStore.searchWho.adultsQuantity).toBe(2);
        });

        it('should add 1 adult on each room by default', () => {
            stores.searchStore.searchWho.onChangeRooms(3);

            expect(stores.searchStore.searchWho.adultsQuantity).toBe(4);
        });
    });

    describe('totalPaidGuestPlaces', () => {
        beforeEach(() => {
            jest.spyOn(stores.searchStore.searchWho, 'adultsQuantity', 'get').mockReturnValue(5);
            jest.spyOn(stores.searchStore.searchWho, 'childrenQuantity', 'get').mockReturnValue(2);
        });

        it('should return adultsQuantity value only when isKidsGoFree is true', () => {
            stores.searchStore.searchWho.isKidsGoFree = true;

            expect(stores.searchStore.searchWho.totalPaidGuestPlaces).toBe(stores.searchStore.searchWho.adultsQuantity);
        });

        it('should return adultsQuantity plus childrenQuantity when isKidsGoFree is false', () => {
            stores.searchStore.searchWho.isKidsGoFree = false;

            expect(stores.searchStore.searchWho.totalPaidGuestPlaces).toBe(
                stores.searchStore.searchWho.adultsQuantity + stores.searchStore.searchWho.childrenQuantity,
            );
        });
    });

    describe('childrenAges', () => {
        it('should return children ages in array', () => {
            stores.searchStore.searchWho.roomsAllocation = [
                {
                    id: 999,
                    adults: [] as GuestInfo[],
                    children: [{ age: 1 }] as GuestInfo[],
                    infants: [] as GuestInfo[],
                    roomCode: 'ANY',
                },
                {
                    id: 999,
                    adults: [],
                    children: [{ age: 3 }],
                    infants: [],
                    roomCode: 'ANY',
                },
            ] as RoomAllocation[];

            expect(stores.searchStore.searchWho.childrenAges).toEqual([1, 3]);
        });
    });

    describe('isGuestsParametersValid', () => {
        beforeEach(() => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho, 'isChildrenAgeValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(true);
        });

        it('should return true when all parameters are valid', () => {
            expect(stores.searchStore.searchWho.isGuestsParametersValid).toBe(true);
        });

        it('should return false when isChildrenAgeValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho, 'isChildrenAgeValid', 'get').mockReturnValue(false);

            expect(stores.searchStore.searchWho.isGuestsParametersValid).toBe(false);
        });

        it('should return false when isTotalGuestQuantityValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(false);

            expect(stores.searchStore.searchWho.isGuestsParametersValid).toBe(false);
        });

        it('should return false when isGuestQuantityPerRoomValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(
                false,
            );

            expect(stores.searchStore.searchWho.isGuestsParametersValid).toBe(false);
        });
    });

    describe('isWhoParamsValid', () => {
        beforeEach(() => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(true);
            (validateChildrenAgesInRoom as jest.Mock).mockReturnValue(false);
        });

        it('should return true when all parameters are valid', () => {
            expect(stores.searchStore.searchWho.isWhoParamsValid).toBe(true);
        });

        it('should return false when isChildrenAgeValid is true', () => {
            (validateChildrenAgesInRoom as jest.Mock).mockReturnValue(true);

            expect(stores.searchStore.searchWho.isWhoParamsValid).toBe(false);
        });

        it('should return false when isTotalGuestQuantityValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(false);

            expect(stores.searchStore.searchWho.isWhoParamsValid).toBe(false);
        });

        it('should return false when isGuestQuantityPerRoomValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(
                false,
            );

            expect(stores.searchStore.searchWho.isWhoParamsValid).toBe(false);
        });
    });

    describe('resetRoomAllocation', () => {
        it('should set 1 room with 2 adults to roomAllocation', () => {
            stores.searchStore.searchWho.isAutoAllocation = true;
            stores.searchStore.searchWho.resetRoomAllocation();

            expect(stores.searchStore.searchWho.adultsQuantity).toBe(2);
            expect(stores.searchStore.searchWho.childrenQuantity).toBe(0);
            expect(stores.searchStore.searchWho.infantsQuantity).toBe(0);
            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(1);
        });
    });

    describe('allocateManyRooms ', () => {
        beforeEach(() => {
            jest.spyOn(stores.layoutStore, 'isHomePage', 'get').mockReturnValue(true);
            stores.rootStore.layoutStore.getSetting = jest.fn(() => null); // defaultRoomNumber mock
            stores.searchStore.searchWho.roomsAllocation = [];
            stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue = jest.fn();
        });

        it('should change active field when defaultRoomNumber is null', () => {
            stores.searchStore.searchWho.allocateManyRooms(true);

            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).toHaveBeenCalled();
            expect(stores.searchStore.searchWho.roomsAllocation).toHaveLength(1);
        });

        it('should change active field when defaultRoomNumber is equal to 3', () => {
            stores.rootStore.layoutStore.getSetting = jest.fn(() => 3); // defaultRoomNumber mock

            stores.searchStore.searchWho.allocateManyRooms(true);

            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).toHaveBeenCalled();
            expect(stores.searchStore.searchWho.roomsAllocation).toHaveLength(3);
        });

        it('should not change any store field when isHomePage is false and hard param is false', () => {
            jest.spyOn(stores.layoutStore, 'isHomePage', 'get').mockReturnValue(false);

            stores.searchStore.searchWho.allocateManyRooms(false);

            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.roomsAllocation).toHaveLength(0);
        });

        it('should call validateChildrenAge', () => {
            stores.searchStore.searchWho.validateChildrenAge = jest.fn();

            stores.searchStore.searchWho.allocateManyRooms();

            expect(stores.searchStore.searchWho.validateChildrenAge).toHaveBeenCalled();
        });
    });

    describe('validateGuestQuantity', () => {
        beforeEach(() => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(true);
            stores.searchStore.clearErrorMessage = jest.fn();
            stores.searchStore.searchWho.setMaxGuestNumberError = jest.fn();
            stores.searchStore.searchWho.setMaxGuestNumberPerRoomError = jest.fn();
        });

        it('should return true and call setMaxGuestNumberError when isTotalGuestQuantityValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho, 'isTotalGuestQuantityValid', 'get').mockReturnValue(false);

            const res = stores.searchStore.searchWho.validateGuestQuantity();

            expect(res).toBe(true);

            expect(stores.searchStore.searchWho.setMaxGuestNumberError).toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setMaxGuestNumberPerRoomError).not.toHaveBeenCalled();
            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });

        it('should return true and call setMaxGuestNumberPerRoomError when isGuestQuantityPerRoomValid is false', () => {
            jest.spyOn(stores.searchStore.searchWho as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(
                false,
            );

            const res = stores.searchStore.searchWho.validateGuestQuantity();

            expect(res).toBe(true);

            expect(stores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setMaxGuestNumberPerRoomError).toHaveBeenCalled();
            expect(stores.searchStore.clearErrorMessage).not.toHaveBeenCalled();
        });

        it('should return false, not call setMaxGuestNumberError and call clearErrorMessage when all is valid', () => {
            const res = stores.searchStore.searchWho.validateGuestQuantity();

            expect(res).toBe(false);
            expect(stores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setMaxGuestNumberPerRoomError).not.toHaveBeenCalled();
            expect(stores.searchStore.clearErrorMessage).toHaveBeenCalled();
        });
    });

    describe('setMaxGuestNumberError', () => {
        it('should set errorMessages with expected values', () => {
            stores.searchStore.errorMessages = null;

            stores.searchStore.searchWho.setMaxGuestNumberError();

            expect(stores.searchStore.errorMessages).toEqual({
                key: SearchBarDropdown.Who,
                message: SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
            });
        });
    });

    describe('setMaxGuestNumberPerRoomError', () => {
        it('should set errorMessages with expected values', () => {
            stores.searchStore.errorMessages = null;

            stores.searchStore.searchWho.setMaxGuestNumberPerRoomError();

            expect(stores.searchStore.errorMessages).toEqual({
                key: SearchBarDropdown.Who,
                message: SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
            });
        });
    });

    describe('maxNumberOfGuests', () => {
        it('should return the maximum number of guests', () => {
            const mock = 4;
            stores.layoutStore.getSettingAsNumber = jest.fn(() => mock);

            expect(stores.searchStore.searchWho.maxNumberOfGuests).toBe(mock);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuests,
            );
        });
    });

    describe('maxNumberOfGuestsPerRoom', () => {
        it('should return the maximum number of guests per room', () => {
            const mock = 4;
            stores.layoutStore.getSettingAsNumber = jest.fn(() => mock);

            expect(stores.searchStore.searchWho.maxNumberOfGuestsPerRoom).toBe(mock);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuestsPerRoom,
            );
        });
    });

    describe('isTotalGuestsQuantityReached', () => {
        beforeEach(() => {
            stores.layoutStore.getSettingAsNumber = jest.fn(() => 4);
            jest.spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get').mockReturnValue(4);
        });

        it('should return true when total guests quantity is reached', () => {
            expect(stores.searchStore.searchWho.isTotalGuestsQuantityReached).toBe(true);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuests,
            );
        });

        it('should return false when total guests quantity is not reached', () => {
            jest.spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get').mockReturnValue(1);

            expect(stores.searchStore.searchWho.isTotalGuestsQuantityReached).toBe(false);
        });
    });

    describe('isTotalGuestQuantityValid', () => {
        beforeEach(() => {
            stores.layoutStore.getSettingAsNumber = jest.fn(() => 4);
            jest.spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get').mockReturnValue(4);
        });

        it('should return true when total guests quantity is equal to the maximum', () => {
            expect(stores.searchStore.searchWho.isTotalGuestQuantityValid).toBe(true);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuests,
            );
        });

        it('should return true when total guests quantity is less than the maximum', () => {
            jest.spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get').mockReturnValue(1);

            expect(stores.searchStore.searchWho.isTotalGuestQuantityValid).toBe(true);
        });

        it('should return false when total guests quantity exceeds the maximum', () => {
            jest.spyOn(stores.searchStore.searchWho, 'totalGuestsQuantity', 'get').mockReturnValue(5);

            expect(stores.searchStore.searchWho.isTotalGuestQuantityValid).toBe(false);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuests,
            );
        });
    });

    describe('validateGuestQuantityPerRoom', () => {
        beforeEach(() => {
            stores.layoutStore.getSettingAsNumber = jest.fn((setting: string) =>
                setting === SiteSettings.MaxNumberOfGuestsPerRoom ? 9 : 16,
            );
        });

        it('should return true when room.totalCount is equal to maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();
            jest.spyOn(room, 'totalCount', 'get').mockReturnValue(9);

            expect(stores.searchStore.searchWho.validateGuestQuantityPerRoom(room)).toBe(true);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuestsPerRoom,
            );
        });

        it('should return true when room.totalCount exceeds maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();
            jest.spyOn(room, 'totalCount', 'get').mockReturnValue(10);

            expect(stores.searchStore.searchWho.validateGuestQuantityPerRoom(room)).toBe(true);
        });

        it('should return false when room.totalCount is less than maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();
            jest.spyOn(room, 'totalCount', 'get').mockReturnValue(8);

            expect(stores.searchStore.searchWho.validateGuestQuantityPerRoom(room)).toBe(false);
        });
    });

    describe('isGuestQuantityPerRoomValid', () => {
        beforeEach(() => {
            stores.layoutStore.getSettingAsNumber = jest.fn((setting: string) =>
                setting === SiteSettings.MaxNumberOfGuestsPerRoom ? 9 : 16,
            );
        });

        it('should return true when no room exceeds maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();
            jest.spyOn(room, 'totalCount', 'get').mockReturnValue(9);
            stores.searchStore.searchWho.roomsAllocation = [room];

            expect((stores.searchStore.searchWho as any).isGuestQuantityPerRoomValid).toBe(true);
            expect(stores.rootStore.layoutStore.getSettingAsNumber).toHaveBeenCalledWith(
                SiteSettings.MaxNumberOfGuestsPerRoom,
            );
        });

        it('should return false when any room exceeds maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();
            jest.spyOn(room, 'totalCount', 'get').mockReturnValue(10);
            stores.searchStore.searchWho.roomsAllocation = [room];

            expect((stores.searchStore.searchWho as any).isGuestQuantityPerRoomValid).toBe(false);
        });
    });

    describe('isDefaultNumberGuestsInRooms', () => {
        describe('defaultRoomNumber is not set in sitecore', () => {
            beforeEach(() => {
                stores.rootStore.layoutStore.getSetting = jest.fn(() => null); // defaultRoomNumber mock
            });

            it('should return true when rooms are standard', () => {
                stores.searchStore.searchWho.isAutoAllocation = false;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(true);
            });

            it('should return false when defaultRoomNumber is not set and rooms are non-standard', () => {
                stores.searchStore.searchWho.isAutoAllocation = false;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(true);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });

            it('should return false when defaultRoomNumber is not set and isAutoAllocation is true', () => {
                stores.searchStore.searchWho.isAutoAllocation = true;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });
        });

        it('should return false when defaultRoomNumber = -1 but isAutoAllocation is false', () => {
            stores.rootStore.layoutStore.getSetting = jest.fn(() => -1); // defaultRoomNumber mock
            stores.searchStore.searchWho.isAutoAllocation = false;
            (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);

            expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
        });

        describe('defaultRoomNumber is equal to 1', () => {
            beforeEach(() => {
                stores.rootStore.layoutStore.getSetting = jest.fn(() => 1); // defaultRoomNumber mock
            });

            it('should return false when defaultRoomNumber <= 1 and rooms are non-standard', () => {
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(true);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });

            it('should return false when defaultRoomNumber > -1 and isAutoAllocation is true', () => {
                stores.searchStore.searchWho.isAutoAllocation = true;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });
        });

        describe('defaultRoomNumber value is greater than 1', () => {
            beforeEach(() => {
                stores.rootStore.layoutStore.getSetting = jest.fn(() => 2); // defaultRoomNumber mock
            });

            it('should return false when roomsAllocationLength !== defaultRoomNumber', () => {
                stores.searchStore.searchWho.roomsAllocation = [new RoomAllocation()]; // roomsAllocationLength mock
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);
                (isDefaultAmountPassengersInRooms as jest.Mock).mockReturnValue(true);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });

            it('should return false when isAutoAllocation is true', () => {
                stores.searchStore.searchWho.isAutoAllocation = true;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);
                (isDefaultAmountPassengersInRooms as jest.Mock).mockReturnValue(true);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });

            it('should return false when !isDefaultAmountPassengersInRooms', () => {
                stores.searchStore.searchWho.roomsAllocation = [new RoomAllocation(), new RoomAllocation()]; // roomsAllocationLength mock
                stores.searchStore.searchWho.isAutoAllocation = false;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);
                (isDefaultAmountPassengersInRooms as jest.Mock).mockReturnValue(false);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(false);
            });

            it('should return true when all conditions are met', () => {
                stores.searchStore.searchWho.roomsAllocation = [new RoomAllocation(), new RoomAllocation()]; // roomsAllocationLength mock
                stores.searchStore.searchWho.isAutoAllocation = false;
                (isRoomAllocationNonStandard as jest.Mock).mockReturnValue(false);
                (isDefaultAmountPassengersInRooms as jest.Mock).mockReturnValue(true);

                expect(stores.searchStore.searchWho.isDefaultNumberGuestsInRooms).toBe(true);
            });
        });
    });

    describe('mergeRoomsIntoOne', () => {
        it('should merge all people into one room', () => {
            stores.searchStore.searchWho.setIsAutoAllocation = jest.fn();
            stores.searchStore.searchWho.roomsAllocation = [new RoomAllocation(), new RoomAllocation()];
            stores.searchStore.searchWho.roomsAllocation[0].addAdult();
            stores.searchStore.searchWho.roomsAllocation[0].addAdult();
            stores.searchStore.searchWho.roomsAllocation[0].addChild();
            stores.searchStore.searchWho.roomsAllocation[0].addChild();
            stores.searchStore.searchWho.roomsAllocation[0].addInfant();
            stores.searchStore.searchWho.roomsAllocation[1].addAdult();
            stores.searchStore.searchWho.roomsAllocation[1].addChild();
            stores.searchStore.searchWho.roomsAllocation[1].addInfant();

            stores.searchStore.searchWho.mergeRoomsIntoOne();

            expect(stores.searchStore.searchWho.roomsAllocation[0].adults).toHaveLength(3);
            expect(stores.searchStore.searchWho.roomsAllocation[0].children).toHaveLength(3);
            expect(stores.searchStore.searchWho.roomsAllocation[0].infants).toHaveLength(2);
            expect(stores.searchStore.searchWho.setIsAutoAllocation).toHaveBeenCalledWith(true);
        });
    });

    describe('updateRoomsAllocationFromQueryParamsStore ', () => {
        it('should get guests values from query params store and create correct instances for each room and for each type of guest', () => {
            stores.layoutStore.getSettingAsNumber = jest.fn(() => 15);
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue([
                {
                    adults: 2,
                    children: 3,
                    infants: 1,
                    roomCode: 'test1',
                    childrenAges: [],
                },
                {
                    adults: 3,
                    children: 1,
                    infants: 0,
                    roomCode: 'test2',
                    childrenAges: [3],
                },
                {
                    adults: 1,
                    children: 0,
                    infants: 0,
                    roomCode: 'test3',
                    childrenAges: [],
                },
            ]);

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(false);

            // total rooms
            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(3);

            // room 1
            expect(stores.searchStore.searchWho.roomsAllocation[0].roomCode).toBe('test1');
            expect(stores.searchStore.searchWho.roomsAllocation[0].adults).toHaveLength(2);
            expect(stores.searchStore.searchWho.roomsAllocation[0].children).toHaveLength(3);
            expect(stores.searchStore.searchWho.roomsAllocation[0].infants).toHaveLength(1);
            expect(
                stores.searchStore.searchWho.roomsAllocation[0].adults.some(a => !(a instanceof GuestInfo)),
            ).toBeFalsy();
            expect(
                stores.searchStore.searchWho.roomsAllocation[0].children.some(c => !(c instanceof GuestInfo)),
            ).toBeFalsy();
            expect(
                stores.searchStore.searchWho.roomsAllocation[0].infants.some(i => !(i instanceof GuestInfo)),
            ).toBeFalsy();

            // room 2
            expect(stores.searchStore.searchWho.roomsAllocation[1].roomCode).toBe('test2');
            expect(stores.searchStore.searchWho.roomsAllocation[1].adults).toHaveLength(3);
            expect(stores.searchStore.searchWho.roomsAllocation[1].children).toHaveLength(1);
            expect(stores.searchStore.searchWho.roomsAllocation[1].infants).toHaveLength(0);
            expect(
                stores.searchStore.searchWho.roomsAllocation[1].adults.some(a => !(a instanceof GuestInfo)),
            ).toBeFalsy();
            expect(
                stores.searchStore.searchWho.roomsAllocation[1].children.some(c => !(c instanceof GuestInfo)),
            ).toBeFalsy();

            // room 3
            expect(stores.searchStore.searchWho.roomsAllocation[2].roomCode).toBe('test3');
            expect(stores.searchStore.searchWho.roomsAllocation[2].adults).toHaveLength(1);
            expect(stores.searchStore.searchWho.roomsAllocation[2].children).toHaveLength(0);
            expect(stores.searchStore.searchWho.roomsAllocation[2].infants).toHaveLength(0);
            expect(
                stores.searchStore.searchWho.roomsAllocation[2].adults.some(a => !(a instanceof GuestInfo)),
            ).toBeFalsy();
        });

        it('should reset to default value if total guest number is more then in settings', () => {
            stores.layoutStore.getSettingAsNumber = jest.fn((setting: string) =>
                setting === SiteSettings.MaxNumberOfGuestsPerRoom ? 9 : 10,
            );
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue([
                {
                    adults: 6,
                    children: 0,
                    infants: 0,
                    roomCode: 'test',
                    childrenAges: [],
                },
                {
                    adults: 6,
                    children: 0,
                    infants: 0,
                    roomCode: 'test',
                    childrenAges: [],
                },
            ]);
            stores.searchStore.searchWho.resetRoomAllocation = jest.fn();

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(false);

            expect(stores.searchStore.searchWho.resetRoomAllocation).toHaveBeenCalled();
        });

        it('should reset to default value if guest number per room exceeds maximum', () => {
            stores.layoutStore.getSettingAsNumber = jest.fn((setting: string) =>
                setting === SiteSettings.MaxNumberOfGuestsPerRoom ? 9 : 16,
            );
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue([
                {
                    adults: 10,
                    children: 0,
                    infants: 0,
                    roomCode: 'test',
                    childrenAges: [],
                },
            ]);
            stores.searchStore.searchWho.resetRoomAllocation = jest.fn();

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(false);

            expect(stores.searchStore.searchWho.resetRoomAllocation).toHaveBeenCalled();
        });

        it('should call setIsAutoAllocation and not change roomsAllocation when forceQuery is false & isAutoAllocation is defined', () => {
            const mockIsAutoAllocation = true;
            jest.spyOn(stores.searchStore.searchWho, 'isAutoAllocation', 'get').mockReturnValue(mockIsAutoAllocation);
            stores.searchStore.searchWho.roomsAllocation = [];
            stores.searchStore.searchWho.setIsAutoAllocation = jest.fn();
            stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue = jest.fn();
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue(
                [],
            );

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(false);

            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(0);
            expect(stores.searchStore.searchWho.setIsAutoAllocation).toHaveBeenCalledWith(mockIsAutoAllocation);
            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).not.toHaveBeenCalled();
        });

        it('should call setIsAutoAllocationToDefaultValue and not change roomsAllocation when forceQuery is false & isAutoAllocationFromUrl is not defined', () => {
            jest.spyOn(stores.searchStore.searchWho, 'isAutoAllocation', 'get').mockReturnValue(undefined as any);
            stores.searchStore.searchWho.roomsAllocation = [];
            stores.searchStore.searchWho.setIsAutoAllocation = jest.fn();
            stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue = jest.fn();
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue(
                [],
            );

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(false);

            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(0);
            expect(stores.searchStore.searchWho.setIsAutoAllocation).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).toHaveBeenCalled();
        });

        it('should call setIsAutoAllocationToDefaultValue and not change roomsAllocation when forceQuery is true & isAutoAllocationFromUrl is not defined', () => {
            stores.searchStore.searchWho.roomsAllocation = [];
            stores.searchStore.searchWho.setIsAutoAllocation = jest.fn();
            stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue = jest.fn();
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'roomsAllocationFromUrl', 'get').mockReturnValue(
                [],
            );
            jest.spyOn(stores.searchStore.rootStore.queryParamsStore, 'isAutoAllocationFromUrl', 'get').mockReturnValue(
                undefined,
            );

            stores.searchStore.searchWho.updateRoomsAllocationFromQueryParamsStore(true);

            expect(stores.searchStore.searchWho.roomsAllocationLength).toBe(0);
            expect(stores.searchStore.searchWho.setIsAutoAllocation).not.toHaveBeenCalled();
            expect(stores.searchStore.searchWho.setIsAutoAllocationToDefaultValue).toHaveBeenCalled();
        });
    });
});
