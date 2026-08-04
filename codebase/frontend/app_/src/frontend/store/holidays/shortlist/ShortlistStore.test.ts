import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import shortlistService from 'frontend/services/shortlist.service';
import { IOffer } from 'models/data/IOffer';
import { MarketCode } from 'models/data/MarketSettings';
import { DataStatus } from 'models/enum/DataStatus';
import { ShortlistType } from 'models/enum/ShortlistType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { ShortlistStore } from './ShortlistStore';

jest.mock('frontend/services/logging');

const offer = {
    date: '2022-08-08',
    stay: 7,
    transport: {
        routes: [
            {
                id: '12345',
                depPt: 'LGW',
                arrPt: 'ES',
            },
            {
                id: '67890',
            },
        ],
    },
    accom: {
        id: 'accommodationId',
        packageId: 'test package id',
        theme: {
            code: 'custom theme',
        },
        unit: [
            {
                occupation: {
                    adults: 2,
                    children: 2,
                    infants: 0,
                    childAges: [5, 7],
                },
                code: 'room code',
                board: 'board',
            },
        ],
        isExt: true,
    },
    transfers: [
        {
            code: 'transfer code',
        },
    ],
    shortList: {
        type: ShortlistType.Offer,
    },
} as any;

const createRootStore = () =>
    createMockStores({
        layoutStore: {
            getSetting: jest.fn().mockReturnValue(true),
        },
        userStore: {
            isLoggedIn: true,
            checkIfUserLoggedIn: jest.fn().mockResolvedValue(true),
            onLogout: jest.fn(),
        },
        routerStore: {
            backToSearchUrl: jest.fn(),
            redirectToLoginPage: jest.fn(),
            redirectToShortlistPage: jest.fn(),
            redirectToShortlistNoResultsPage: jest.fn(),
            hotelDetailsBrowseUrl: jest.fn().mockReturnValue('hotelDetailsBrowseUrl'),
            hotelDetailsUrl: jest.fn().mockReturnValue('hotelDetailsUrl'),
        },
        queryParamsStore: {
            buildRedirectUrlToShortlistPage: jest.fn(),
            buildShortlistHotelQuery: jest.fn(),
        },
        searchStore: {
            searchWhen: {
                flexDays: 3,
                isFlexible: true,
            },
            searchTo: {
                selectedDestinationCodesQuery: 'ES',
            },
        },
        trackingStore: { trackShortlistEvent: jest.fn() },
        marketStore: {
            marketSettings: {
                Code: MarketCode.UK,
                Language: 'en',
            },
        },
    });

