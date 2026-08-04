import { ISpecificOffer } from 'models/data/ISpecificOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';

import BaseBookingStore from './BaseBookingStore';
import {
    afterCallFetchOffer,
    beforeCallFetchOffer,
    callFetchOffer,
    handlePreviousPriceForFPH,
    shouldValidate,
} from './BaseBookingStore.utils';

describe('BaseBookingStore.utils', () => {
    describe('shouldValidate', () => {
        it('should return true when on extras page', () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: true,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                    },
                    queryParamsStore: {
                        isFlightPlusHotelFunnel: false,
                    },
                    guestDetailsStore: {
                        guestsDetails: [],
                        createGuestsDetails: jest.fn(),
                    },
                    engageStore: {
                        getOrderingFromPromoCode: jest.fn(),
                    },
                },
                updateOfferInfo: jest.fn(),
                updateHotelDetailsUrlIfOfferRoomChanged: jest.fn(),
                loadFlightExtras: jest.fn(),
                extraLuggage: {
                    isExtraLuggageFromUrlValid: true,
                    LCBAvailabilityCheckFlow: jest.fn(),
                },
                loadAdditionalData: jest.fn(),
                hotel: true,
                validatePackage: jest.fn(),
                setSelectedOfferPrices: jest.fn(),
                parsePromocode: jest.fn(),
                previousPrice: 0,
            } as unknown as BaseBookingStore;

            expect(shouldValidate(mockCtx)).toBe(true);
        });

        it('should return true when on guest details page', () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: false,
                        isGuestDetailsPage: true,
                        isTradePortal: false,
                        isConfirmPage: false,
                        isPaymentPage: false,
                    },
                },
            } as unknown as BaseBookingStore;

            expect(shouldValidate(mockCtx)).toBe(true);
        });

        it('should return true when on confirm page in trade portal', () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: false,
                        isGuestDetailsPage: false,
                        isTradePortal: true,
                        isConfirmPage: true,
                        isPaymentPage: false,
                    },
                },
            } as unknown as BaseBookingStore;

            expect(shouldValidate(mockCtx)).toBe(true);
        });

        it('should return true when on payment page outside trade portal', () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: false,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                        isConfirmPage: false,
                        isPaymentPage: true,
                    },
                },
            } as unknown as BaseBookingStore;

            expect(shouldValidate(mockCtx)).toBe(true);
        });

        it('should return false when none of the conditions are met', () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: false,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                        isConfirmPage: false,
                        isPaymentPage: false,
                    },
                },
            } as unknown as BaseBookingStore;

            expect(shouldValidate(mockCtx)).toBe(false);
        });
    });

    describe('beforeCallFetchOffer', () => {
        it('should return false when on confirm page outside trade portal', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: false,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                        isConfirmPage: true,
                        isPaymentPage: false,
                    },
                },
                selectedOffer: null,
                alternativeTransfers: [],
                loadExtras: jest.fn(),
            } as unknown as BaseBookingStore;

            const result = await beforeCallFetchOffer({ ctx: mockCtx, force: false });

            expect(result).toBe(false);
        });

        it('should call loadExtras when alternativeTransfers is empty and on extras page', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: true,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                        isConfirmPage: false,
                        isPaymentPage: false,
                    },
                },
                selectedOffer: { price: 100 },
                alternativeTransfers: [],
                loadExtras: jest.fn(),
            } as unknown as BaseBookingStore;

            const result = await beforeCallFetchOffer({ ctx: mockCtx, force: false });

            expect(result).toBe(true);
            expect(mockCtx.loadExtras).toHaveBeenCalled();
        });

        it('should not call loadExtras when alternativeTransfers is not empty and on extras page', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isExtrasPage: true,
                        isGuestDetailsPage: false,
                        isTradePortal: false,
                        isConfirmPage: false,
                        isPaymentPage: false,
                    },
                },
                selectedOffer: { price: 100 },
                alternativeTransfers: [{ id: 1 }],
                loadExtras: jest.fn(),
            } as unknown as BaseBookingStore;

            const result = await beforeCallFetchOffer({ ctx: mockCtx, force: false });

            expect(result).toBe(true);
            expect(mockCtx.loadExtras).not.toHaveBeenCalled();
        });
    });

    describe('callFetchOffer', () => {
        it('should call fetch offer with external flag set to true when isExt is true', async () => {
            const mockCtx = {
                isLoadingOffer: false,
                isExtFromUrl: false,
                callFetchOffer: jest.fn(),
            } as unknown as BaseBookingStore;

            await callFetchOffer({ ctx: mockCtx, isExt: true });

            expect(mockCtx.isLoadingOffer).toBe(true);
            expect(mockCtx.callFetchOffer).toHaveBeenCalledWith(true, undefined, undefined);
        });

        it('should call fetch offer with external flag set to false when isExt is false', async () => {
            const mockCtx = {
                isLoadingOffer: false,
                isExtFromUrl: true,
                callFetchOffer: jest.fn(),
            } as unknown as BaseBookingStore;

            await callFetchOffer({ ctx: mockCtx, isExt: false });

            expect(mockCtx.isLoadingOffer).toBe(true);
            expect(mockCtx.callFetchOffer).toHaveBeenCalledWith(false, undefined, undefined);
        });

        it('should call fetch offer with external flag set to isExtFromUrl when isExt is undefined', async () => {
            const mockCtx = {
                isLoadingOffer: false,
                isExtFromUrl: true,
                callFetchOffer: jest.fn(),
            } as unknown as BaseBookingStore;

            await callFetchOffer({ ctx: mockCtx });

            expect(mockCtx.isLoadingOffer).toBe(true);
            expect(mockCtx.callFetchOffer).toHaveBeenCalledWith(true, undefined, undefined);
        });

        it('should call fetch offer with provided boardType and rooms', async () => {
            const mockCtx = {
                isLoadingOffer: false,
                isExtFromUrl: false,
                callFetchOffer: jest.fn(),
            } as unknown as BaseBookingStore;

            const boardType = 'full-board';
            const rooms = [{ id: 1 }] as unknown as IQueryRoom[];

            await callFetchOffer({ ctx: mockCtx, boardType, rooms });

            expect(mockCtx.isLoadingOffer).toBe(true);
            expect(mockCtx.callFetchOffer).toHaveBeenCalledWith(false, boardType, rooms);
        });
    });

    describe('afterCallFetchOffer', () => {
        it('should handle missing offer and call onFetchOfferError when not in trade portal', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isTradePortal: false,
                    },
                },
                onFetchOfferError: jest.fn(),
            } as unknown as BaseBookingStore;

            const result = await afterCallFetchOffer({ ctx: mockCtx, offer: undefined, failSilently: true });

            expect(mockCtx.onFetchOfferError).toHaveBeenCalledWith(true);
            expect(result).toBe(true);
        });

        it('should return true when offer is missing and in trade portal', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isTradePortal: true,
                    },
                },
                onFetchOfferError: jest.fn(),
            } as unknown as BaseBookingStore;

            const result = await afterCallFetchOffer({ ctx: mockCtx, offer: undefined, failSilently: true });

            expect(mockCtx.onFetchOfferError).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should update offer info and create guest details when offer has valid data', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isTradePortal: false,
                        isExtrasPage: true,
                    },
                    queryParamsStore: {
                        isFlightPlusHotelFunnel: false,
                    },
                    guestDetailsStore: {
                        guestsDetails: [],
                        createGuestsDetails: jest.fn(),
                    },
                    engageStore: {
                        getOrderingFromPromoCode: jest.fn(),
                    },
                },
                updateOfferInfo: jest.fn(),
                updateHotelDetailsUrlIfOfferRoomChanged: jest.fn(),
                loadFlightExtras: jest.fn(),
                extraLuggage: {
                    isExtraLuggageFromUrlValid: true,
                    LCBAvailabilityCheckFlow: jest.fn(),
                },
                loadAdditionalData: jest.fn(),
                hotel: true,
                validatePackage: jest.fn(),
                setSelectedOfferPrices: jest.fn(),
                parsePromocode: jest.fn(),
                previousPrice: 0,
            } as unknown as BaseBookingStore;

            const mockOffer = {
                offers: [{ accom: { prom: 'promoCode' } }],
            } as unknown as ISpecificOffer;

            const result = await afterCallFetchOffer({ ctx: mockCtx, offer: mockOffer, failSilently: false });

            expect(mockCtx.updateOfferInfo).toHaveBeenCalledWith(mockOffer);
            expect(mockCtx.rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
            expect(mockCtx.rootStore.engageStore.getOrderingFromPromoCode).toHaveBeenCalledWith('promoCode');
            expect(mockCtx.updateHotelDetailsUrlIfOfferRoomChanged).toHaveBeenCalled();
            expect(mockCtx.loadFlightExtras).toHaveBeenCalled();
            expect(mockCtx.extraLuggage.LCBAvailabilityCheckFlow).toHaveBeenCalled();
            expect(mockCtx.validatePackage).toHaveBeenCalled();
            expect(mockCtx.setSelectedOfferPrices).toHaveBeenCalled();
            expect(mockCtx.loadAdditionalData).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should show invalid luggage popup and return true when luggage is invalid', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isTradePortal: false,
                    },
                    queryParamsStore: {
                        isFlightPlusHotelFunnel: false,
                    },
                    guestDetailsStore: {
                        guestsDetails: [],
                        createGuestsDetails: jest.fn(),
                    },
                },
                updateOfferInfo: jest.fn(),
                extraLuggage: {
                    isExtraLuggageFromUrlValid: false,
                },
                setShowInvalidLuggageInUrlPopup: jest.fn(),
                previousPrice: 0,
            } as unknown as BaseBookingStore;

            const mockOffer = {
                offers: [{}],
            } as unknown as ISpecificOffer;

            const result = await afterCallFetchOffer({ ctx: mockCtx, offer: mockOffer, failSilently: false });

            expect(mockCtx.updateOfferInfo).toHaveBeenCalledWith(mockOffer);
            expect(mockCtx.setShowInvalidLuggageInUrlPopup).toHaveBeenCalledWith(true);
            expect(result).toBe(true);
        });

        it('should call onFetchOfferError when offer has no valid data', async () => {
            const mockCtx = {
                rootStore: {
                    layoutStore: {
                        isTradePortal: false,
                    },
                },
                onFetchOfferError: jest.fn(),
            } as unknown as BaseBookingStore;

            const mockOffer = {
                offers: [],
            } as unknown as ISpecificOffer;

            const result = await afterCallFetchOffer({ ctx: mockCtx, offer: mockOffer, failSilently: true });

            expect(mockCtx.onFetchOfferError).toHaveBeenCalledWith(true);
            expect(result).toBe(false);
        });
    });

    describe('handlePreviousPriceForFPH', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                rootStore: {
                    queryParamsStore: {
                        isFlightPlusHotelFunnel: true,
                        isNewFlow: true,
                        removeQueryParam: jest.fn(),
                    },
                },
                previousPrice: 0,
                cacheOfferPriceExcludingTouristTax: 3867,
                selectedOffer: {
                    priceExcludingTouristTax: 3500,
                },
                packageInfo: undefined,
            };
        });

        it('should set previousPrice from cacheOfferPrice for FPH flow', () => {
            handlePreviousPriceForFPH(mockCtx);

            expect(mockCtx.previousPrice).toBe(3867);
            expect(mockCtx.rootStore.queryParamsStore.removeQueryParam).toHaveBeenCalled();
        });

        it('should not set previousPrice when not FPH flow', () => {
            mockCtx.rootStore.queryParamsStore.isFlightPlusHotelFunnel = false;
            mockCtx.cacheOfferPriceExcludingTouristTax = 3500;
            mockCtx.selectedOffer = { priceExcludingTouristTax: 3867 };

            handlePreviousPriceForFPH(mockCtx);

            expect(mockCtx.previousPrice).toBe(0);
            expect(mockCtx.rootStore.queryParamsStore.removeQueryParam).not.toHaveBeenCalled();
        });

        it('should not set previousPrice when isNewFlow is false', () => {
            mockCtx.rootStore.queryParamsStore.isNewFlow = false;
            mockCtx.cacheOfferPriceExcludingTouristTax = 3500;
            mockCtx.selectedOffer = { priceExcludingTouristTax: 3867 };

            handlePreviousPriceForFPH(mockCtx);

            expect(mockCtx.previousPrice).toBe(0);
            expect(mockCtx.rootStore.queryParamsStore.removeQueryParam).not.toHaveBeenCalled();
        });
    });
});
