import { luggageSettingsMock, luggageTypesMock } from 'frontend/__mocks__/extraLuggage';

import { HoldLuggageStore } from './HoldLuggageStore';

const expectedSelectedLuggagePrice = 80;
const expectedSelectedSportEquipmentPrice = 400;
const expectedTotalLuggagePrice = 480;

describe('HoldLuggageStore', () => {
    let store;

    beforeEach(() => {
        jest.restoreAllMocks();
        store = new HoldLuggageStore();
        store.luggageTypes = luggageTypesMock;
        store.settings = luggageSettingsMock;
    });

    it('initializeHoldLuggage should set values to store', () => {
        const values = {
            adultsAndChildrenNumber: 0,
            infantsNumber: 2,
            luggageTypes: luggageTypesMock,
            luggagePrices: 'luggagePrices',
            selectedLuggage: 'selectedLuggage',
            selectedSportEquipment: 'selectedSportEquipment',
            settings: luggageSettingsMock,
        };

        store.luggageTypes = null;
        store.settings = null;
        store.setInitialStateFromSelection = jest.fn();

        expect(store.adultsAndChildrenNumber).toEqual(0);
        expect(store.infantsNumber).toEqual(0);
        expect(store.isHoldLuggageInitialized).toBe(false);

        store.initializeHoldLuggage(values);

        expect(store.adultsAndChildrenNumber).toEqual(values.adultsAndChildrenNumber);
        expect(store.infantsNumber).toEqual(values.infantsNumber);
        expect(store.luggagePrices).toEqual(values.luggagePrices);
        expect(store.luggageTypes).toEqual(luggageTypesMock);
        expect(store.selectedLuggage).toEqual(values.selectedLuggage);
        expect(store.selectedSportEquipment).toEqual(values.selectedSportEquipment);
        expect(store.isHoldLuggageInitialized).toBe(true);
        expect(store.setInitialStateFromSelection).toBeCalled();
        expect(store.settings).toEqual(luggageSettingsMock);
    });

    it('setInitialStateFromSelection should save selected luggage to initial state', () => {
        store.selectedLuggage = { lug: 1 };
        store.selectedSportEquipment = { sport: 2 };

        expect(store.initialState).toEqual({ selectedLuggage: {}, selectedSportEquipment: {} });

        store.setInitialStateFromSelection();

        expect(store.initialState).toEqual({ selectedLuggage: { lug: 1 }, selectedSportEquipment: { sport: 2 } });
    });

    it('setHoldLuggagePopupOpened should set value to isHoldLuggagePopupOpened', () => {
        expect(store.isHoldLuggagePopupOpened).toBe(false);

        store.setHoldLuggagePopupOpened(true);

        expect(store.isHoldLuggagePopupOpened).toBe(true);
    });

    it('clearUnconfirmedLuggage should return selected luggage to initial state', () => {
        store.initialState.selectedLuggage = { lug: 1 };
        store.initialState.selectedSportEquipment = { sport: 2 };

        store.clearUnconfirmedLuggage();

        expect(store.selectedLuggage).toEqual({ lug: 1 });
        expect(store.selectedSportEquipment).toEqual({ sport: 2 });
    });

    it('setSportEquipment should set selectedSportEquipment', () => {
        store.selectedSportEquipment = {};

        store.setSportEquipment({ BIKE: 1, GBAG: 1 });

        expect(store.selectedSportEquipment).toEqual({ BIKE: 1, GBAG: 1 });
    });

    it('clearHoldLuggage should clear fields', () => {
        store.selectedLuggage = { LUG: {} };
        store.selectedSportEquipment = { GBAG: {} };

        store.clearHoldLuggage();

        expect(store.selectedLuggage).toEqual({});
        expect(store.selectedSportEquipment).toEqual({});
    });

    describe('addBag', () => {
        it('should add new bag to selectedLuggage', () => {
            expect(store.selectedLuggage['NewBag']).toBeUndefined();

            store.addBag('NewBag');

            expect(store.selectedLuggage['NewBag']).toBe(1);
        });

        it('should increase number of previously selected bag', () => {
            store.selectedLuggage = {
                NewBag: 3,
            };

            store.addBag('NewBag');

            expect(store.selectedLuggage['NewBag']).toBe(4);
        });

        describe('isSport', () => {
            it('should add new sport equipment to selectedSportEquipment', () => {
                expect(store.selectedSportEquipment.BIKE).toBeUndefined();

                store.addBag('BIKE', true);

                expect(store.selectedSportEquipment.BIKE).toBe(1);
            });

            it('should increase number of previously selected sport equipments', () => {
                const INITIAL_COUNT = 3;

                store.selectedSportEquipment = {
                    BIKE: INITIAL_COUNT,
                };

                store.addBag('BIKE', true);

                expect(store.selectedSportEquipment.BIKE).toBe(INITIAL_COUNT + 1);
            });
        });
    });

    describe('removeBag', () => {
        it('should decrease number of previously selected bag', () => {
            store.selectedLuggage = {
                NewBag: 3,
            };

            store.removeBag('NewBag');

            expect(store.selectedLuggage['NewBag']).toBe(2);
        });

        it('should delete bag from selected if bag number = 0', () => {
            store.selectedLuggage = {
                NewBag: 1,
            };

            store.removeBag('NewBag');

            expect(store.selectedLuggage['NewBag']).toBeUndefined();
        });

        describe('isSport', () => {
            it('should decrease number of previously selected sport equipments', () => {
                const INITIAL_COUNT = 3;

                store.selectedSportEquipment = {
                    BIKE: INITIAL_COUNT,
                };

                store.removeBag('BIKE', true);

                expect(store.selectedSportEquipment.BIKE).toBe(INITIAL_COUNT - 1);
            });

            it('should delete equipment from selected if equipment number = 0', () => {
                store.selectedSportEquipment = { BIKE: 1 };

                store.removeBag('BIKE', true);

                expect(store.selectedSportEquipment.BIKE).toBeUndefined();
            });
        });
    });

    describe('hasLuggageSelectionChanged', () => {
        describe('selected luggage', () => {
            it('should return true when number of selected luggage categories differs from initial state', () => {
                store.initialState.selectedLuggage = { lug: 1 };
                store.selectedLuggage = { lug2: 2, lug3: 3 };

                expect(store.hasLuggageSelectionChanged).toBe(true);
            });

            it('should return true when initially selected luggage differs from selected ', () => {
                store.initialState.selectedLuggage = { lug1: 1 };
                store.selectedLuggage = { lug2: 1 };

                expect(store.hasLuggageSelectionChanged).toBe(true);
            });

            it('should return false when initially selected luggage same as selected ', () => {
                store.initialState.selectedLuggage = { lug1: 1 };
                store.selectedLuggage = { lug1: 1 };

                expect(store.hasLuggageSelectionChanged).toBe(false);
            });
        });

        describe('selected sport equipment', () => {
            it('should return true when number of selected sport items categories differs from initial state', () => {
                store.initialState.selectedSportEquipment = { sport: 1 };
                store.selectedSportEquipment = { sport2: 2, sport3: 3 };

                expect(store.hasLuggageSelectionChanged).toBe(true);
            });

            it('should return true when initially selected sport items differs from selected ', () => {
                store.initialState.selectedSportEquipment = { sport: 1 };
                store.selectedSportEquipment = { sport2: 1 };

                expect(store.hasLuggageSelectionChanged).toBe(true);
            });

            it('should return false when initially selected sport items same as selected ', () => {
                store.initialState.selectedSportEquipment = { sport: 1 };
                store.selectedSportEquipment = { sport: 1 };

                expect(store.hasLuggageSelectionChanged).toBe(false);
            });
        });
    });

    it('maxNumberOfExtraLuggage', () => {
        store.adultsAndChildrenNumber = 3;

        expect(store.maxNumberOfExtraLuggage).toBe(6);
    });

    it('maxNumberOfEquipment', () => {
        store.adultsAndChildrenNumber = 3;

        expect(store.maxNumberOfEquipment).toBe(3);
    });

    it('selectedLuggageNumber should return total number for all selected bags', () => {
        store.selectedLuggage = {
            bag1: 2,
            bag2: 3,
            bag3: 10,
        };

        expect(store.selectedLuggageNumber).toBe(15);
    });

    it('selectedSportEquipmentNumber should return total number for all selected equipments', () => {
        store.selectedSportEquipment = {
            bag1: 2,
            bag2: 3,
            bag3: 10,
        };

        expect(store.selectedSportEquipmentNumber).toBe(15);
    });

    it('selectedTotalNumber should return total number for all selected luggages', () => {
        jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(5);
        jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(5);

        expect(store.selectedTotalNumber).toBe(10);
    });

    it('selectedLuggagePrice should return price of selected luggage', () => {
        store.luggagePrices = {
            bag1: 10,
            bag2: 20,
        };
        store.selectedLuggage = {
            bag1: 2,
            bag2: 3,
        };

        expect(store.selectedLuggagePrice).toBe(expectedSelectedLuggagePrice);
    });

    it('selectedSportEquipmentPrice should return price of selected sport equipment', () => {
        store.luggagePrices = {
            sport1: 50,
            sport2: 100,
        };
        store.selectedSportEquipment = {
            sport1: 2,
            sport2: 3,
        };

        expect(store.selectedSportEquipmentPrice).toBe(expectedSelectedSportEquipmentPrice);
    });

    it('selectedLuggageTotalPrice should return sum of selected luggage and sport equipments prices', () => {
        jest.spyOn(store, 'selectedLuggagePrice', 'get').mockReturnValue(expectedSelectedLuggagePrice);
        jest.spyOn(store, 'selectedSportEquipmentPrice', 'get').mockReturnValue(expectedSelectedSportEquipmentPrice);

        expect(store.selectedLuggageTotalPrice).toBe(expectedTotalLuggagePrice);
    });

    describe('isHoldLuggageFull', () => {
        it('isHoldLuggageFull should return true when the user has reached maximum amount of additional luggage', () => {
            jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(6);
            jest.spyOn(store, 'maxNumberOfExtraLuggage', 'get').mockReturnValue(6);

            expect(store.isHoldLuggageFull).toBe(true);
        });

        it('isHoldLuggageFull should return true when the user has reached maximum amount of sports equipment', () => {
            jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(6);
            jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(6);

            expect(store.isHoldLuggageFull).toBe(true);
        });

        it('isHoldLuggageFull should return false when additional hold luggage is not full', () => {
            jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(3);
            jest.spyOn(store, 'maxNumberOfExtraLuggage', 'get').mockReturnValue(6);

            expect(store.isHoldLuggageFull).toBe(false);
        });

        it('isHoldLuggageFull should return false when sports equipment is not full', () => {
            jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(3);
            jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(6);

            expect(store.isHoldLuggageFull).toBe(false);
        });

        it('isHoldLuggageFull should return false when additional hold luggage is empty', () => {
            jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(0);
            jest.spyOn(store, 'maxNumberOfExtraLuggage', 'get').mockReturnValue(0);

            expect(store.isHoldLuggageFull).toBe(false);
        });

        it('isHoldLuggageFull should return false when sports equipment is empty', () => {
            jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(0);
            jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(0);

            expect(store.isHoldLuggageFull).toBe(false);
        });
    });

    it('setCancelPopupOpened should set value to isCancelPopupOpened', () => {
        expect(store.isCancelPopupOpened).toBe(false);

        store.setCancelPopupOpened(true);

        expect(store.isCancelPopupOpened).toBe(true);
    });

    it('selectedLargeEquipmentNumber should count selected large sport equipment', () => {
        store.selectedSportEquipment = {
            sport1: 2,
            sport2: 10,
            sport3: 5,
        };
        store.luggageTypes = {
            lug: {
                categoryCode: 'Other',
            },
            sport1: {
                categoryCode: 'SEO',
            },
            sport2: {
                categoryCode: 'Other',
            },
            sport3: {
                categoryCode: 'SEO',
            },
        };

        expect(store.selectedLargeEquipmentNumber).toBe(7);
    });

    it('isEquipmentLarge should return true for large SE AND false for other', () => {
        store.luggageTypes = {
            lug: {
                categoryCode: 'Other',
            },
            sport1: {
                categoryCode: 'SEO',
            },
        };

        expect(store.isEquipmentLarge('sport1')).toBe(true);
        expect(store.isEquipmentLarge('lug')).toBe(false);
    });

    describe('isAddLuggageBtnDisabled', () => {
        it('should return true when selectedLuggageNumber more or equal to maxNumberOfExtraLuggage', () => {
            jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(6);
            jest.spyOn(store, 'maxNumberOfExtraLuggage', 'get').mockReturnValue(3);

            expect(store.isAddLuggageBtnDisabled(false, 'GBAG')).toBe(true);
        });

        it('should return false when selectedLuggageNumber less than maxNumberOfExtraLuggage', () => {
            jest.spyOn(store, 'selectedLuggageNumber', 'get').mockReturnValue(3);
            jest.spyOn(store, 'maxNumberOfExtraLuggage', 'get').mockReturnValue(6);

            expect(store.isAddLuggageBtnDisabled(false, 'GBAG')).toBe(false);
        });

        describe('isSport', () => {
            it('should return true when selectedSportEquipmentNumber more or equal to maxNumberOfEquipment', () => {
                jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(6);
                jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(3);

                expect(store.isAddLuggageBtnDisabled(true, 'GBAG')).toBe(true);
            });

            it('should return false when selectedSportEquipmentNumber less than maxNumberOfEquipment', () => {
                jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(3);
                jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(6);

                expect(store.isAddLuggageBtnDisabled(true, 'GBAG')).toBe(false);
            });

            it('should return true when selectedSportEquipmentNumber less than maxNumberOfEquipment but maxNumberOfEquipment reached', () => {
                jest.spyOn(store, 'selectedSportEquipmentNumber', 'get').mockReturnValue(6);
                jest.spyOn(store, 'selectedLargeEquipmentNumber', 'get').mockReturnValue(6);
                jest.spyOn(store, 'maxNumberOfEquipment', 'get').mockReturnValue(9);

                expect(store.isAddLuggageBtnDisabled(true, 'BIKE')).toBe(true);
            });
        });
    });

    describe('isRemoveLuggageBtnDisabled', () => {
        it('should return true when no items selected in this type', () => {
            expect(store.isRemoveLuggageBtnDisabled(false, 'GBAG')).toBe(true);
        });

        it('should return false when items of this type already selected', () => {
            store.selectedLuggage = { GBAG: 2 };

            expect(store.isRemoveLuggageBtnDisabled(false, 'GBAG')).toBe(false);
        });

        describe('isSport', () => {
            it('should return true when no items selected in this type', () => {
                expect(store.isRemoveLuggageBtnDisabled(true, 'GBAG')).toBe(true);
            });

            it('should return false when items of this type already selected', () => {
                store.selectedSportEquipment = { GBAG: 2 };

                expect(store.isRemoveLuggageBtnDisabled(true, 'GBAG')).toBe(false);
            });
        });
    });
});
