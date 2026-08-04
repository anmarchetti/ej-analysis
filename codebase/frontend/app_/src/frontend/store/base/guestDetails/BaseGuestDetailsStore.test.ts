import isBackend from 'frontend/utils/isBackend';
import { IValidationError } from 'models/data/validation/IValidationError';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';

import BaseGuestDetailsStore from './BaseGuestDetailsStore';

import 'jest-localstorage-mock';

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockIsBacked = isBackend as jest.MockedFn<typeof isBackend>;

const adult = new GuestInfo({
    type: GuestType.Adult,
    age: 18,
    firstName: 'Adult',
    lastName: 'Test',
    notBornYet: false,
});

const lead = new GuestInfo(
    {
        type: GuestType.Adult,
        age: 18,
        firstName: 'Lead',
        lastName: 'Test',
        notBornYet: false,
    },
    true,
);

const child = new GuestInfo({
    type: GuestType.Child,
    age: 10,
    firstName: 'Child',
    lastName: 'Test',
    notBornYet: false,
});

const infant = new GuestInfo({
    type: GuestType.Infant,
    age: 1,
    firstName: 'Infant',
    lastName: 'Test',
    notBornYet: false,
});

let mockRootStore;

const createRootStore = () =>
    ({
        searchStore: {
            searchWho: {
                roomsAllocation: [
                    {
                        adults: [{ age: 18 }],
                        children: [{ age: 13 }],
                        infants: [{ age: 1 }],
                    } as RoomAllocation,
                ],
            },
        },
        bookingStore: {},
        layoutStore: { isTradePortal: false, getPhrase: jest.fn(p => p) },
        appCatalogStore: {
            countries: { fetchData: jest.fn() },
            dialingCodes: { fetchData: jest.fn() },
        },
    } as any);