describe('<ShortlistStore />', () => {
    let rootStore;

    beforeEach(() => {
        rootStore = createRootStore();
        sessionStorage.clear();
    });

    describe('clearShortlist', () => {
        it('should clear shortlist', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.selectedOffers = [offer];
            shortlistStore.page = 2;
            shortlistStore.totalOffers = 1;
            shortlistStore.offers = [offer];
            shortlistStore.isShortlistEditMode = true;
            shortlistStore.isShortlistRemoving = true;
            shortlistStore.isRemoveShortlistFailed = true;

            shortlistStore.clearShortlist();

            expect(shortlistStore.selectedOffers.length).toEqual(0);
            expect(shortlistStore.page).toEqual(1);
            expect(shortlistStore.totalOffers).toEqual(0);
            expect(shortlistStore.offers.length).toEqual(0);
            expect(shortlistStore.isShortlistEditMode).toBe(false);
            expect(shortlistStore.isShortlistRemoving).toBe(false);
            expect(shortlistStore.isRemoveShortlistFailed).toBe(false);
        });
    });

    describe('toggleShowBookingInShortlistPopup', () => {
        it('should update isShowBookingInShortlistPopup value', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            expect(shortlistStore.isShowBookingInShortlistPopup).toBe(false);

            shortlistStore.toggleShowBookingInShortlistPopup(true);

            expect(shortlistStore.isShowBookingInShortlistPopup).toBe(true);
        });
    });

    describe('toggleShowLoginPopup', () => {
        it('should update isShowLoginPopup value', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            expect(shortlistStore.isShowLoginPopup).toBe(false);

            shortlistStore.toggleShowLoginPopup(true);

            expect(shortlistStore.isShowLoginPopup).toBe(true);
        });
    });

    describe('toggleShortlistAdding', () => {
        it('should update toggleShortlistAdding value', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            expect(shortlistStore.isShortlistAdding).toBe(false);

            shortlistStore.toggleShortlistAdding(true);

            expect(shortlistStore.isShortlistAdding).toBe(true);
        });
    });

    describe('addCandidateToShortlist', () => {
        const response = { createdID: '123', savedOffersCount: 1 };

        it('should do nothing if no offer to adding', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistService.addOfferToShortlist = jest.fn();

            shortlistStore.addCandidateToShortlist([]);

            expect(shortlistService.addOfferToShortlist).not.toHaveBeenCalled();
        });

        it('should do nothing if user not logged in', () => {
            rootStore.userStore.isLoggedIn = false;
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.candidate = offer;

            shortlistStore.addCandidateToShortlist([]);

            expect(shortlistService.addOfferToShortlist).not.toHaveBeenCalled();
        });

        it('should not add offer if no packageId', () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.candidate = { ...offer, accom: { packageId: null } };
            shortlistService.addOfferToShortlist = jest.fn();

            shortlistStore.addCandidateToShortlist([]);

            expect(shortlistService.addOfferToShortlist).not.toHaveBeenCalled();
        });

        it('should not add hotel if no giataCode', () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.candidate = {
                shortlist: { type: ShortlistType.Hotel },
                accom: { id: null },
                hotel: { code: null },
            } as any;
            shortlistService.addHotelToShortlist = jest.fn();

            shortlistStore.addCandidateToShortlist([]);

            expect(shortlistService.addHotelToShortlist).not.toHaveBeenCalled();
        });

        it('should add offer to short list and set flag to session storage', async () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = offer;
            shortlistStore.toggleShowLoginPopup = jest.fn();
            shortlistStore.toggleShortlistAdding = jest.fn();
            shortlistStore.setShortlistedCount = jest.fn();
            shortlistStore.saveCandidateToRecentShortlisted = jest.fn();
            shortlistStore.toggleShowBookingInShortlistPopup = jest.fn();
            shortlistStore.setShortlistFlagToStorage = jest.fn();
            shortlistService.addOfferToShortlist = jest.fn().mockReturnValue(Promise.resolve(response));

            const promise = shortlistStore.addCandidateToShortlist([]);

            expect(shortlistStore.toggleShowLoginPopup).toHaveBeenCalledWith(false);
            expect(shortlistStore.toggleShortlistAdding).toHaveBeenCalledWith(true);
            expect(shortlistService.addOfferToShortlist).toHaveBeenCalledWith({
                startDate: '2022-08-08',
                flexDays: 3,
                duration: [7],
                departure: 'LGW',
                room: [{ adults: 2, children: 2, infants: 0, roomCode: 'room code' }],
                childAges: '5,7',
                accommodationId: 'accommodationId',
                outboundRouteId: '12345',
                inboundRouteId: '67890',
                packageId: 'test package id',
                iDepAirport: 'LGW',
                iArrAirport: 'ES',
                iTheme: 'custom theme',
                boardType: 'board',
                transfer: 'transfer code',
                geography: 'ES',
                isExt: true,
            });

            await promise;

            expect(shortlistStore.setShortlistedCount).toHaveBeenCalledWith(response.savedOffersCount);
            expect(shortlistStore.saveCandidateToRecentShortlisted).toHaveBeenCalledWith(response.createdID);
            expect(shortlistStore.toggleShortlistAdding).toHaveBeenCalledWith(false);
            expect(shortlistStore.toggleShowBookingInShortlistPopup).toHaveBeenCalledWith(true);
            expect(shortlistStore.setShortlistFlagToStorage).toHaveBeenCalled();
        });

        it("should NOT set flag to session storage if it's already setup", async () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = offer;
            sessionStorage.setItem(WebStorageKeys.IsOfferWasAddedToShortlist, 'true');
            shortlistService.addOfferToShortlist = jest.fn().mockReturnValue(Promise.resolve(response));
            shortlistStore.toggleShowBookingInShortlistPopup = jest.fn();
            shortlistStore.setShortlistFlagToStorage = jest.fn();

            await shortlistStore.addCandidateToShortlist([]);

            expect(shortlistStore.toggleShowBookingInShortlistPopup).not.toHaveBeenCalled();
            expect(shortlistStore.setShortlistFlagToStorage).not.toHaveBeenCalled();
        });

        it('should add hotel to shortlist adn track shortlist event', async () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = {
                shortlist: { type: ShortlistType.Hotel },
                accom: { id: 'accommodationId' },
                hotel: {
                    code: 'accommodationId',
                    giataCode: 'giataCode',
                    theme: { code: 'C', name: 'City' },
                    type: { code: 'CL', name: 'Luxury Break' },
                },
            } as any;
            shortlistStore.saveCandidateToRecentShortlisted = jest.fn();
            shortlistStore.setShortlistFlagToStorage = jest.fn();
            shortlistService.addHotelToShortlist = jest.fn().mockReturnValue(Promise.resolve(response));

            await shortlistStore.addCandidateToShortlist([]);

            expect(shortlistService.addHotelToShortlist).toHaveBeenCalledWith('giataCode', 'CL');
            expect(shortlistStore.saveCandidateToRecentShortlisted).toHaveBeenCalledWith(response.createdID);
            expect(shortlistStore.rootStore.trackingStore.trackShortlistEvent).toHaveBeenCalledWith(true, []);
        });

        it('should call initializeShortlists on adding offer when on Shortlist Page', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = {
                shortlist: { type: ShortlistType.Hotel },
                accom: { id: 'accommodationId' },
                hotel: {
                    code: 'accommodationId',
                    giataCode: 'giataCode',
                    theme: { code: 'C', name: 'City' },
                    type: { code: 'CL', name: 'Luxury Break' },
                },
            } as IOffer;
            shortlistStore.initializeShortlists = jest.fn();
            shortlistService.addHotelToShortlist = jest.fn().mockReturnValue(Promise.resolve(response));

            await shortlistStore.addCandidateToShortlist([]);

            expect(shortlistStore.initializeShortlists).toHaveBeenCalled();
        });

        it('should throw an error', async () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = offer;
            shortlistStore.setCandidate = jest.fn();
            shortlistStore.toggleShortlistAdding = jest.fn();
            shortlistService.addOfferToShortlist = jest.fn().mockRejectedValue({});

            await shortlistStore.addCandidateToShortlist([]);

            expect(shortlistStore.setCandidate).toHaveBeenCalled();
            expect(shortlistStore.toggleShortlistAdding).toHaveBeenCalledWith(false);
        });

        it('should handle 401 error', async () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = offer;
            shortlistStore.toggleShowLoginPopup = jest.fn();
            shortlistService.addOfferToShortlist = jest.fn().mockRejectedValue({ response: { status: 401 } });

            await shortlistStore.addCandidateToShortlist([]);

            expect(shortlistStore.rootStore.userStore.onLogout).toHaveBeenCalled();
            expect(shortlistStore.toggleShowLoginPopup).toHaveBeenCalledWith(true);
        });
    });

    describe('setShortlistFlagToStorage', () => {
        it('should set value to session storage', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.setShortlistFlagToStorage();

            expect(sessionStorage.getItem(WebStorageKeys.IsOfferWasAddedToShortlist)).toBe('true');
        });
    });

    describe('saveCandidateToRecentShortlisted', () => {
        it('should do nothing if no candidate', () => {
            const shortlistStore = new ShortlistStore(rootStore);
            const setCandidateMock = jest.spyOn(shortlistStore, 'setCandidate');

            shortlistStore.saveCandidateToRecentShortlisted('123');

            expect(setCandidateMock).not.toHaveBeenCalled();
            expect(shortlistStore.recentShortlistedItem).toEqual(null);
        });

        it('should save item and clear the candidate', () => {
            const shortlistStore = new ShortlistStore(rootStore);
            const setCandidateMock = jest.spyOn(shortlistStore, 'setCandidate');
            shortlistStore.candidate = { accom: { packageId: 'packageId', id: 'accommodationId' } } as IOffer;

            shortlistStore.saveCandidateToRecentShortlisted('123');

            expect(shortlistStore.recentShortlistedItem).toEqual({
                shortListType: ShortlistType.Offer,
                packageId: 'packageId',
                accomCode: 'accommodationId',
                shortListId: '123',
            });
            expect(setCandidateMock).toHaveBeenCalledWith(null);
        });

        it('should save item to recentShortlistedItem when removing item on ShortlistPage and selectedOffers is set', () => {
            rootStore.layoutStore.isShortlistPage = true;
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.selectedOffers = [{ accom: { packageId: 'packageId', id: 'accommodationId' } } as IOffer];

            shortlistStore.saveCandidateToRecentShortlisted(undefined);

            expect(shortlistStore.recentShortlistedItem).toEqual({
                shortListType: ShortlistType.Offer,
                packageId: 'packageId',
                accomCode: 'accommodationId',
                shortListId: undefined,
            });
        });
    });

    describe('updateCandidateInShortlist', () => {
        let shortlistStore;

        beforeEach(() => {
            shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.removeCandidateFromShortlist = jest.fn();
            shortlistStore.addCandidateToShortlist = jest.fn();
        });

        it('should call removeCandidateFromShortlist when candidate has id', () => {
            shortlistStore.setCandidate({ shortlist: { id: 'test-id' } } as IOffer);
            shortlistStore.updateCandidateInShortlist();

            expect(shortlistStore.removeCandidateFromShortlist).toHaveBeenCalled();
            expect(shortlistStore.addCandidateToShortlist).not.toHaveBeenCalled();
        });

        it('should call addCandidateToShortlist with candidate when candidate does NOT have id and has accom code', () => {
            shortlistStore.setCandidate({ shortlist: { id: '' }, accom: { code: 'code' } } as IOffer);
            shortlistStore.updateCandidateInShortlist();

            expect(shortlistStore.addCandidateToShortlist).toHaveBeenCalledWith([
                { shortlist: { id: '' }, accom: { code: 'code' } },
            ]);
            expect(shortlistStore.removeCandidateFromShortlist).not.toHaveBeenCalled();
        });

        it('should call addCandidateToShortlist with empty array when candidate does NOT have id and accom code', () => {
            shortlistStore.setCandidate({ shortlist: { id: '' }, accom: { code: '' } } as IOffer);
            shortlistStore.updateCandidateInShortlist();

            expect(shortlistStore.addCandidateToShortlist).toHaveBeenCalledWith([]);
            expect(shortlistStore.removeCandidateFromShortlist).not.toHaveBeenCalled();
        });
    });

    describe('removeCandidateFromShortlist', () => {
        let shortlistStore;

        beforeEach(() => {
            shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.deleteShortlistedItems = jest.fn().mockImplementation(async (_items, callback) => {
                callback();

                return {};
            });
            shortlistStore.onShortlistItemDeleted = jest.fn();
        });

        it('should call deleteShortlistedItems with candidate id', async () => {
            shortlistStore.candidate = offer;

            await shortlistStore.removeCandidateFromShortlist();

            expect(shortlistStore.deleteShortlistedItems).toHaveBeenCalledWith([offer], expect.any(Function));
            expect(shortlistStore.onShortlistItemDeleted).toHaveBeenCalled();
        });

        it('should do nothing if no candidate or no id in candidate', async () => {
            await shortlistStore.removeCandidateFromShortlist();

            expect(shortlistStore.deleteShortlistedItems).not.toHaveBeenCalled();
            expect(shortlistStore.onShortlistItemDeleted).not.toHaveBeenCalled();
        });
    });

    describe('onShortlistItemDeleted', () => {
        let shortlistStore;

        beforeEach(() => {
            shortlistStore = new ShortlistStore(rootStore);
            shortlistStore.saveCandidateToRecentShortlisted = jest.fn();
            shortlistStore.toggleRemovePopup = jest.fn();
        });

        it('should save candidate to recentShortlisted and close remove popup', () => {
            shortlistStore.onShortlistItemDeleted();

            expect(shortlistStore.saveCandidateToRecentShortlisted).toHaveBeenCalledWith(undefined);
            expect(shortlistStore.toggleRemovePopup).toHaveBeenCalledWith(false);
        });

        it('should initialize shortlist when on Shortlist Page', () => {
            rootStore.layoutStore.isShortlistPage = true;
            shortlistStore.initializeShortlists = jest.fn();

            shortlistStore.onShortlistItemDeleted();

            expect(shortlistStore.initializeShortlists).toHaveBeenCalled();
        });
    });

    describe('setCandidate', () => {
        it('should clear candidate if no arguments', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.candidate = offer;

            shortlistStore.setCandidate();

            expect(shortlistStore.candidate).toBeNull();
        });

        it('should set offer to candidate', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.setCandidate(offer);

            expect(shortlistStore.candidate).toEqual(offer);
        });
    });

    describe('onAddToShortlist', () => {
        it('should open login popup if user is not logged in', () => {
            rootStore.userStore.isLoggedIn = false;
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.toggleShowLoginPopup = jest.fn();

            shortlistStore.onAddToShortlist(offer);

            expect(shortlistStore.toggleShowLoginPopup).toHaveBeenCalledWith(true);
        });

        it("should call addCandidateToShortlist if user is logged in and close login popup if it's opened", () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.isShowLoginPopup = true;
            shortlistStore.toggleShowLoginPopup = jest.fn();
            shortlistStore.addCandidateToShortlist = jest.fn();

            shortlistStore.onAddToShortlist(offer);

            expect(shortlistStore.addCandidateToShortlist).toHaveBeenCalledWith([offer], true);
            expect(shortlistStore.toggleShowLoginPopup).toHaveBeenCalledWith(false);
        });

        it('should call addCandidateToShortlist if user is logged in', () => {
            const shortlistStore = new ShortlistStore(rootStore);

            shortlistStore.isShowLoginPopup = false;
            shortlistStore.toggleShowLoginPopup = jest.fn();
            shortlistStore.addCandidateToShortlist = jest.fn();

            shortlistStore.onAddToShortlist(offer);

            expect(shortlistStore.addCandidateToShortlist).toHaveBeenCalledWith([offer], true);
            expect(shortlistStore.toggleShowLoginPopup).not.toHaveBeenCalledWith();
        });
    });

    describe('onRemoveItemFromShortlist', () => {
        it('should save item to selected items and open popup on Shortlist Page', () => {
            rootStore.layoutStore.isShortlistPage = true;
            const store = new ShortlistStore(rootStore);
            const toggleRemovePopupSpy = jest.spyOn(store, 'toggleRemovePopup');

            expect(store.selectedOffers).toEqual([]);

            store.onRemoveItemFromShortlist(offer);

            expect(store.selectedOffers).toEqual([offer]);
            expect(store.candidate).toEqual(undefined);
            expect(toggleRemovePopupSpy).toHaveBeenCalledWith(true);
        });

        it('should save item to candidate and open popup on no Shortlist Page', () => {
            rootStore.layoutStore.isShortlistPage = false;
            const store = new ShortlistStore(rootStore);
            const toggleRemovePopupSpy = jest.spyOn(store, 'toggleRemovePopup');

            store.onRemoveItemFromShortlist(offer);

            expect(store.selectedOffers).toEqual([]);
            expect(store.candidate).toEqual(offer);
            expect(toggleRemovePopupSpy).toHaveBeenCalledWith(true);
        });
    });

    describe('getShortlistStatus', () => {
        it('should fetch shortlist status', async () => {
            const shortlistStore = new ShortlistStore(rootStore);
            const response = { savedOffersCount: 1 };

            shortlistService.getShortlistStatus = jest.fn().mockReturnValue(Promise.resolve(response));

            await shortlistStore.getShortlistStatus();

            expect(shortlistStore.savedOffersCount).toBe(response.savedOffersCount);
        });

        it('should set null status on error', async () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistService.getShortlistStatus = jest.fn().mockReturnValue(Promise.reject({}));

            await shortlistStore.getShortlistStatus();

            expect(shortlistStore.savedOffersCount).toBe(null);
        });
    });

    describe('initializeShortlists', () => {
        it('should redirect to Login Page if user not logged in', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            rootStore.userStore.checkIfUserLoggedIn.mockResolvedValueOnce(false);
            const store = new ShortlistStore(rootStore);
            await store.initializeShortlists();

            expect(store.rootStore.queryParamsStore.buildRedirectUrlToShortlistPage).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should redirect to Login Page if shortlist disabled', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            rootStore.layoutStore.getSetting.mockReturnValue(false);
            const store = new ShortlistStore(rootStore);
            await store.initializeShortlists();

            expect(store.rootStore.queryParamsStore.buildRedirectUrlToShortlistPage).not.toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });

        it('should redirect to Shortlist from No Results Page if there are saved offers', async () => {
            rootStore.layoutStore.isShortlistNoResultsPage = true;
            const store = new ShortlistStore(rootStore);
            store.savedOffersCount = 1;
            await store.initializeShortlists();

            expect(store.rootStore.routerStore.redirectToShortlistPage).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToShortlistNoResultsPage).not.toHaveBeenCalled();
        });

        it('should redirect to No Results from Shortlist Page if there are not saved offers', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            const store = new ShortlistStore(rootStore);
            store.savedOffersCount = 0;
            await store.initializeShortlists();

            expect(store.rootStore.routerStore.redirectToShortlistNoResultsPage).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToShortlistPage).not.toHaveBeenCalled();
        });

        it('should redirect to No Results in maintenance mode', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            rootStore.layoutStore.isMaintenance = true;
            const store = new ShortlistStore(rootStore);
            store.savedOffersCount = 1;
            store.fetchShortlistOffers = jest.fn();

            await store.initializeShortlists();

            expect(store.fetchShortlistOffers).not.toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToShortlistNoResultsPage).toHaveBeenCalled();
        });

        it('should clear store and fetch offers if user log in and shortlist is enabled', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            const store = new ShortlistStore(rootStore);
            store.savedOffersCount = 1;
            store.fetchShortlistOffers = jest.fn();
            store.clearShortlist = jest.fn();
            await store.initializeShortlists();

            expect(store.clearShortlist).toHaveBeenCalled();
            expect(store.fetchShortlistOffers).toHaveBeenCalled();
        });

        it('should logOut and redirect to Login Page if response status is 401', async () => {
            rootStore.layoutStore.isShortlistPage = true;
            const store = new ShortlistStore(rootStore);
            store.savedOffersCount = 1;
            store.fetchShortlistOffers = jest.fn().mockRejectedValue({ response: { status: 401 } });
            store.clearShortlist = jest.fn();
            await store.initializeShortlists();

            expect(store.rootStore.userStore.onLogout).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });
    });

    describe('fetchShortlistOffers', () => {
        let store;
        const hotelImage_1 = { small: 'sm1', medium: 'md1', large: 'lg1' };
        const hotelImage_2 = { small: 'sm2', medium: 'md2', large: 'lg2' };

        beforeEach(() => {
            store = new ShortlistStore(rootStore);
        });

        it('should fetch offers and set Store variables for nullable response', async () => {
            shortlistService.fetchShortlistOffers = jest.fn().mockReturnValue(null);

            await store.fetchShortlistOffers();

            expect(shortlistService.fetchShortlistOffers).toHaveBeenCalled();
            expect(store.offersStatus).toBe(DataStatus.Loaded);
            expect(store.offers).toEqual([]);
            expect(store.totalOffers).toBe(0);
            expect(store.savedOffersCount).toBe(0);
            expect(store.shortlistHeroImage).toBe(null);
        });

        it('should fetch offers and set Store variables according to response', async () => {
            const res = { offers: [{} as IOffer], status: { total: 1 } };
            shortlistService.fetchShortlistOffers = jest.fn().mockReturnValue(res);

            await store.fetchShortlistOffers();

            expect(shortlistService.fetchShortlistOffers).toHaveBeenCalled();
            expect(store.offersStatus).toEqual(DataStatus.Loaded);
            expect(store.offers).toEqual(res.offers);
            expect(store.totalOffers).toEqual(res.status.total);
            expect(store.savedOffersCount).toBe(1);
        });

        it('should set error status if response returns Error', async () => {
            shortlistService.fetchShortlistOffers = jest.fn().mockRejectedValueOnce(null);

            await store.fetchShortlistOffers();

            expect(store.offersStatus).toEqual(DataStatus.Error);
        });

        it('should set shortlist hero image to fist holiday image of 1-st page', async () => {
            store.page = 1;
            const res = {
                offers: [{ hotel: { images: [hotelImage_1] } }, { hotel: { images: [hotelImage_2] } }],
                status: { total: 1 },
            };
            shortlistService.fetchShortlistOffers = jest.fn().mockReturnValue(res);

            await store.fetchShortlistOffers();

            expect(store.shortlistHeroImage).toEqual(hotelImage_1);
        });

        it("should don't update shortlist hero image if it's already set and results are returned for not 1-st page", async () => {
            store.page = 2;
            store.shortlistHeroImage = hotelImage_1;
            const res = {
                offers: [{ hotel: { images: [hotelImage_2] } }],
                status: { total: 1 },
            };
            shortlistService.fetchShortlistOffers = jest.fn().mockReturnValue(res);

            await store.fetchShortlistOffers();

            expect(store.shortlistHeroImage).toEqual(hotelImage_1);
        });

        it("should set shortlist hero image if it's not already set and results are returned for not 1-st page", async () => {
            store.page = 2;
            store.shortlistHeroImage = null;
            const res = {
                offers: [{ hotel: { images: [hotelImage_2] } }],
                status: { total: 1 },
            };
            shortlistService.fetchShortlistOffers = jest.fn().mockReturnValue(res);

            await store.fetchShortlistOffers();

            expect(store.shortlistHeroImage).toEqual(hotelImage_2);
        });
    });

    describe('Edit Mode', () => {
        it('should start Edit Mode', async () => {
            const store = new ShortlistStore(rootStore);
            store.startEditMode();

            expect(store.isShortlistEditMode).toBe(true);
        });

        it('should cancel Edit Mode and clear selected offers', async () => {
            const store = new ShortlistStore(rootStore);
            store.clearSelectedOffers = jest.fn();
            store.cancelEditMode();

            expect(store.isShortlistEditMode).toBe(false);
            expect(store.clearSelectedOffers).toHaveBeenCalled();
        });
    });

    describe('Selected offers', () => {
        const offerA = { shortlist: { id: 'A', marketCode: MarketCode.UK, language: 'en' } } as IOffer;
        const offerB = { shortlist: { id: 'B', marketCode: MarketCode.DE, language: 'de-DE' } } as IOffer;

        let store;

        beforeEach(() => {
            store = new ShortlistStore(rootStore);
            store.offers = [offerA, offerB];
            store.selectedOffers = [offerA, offerB];
            store.clearShortlist = jest.fn();
            store.fetchShortlistOffers = jest.fn();
        });

        it('should clear selected offers', () => {
            store.clearSelectedOffers();

            expect(store.selectedOffers).toEqual([]);
        });

        describe('toggleOfferSelection()', () => {
            it('should add offer to selected', () => {
                store.selectedOffers = [];
                store.toggleOfferSelection(offerA);

                expect(store.selectedOffers).toEqual([offerA]);
            });

            it("should delete offer from selected if it's already been added", () => {
                store.selectedOffers = [offerA];
                store.toggleOfferSelection(offerA);

                expect(store.selectedOffers).toEqual([]);
            });
        });

        describe('isOfferSelected()', () => {
            it('should return true if offer is selected', () => {
                store.selectedOffers = [offerA];

                expect(store.isOfferSelected(offerA)).toBe(true);
            });

            it('should return false if offer is not selected', () => {
                store.selectedOffers = [offerA];

                expect(store.isOfferSelected(offerB)).toBe(false);
            });
        });

        describe('isOfferFromAnotherMarket()', () => {
            it('should return true if offer from another market', () => {
                rootStore.layoutStore.isShortlistPage = true;

                expect(store.isOfferFromAnotherMarket(offerB)).toBe(true);
            });

            it('should return false if offer is not from another market', () => {
                rootStore.layoutStore.isShortlistPage = true;

                expect(store.isOfferFromAnotherMarket(offerA)).toBe(false);
            });
        });
    });

    describe('deleteShortlistedItems()', () => {
        const offers = [{ shortlist: { id: 'A' } } as IOffer, { shortlist: { id: 'B' } } as IOffer];

        it('should delete offers and call success callback', async () => {
            const store = new ShortlistStore(rootStore);
            const successCallback = jest.fn();

            shortlistService.deleteShortlistedItems = jest.fn().mockResolvedValue({ savedOffersCount: 0 });

            await store.deleteShortlistedItems(offers, successCallback);

            expect(shortlistService.deleteShortlistedItems).toHaveBeenCalledWith(['A', 'B']);
            expect(successCallback).toHaveBeenCalled();
            expect(store.savedOffersCount).toBe(0);
        });

        it('should not delete offers if items without shortListId', async () => {
            const store = new ShortlistStore(rootStore);
            shortlistService.deleteShortlistedItems = jest.fn();

            await store.deleteShortlistedItems([{} as IOffer]);

            expect(shortlistService.deleteShortlistedItems).not.toHaveBeenCalled();
        });

        it("should don't call success callback on error", async () => {
            const store = new ShortlistStore(rootStore);
            const successCallback = jest.fn();

            shortlistService.deleteShortlistedItems = jest.fn().mockRejectedValue({});
            await store.deleteShortlistedItems(offers, successCallback);

            expect(store.isRemoveShortlistFailed).toBe(true);
            expect(successCallback).not.toHaveBeenCalled();
        });

        it('should handle 401 error', async () => {
            const store = new ShortlistStore(rootStore);
            const toggleRemovePopupMock = jest.spyOn(store, 'toggleRemovePopup');
            const toggleShowLoginPopupMock = jest.spyOn(store, 'toggleShowLoginPopup');

            shortlistService.deleteShortlistedItems = jest.fn().mockRejectedValue({ response: { status: 401 } });
            await store.deleteShortlistedItems(offers);

            expect(store.rootStore.userStore.onLogout).toHaveBeenCalled();
            expect(toggleRemovePopupMock).toHaveBeenCalledWith(false);
            expect(toggleShowLoginPopupMock).toHaveBeenCalledWith(true);
        });
    });

    describe('getHotelShortlistId', () => {
        it('should not fetch shortlist status if no hotel giataCode', async () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistService.getHotelShortlistStatus = jest.fn();

            const res = await shortlistStore.getHotelShortlistId('');

            expect(res).toBe(undefined);
            expect(shortlistService.getHotelShortlistStatus).not.toHaveBeenCalled();
        });

        it('should return hotel shortlist id', async () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistService.getHotelShortlistStatus = jest.fn().mockResolvedValue({ createdID: 'shortListId' });

            const res = await shortlistStore.getHotelShortlistId('giataCode');

            expect(shortlistService.getHotelShortlistStatus).toHaveBeenCalledWith('giataCode');
            expect(res).toBe('shortListId');
        });

        it('should return undefined on error', async () => {
            const shortlistStore = new ShortlistStore(rootStore);
            shortlistService.getHotelShortlistStatus = jest.fn().mockRejectedValue('error');

            const res = await shortlistStore.getHotelShortlistId('giataCode');

            expect(shortlistService.getHotelShortlistStatus).toHaveBeenCalledWith('giataCode');
            expect(res).toBe(undefined);
        });
    });

    describe('getShortlistHotelLink', () => {
        it('should return hotelDetailsBrowseUrl for hotel shortlist type', () => {
            const offer = { ...mockedOffer, shortlist: { type: ShortlistType.Hotel } };
            const shortlistStore = new ShortlistStore(rootStore);
            const result = shortlistStore.getShortlistHotelLink(offer);

            expect(result).toBe('hotelDetailsBrowseUrl');
        });

        it('should return hotelDetailsBrowseUrl for unavailable offers', () => {
            const offer = { ...mockedOffer, shortlist: { type: ShortlistType.Offer, id: '111' }, price: 0 };
            const shortlistStore = new ShortlistStore(rootStore);
            const result = shortlistStore.getShortlistHotelLink(offer);

            expect(result).toBe('hotelDetailsBrowseUrl');
        });

        it('should return hotelDetailsUrl for available offers', () => {
            const offer = { ...mockedOffer, shortlist: { type: ShortlistType.Offer, id: '111' }, price: 326 };
            const shortlistStore = new ShortlistStore(rootStore);
            const result = shortlistStore.getShortlistHotelLink(offer);

            expect(result).toBe('hotelDetailsUrl');
        });
    });
});