describe('BaseGuestDetails', () => {
    let store;

    beforeEach(() => {
        mockRootStore = createRootStore();
        sessionStorage.clear();
        store = new BaseGuestDetailsStore(mockRootStore);
    });

    describe('serialize()', () => {
        it('should serialize empty store', () => {
            expect(store.serialize()).toEqual({
                guestsDetails: [],
            });
        });

        it('should serialize store with data', () => {
            store.guestsDetails = [lead];

            expect(store.serialize()).toEqual({
                guestsDetails: [lead],
            });
        });
    });

    describe('deserialize()', () => {
        it('should deserialize undefined', () => {
            store.deserialize(undefined);

            expect(store.guestsDetails).toEqual([]);
        });

        it('should deserialize object', () => {
            store.deserialize({ guestsDetails: [lead] });

            expect(store.guestsDetails).toEqual([lead]);
        });
    });

    describe('guests types', () => {
        it('should return empty guest lists if no guestDetails', () => {
            expect(store.adults).toEqual([]);
            expect(store.children).toEqual([]);
            expect(store.infants).toEqual([]);
            expect(store.leadPassenger).toEqual(undefined);
            expect(store.leadSurname).toEqual('');
        });

        it('should return guests by types from guestDetails', () => {
            store.guestsDetails = [adult, child, infant, lead];

            expect(store.adults).toEqual([adult, lead]);
            expect(store.children).toEqual([child]);
            expect(store.infants).toEqual([infant]);
            expect(store.leadPassenger).toEqual(lead);
            expect(store.leadSurname).toEqual(lead.lastName);
        });
    });

    describe('createGuestsDetails()', () => {
        it("should create guests by SearchStore data if guests don't already exist", () => {
            store.createGuestsDetails();

            expect(store.guestsDetails.length).toEqual(3);
            expect(store.guestsDetails[0].type).toEqual(GuestType.Adult);
            expect(store.guestsDetails[1].type).toEqual(GuestType.Child);
            expect(store.guestsDetails[2].type).toEqual(GuestType.Infant);
        });

        it('should NOT create guests by SearchStore data if guests already exist', () => {
            store.guestsDetails = [lead];

            store.createGuestsDetails();

            expect(store.guestsDetails.length).toEqual(1);
        });

        it('should create guests by SearchStore data even if guest already exist', () => {
            store.guestsDetails = [lead];

            store.createGuestsDetails(true);

            expect(store.guestsDetails.length).toEqual(3);
        });
    });

    describe('clearGuestDetails()', () => {
        it('should clear guestDetails', () => {
            store.guestsDetails = [adult];

            store.clearGuestDetails();

            expect(store.guestsDetails).toHaveLength(0);
        });
    });

    describe('toggleForceErrors()', () => {
        it('should set true', () => {
            expect(store.forceErrors).toBeFalsy();

            store.toggleForceErrors(true);

            expect(store.forceErrors).toBeTruthy();
        });
    });

    describe('guestDetailsErrors', () => {
        it('should return errors list', () => {
            const spyGetErrors = jest
                .spyOn(adult, 'getErrorsBySiteName')
                .mockImplementationOnce(() => [{ errorMessage: 'adult error' } as IValidationError]);

            store.guestsDetails = [adult];

            expect(store.guestDetailsErrors).toEqual([{ errorMessage: 'adult error' }]);
            expect(spyGetErrors).toHaveBeenCalledWith(mockRootStore.layoutStore.isTradePortal);
        });

        it('should return empty list if no errors', () => {
            const spyGetErrors = jest.spyOn(adult, 'getErrorsBySiteName').mockImplementationOnce(() => []);

            store.guestsDetails = [adult];

            expect(store.guestDetailsErrors).toEqual([]);
            expect(spyGetErrors).toHaveBeenCalledWith(mockRootStore.layoutStore.isTradePortal);
        });
    });

    describe('Confirm Policy', () => {
        it('should toggle confirm policy', () => {
            expect(store.confirmPolicy).toBeFalsy();

            store.toggleConfirmPolicy();

            expect(store.confirmPolicy).toBeTruthy();
        });

        it('should confirm policy if force errors', () => {
            store.forceErrors = true;

            expect(store.shouldConfirmPolicy).toBeTruthy();
        });

        it('should NOT confirm policy if no force errors', () => {
            store.forceErrors = false;

            expect(store.shouldConfirmPolicy).toBeFalsy();
        });

        it('should NOT confirm policy if it was confirmed', () => {
            store.forceErrors = true;
            store.confirmPolicy = true;

            expect(store.shouldConfirmPolicy).toBeFalsy();
        });
    });

    describe('Session Storage', () => {
        const mockedGuests = [{ isLead: true, firstName: 'Test', email: 'lead@email.com' } as GuestInfo];

        describe('saveGuestDetailsToSessionStorage()', () => {
            it('should save data to sessionStorage', () => {
                store.guestsDetails = mockedGuests;
                store.saveGuestDetailsToSessionStorage();

                expect(sessionStorage.setItem).toBeCalledWith(
                    WebStorageKeys.GuestDetailsSession,
                    JSON.stringify(mockedGuests),
                );
            });

            it('should NOT save data to sessionStorage if no guest details', () => {
                store.guestsDetails = [];
                store.saveGuestDetailsToSessionStorage();

                expect(sessionStorage.setItem).not.toBeCalled();
            });
        });

        describe('getGuestDetailsFromSessionStorage()', () => {
            it('should return empty list if no data in sessionStorage', () => {
                const data = store.getGuestDetailsFromSessionStorage();

                expect(sessionStorage.getItem).toBeCalledWith(WebStorageKeys.GuestDetailsSession);
                expect(data).toEqual([]);
            });

            it('should return empty list if sessionStorage data is not array', () => {
                sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify('Test'));
                const data = store.getGuestDetailsFromSessionStorage();

                expect(sessionStorage.getItem).toBeCalledWith(WebStorageKeys.GuestDetailsSession);
                expect(data).toEqual([]);
            });

            it('should return guests from sessionStorage', () => {
                sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify(mockedGuests));
                const data = store.getGuestDetailsFromSessionStorage();

                expect(sessionStorage.getItem).toBeCalledWith(WebStorageKeys.GuestDetailsSession);
                expect(data).toEqual(mockedGuests);
            });
        });

        describe('getLeadEmailFromSessionStorage()', () => {
            it('should return email if a lead saved in sessionStorage', () => {
                sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify(mockedGuests));
                const email = store.getLeadEmailFromSessionStorage();

                expect(email).toEqual('lead@email.com');
            });

            it('should return undefined if a lead is not saved in sessionStorage', () => {
                const email = store.getLeadEmailFromSessionStorage();

                expect(email).toBeUndefined();
            });
        });

        describe('hasGuestInStorage()', () => {
            it('should be falsy on backend', () => {
                mockIsBacked.mockReturnValueOnce(true);

                expect(store.hasGuestInStorage()).toBeFalsy();
            });

            it('should be falsy if no data in sessionStorage', () => {
                expect(store.hasGuestInStorage()).toBeFalsy();
            });

            it('should be true if data saved in sessionStorage', () => {
                sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify(mockedGuests));

                expect(store.hasGuestInStorage()).toBeTruthy();
            });
        });

        describe('removeGuestDetailsFromSessionStorage()', () => {
            it('should clear data from sessionStorage', () => {
                store.removeGuestDetailsFromSessionStorage();

                expect(sessionStorage.removeItem).toBeCalledWith(WebStorageKeys.GuestDetailsSession);
            });
        });

        describe('updateGuestsDetailsWithSessionData()', () => {
            it('should NOT update if no guests in store', () => {
                sessionStorage.setItem(WebStorageKeys.GuestDetailsSession, JSON.stringify(mockedGuests));
                store.updateGuestsDetailsWithSessionData();

                expect(store.guestsDetails).toEqual([]);
            });

            it('should NOT update if no guests in sessionStorage', () => {
                store.guestsDetails = mockedGuests;
                store.updateGuestsDetailsWithSessionData();

                expect(store.guestsDetails).toEqual(mockedGuests);
            });

            it('should update all guests by sessionStorage', () => {
                store.guestsDetails = [adult, child, infant];

                sessionStorage.setItem(
                    WebStorageKeys.GuestDetailsSession,
                    JSON.stringify([
                        { type: GuestType.Adult, firstName: 'Adult-New', lastName: 'New' },
                        { type: GuestType.Child, firstName: 'Child-New', lastName: 'New', age: 10 },
                        { type: GuestType.Infant, firstName: 'Infant-New', lastName: 'New' },
                    ]),
                );

                store.updateGuestsDetailsWithSessionData();

                expect(store.guestsDetails).toHaveLength(3);
                expect(store.guestsDetails[0]).toEqual(
                    expect.objectContaining({ firstName: 'Adult-New', lastName: 'New' }),
                );
                expect(store.guestsDetails[1]).toEqual(
                    expect.objectContaining({ firstName: 'Child-New', lastName: 'New' }),
                );
                expect(store.guestsDetails[2]).toEqual(
                    expect.objectContaining({ firstName: 'Infant-New', lastName: 'New' }),
                );
            });

            it('should update children only with same age', () => {
                store.guestsDetails = [
                    new GuestInfo({
                        type: GuestType.Child,
                        age: 10,
                        firstName: 'Child-1',
                        lastName: 'Child-1',
                        notBornYet: false,
                    }),
                    new GuestInfo({
                        type: GuestType.Child,
                        age: 15,
                        firstName: 'Child-2',
                        lastName: 'Child-2',
                        notBornYet: false,
                    }),
                ];

                sessionStorage.setItem(
                    WebStorageKeys.GuestDetailsSession,
                    JSON.stringify([
                        { type: GuestType.Child, firstName: 'Child-2-New', lastName: 'Child-2-New', age: 15 },
                        { type: GuestType.Child, firstName: 'Child-1-New', lastName: 'Child-1-New', age: 12 },
                    ]),
                );

                store.updateGuestsDetailsWithSessionData();

                expect(store.guestsDetails).toHaveLength(2);
                expect(store.guestsDetails[0]).toEqual(
                    expect.objectContaining({ firstName: 'Child-1', lastName: 'Child-1', age: 10 }),
                );

                expect(store.guestsDetails[1]).toEqual(
                    expect.objectContaining({ firstName: 'Child-2-New', lastName: 'Child-2-New', age: 15 }),
                );
            });
        });
    });

    describe('loadReferenceData()', () => {
        it('should fetch data', () => {
            store.loadReferenceData();

            expect(mockRootStore.appCatalogStore.countries.fetchData).toHaveBeenCalled();
            expect(mockRootStore.appCatalogStore.dialingCodes.fetchData).toHaveBeenCalled();
        });
    });

    describe('Section Text', () => {
        describe.each([
            [{ type: GuestType.Adult }, SitecoreDictionary.GuestDetailsSectionHeadersAdult],
            [{ type: GuestType.Child }, SitecoreDictionary.GuestDetailsSectionHeadersChild],
            [{ type: GuestType.Infant }, SitecoreDictionary.GuestDetailsSectionHeadersInfant],
        ])('getPrimarySectionText()', (guest, expected) => {
            it(`should return text for ${guest.type}`, () => {
                const text = store.getPrimarySectionText(guest as GuestInfo);

                expect(text).toEqual(expected);
            });
        });

        describe.each([
            [
                'lead',
                { type: GuestType.Adult, isLead: true },
                `(${SitecoreDictionary.GuestDetailsSectionHeadersLeadGuest})`,
            ],
            ['adult', { type: GuestType.Adult, isLead: false }, ''],
            [
                'child without age',
                { type: GuestType.Child, age: 10 },
                `(${SitecoreDictionary.GuestDetailsSectionHeadersChildAge})`,
            ],
            ['child with age', { type: GuestType.Child }, ''],
            ['infant', { type: GuestType.Infant }, ''],
        ])('getSecondarySectionText()', (testCase: string, guest: GuestInfo, expected: string) => {
            it(`should return text for ${testCase}`, () => {
                const text = store.getSecondarySectionText(guest);

                expect(text).toEqual(expected);
            });
        });
    });

    describe('adultsAndChildrenNumber', () => {
        it('should return sum of adults and children', () => {
            store.guestsDetails = [
                { type: GuestType.Adult },
                { type: GuestType.Adult },
                { type: GuestType.Child },
                { type: GuestType.Infant },
                { type: GuestType.Infant },
            ];

            expect(store.adultsAndChildrenNumber).toBe(3);
        });
    });
});
