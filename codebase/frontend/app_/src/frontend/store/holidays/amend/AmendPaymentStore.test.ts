import { CurrencyCode } from 'code/currency';
import {
    mockAmendDatesOfferWithPrice,
    mockAmendDatesStore,
    mockAmendHotelOffer,
    mockAmendPaymentInfo,
    mockAmendPaymentPayload,
    mockAmendRoomAndBoardOffer,
    mockAmendRoomAndBoardStore,
    mockBillingInfo,
    mockBooking,
    mockFlightsRoutes,
    mockPaymentError,
    mockPaymentInfo,
    mockPromoCodeBreakdown,
    mockRoomAndBoardRoomVariant,
    mockSelectedSeat,
    mockTransferWithAmendmentCharges,
    mockValidatedFlights,
} from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import {
    IAmendPaymentPayload,
    PaymentOption,
    RefundPaymentMethod,
} from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { LayoutStore } from 'frontend/store/holidays/layout/LayoutStore';
import {
    getTransaction,
    getTransactionId,
    isTransactionProcessing,
    startNewTransaction,
} from 'frontend/utils/paymentTransaction';
import { submitForm } from 'frontend/utils/submitForm';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { AmendStoreKey } from 'models/data/AmendInfo';
import { ApiError } from 'models/data/ApiError';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IApplePayBookingPaymentInfo } from 'models/data/IAmendBookingRequestBody';
import { AmendmentType, IBookingInfo } from 'models/data/IBookingInfo';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IRoute } from 'models/data/IRoute';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import { AmendmentValidationErrors } from 'models/enum/amend/AmendmentValidationErrors';
import { AMEND_SEATS_UNAVAILABLE_API_ERRORS, ApiErrors } from 'models/enum/ApiErrors';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PaymentType } from 'models/enum/PaymentType';
import SitePath from 'models/enum/SitePath';
import { TermsAndConditionsMessageTypes } from 'models/enum/TermsAndConditionsMessageTypes';
import { IPaymentLabelsFields } from 'frontend/components/renderings/AmendPayment/interfaces';
import {
    gaApplePayButtonClickedWithoutAcceptingTermsAndConditions,
    gaBalancePaymentSuccess,
    gaRefundAmendmentsSuccess,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { AmendRoomAndBoardStore } from './amendRoomAndBoard/AmendRoomAndBoardStore';
import { AmendPaymentStore } from './AmendPaymentStore';

const refundData = {
    credit: {
        isEligible: true,
        credit: 2100,
    },
    refund: {
        isEligible: true,
        credit: 100,
        cash: 2000,
    },
    isEligible: true,
};

const transferPayload = {
    bookingReference: '70118791',
    lastName: 'Fisher',
    date: '2023-05-20',
    billingInfo: {
        fullName: 'Vobla Fisher',
        address: 'Szumiacych traw',
        address2: '',
        city: 'Warszawa',
        postCode: 'AA11BB',
    },
    selectedFlight: {
        amendmentCharges: 47.85,
        routes: [
            {
                arrDate: new Date(new Date().setDate(new Date().getDate() + 30)).toString(),
                arrLocation: 'Spain',
                arrName: 'Alicante',
                arrPt: 'ALC',
                avail: 8,
                car: 'EZY',
                cycDate: '2023-06-24',
                depDate: new Date(new Date().setDate(new Date().getDate() + 30)).toString(),
                depLocation: 'London',
                depName: 'London Luton',
                depPt: 'LTN',
                direction: 'outbound',
                fltNo: 'EZY2313',
                id: 'E4b48cb681ea3a672551aa2e851583f02',
                isExt: true,
                routeCd: 'ALCLTN6T',
            },
            {
                arrDate: new Date(new Date().setDate(new Date().getDate() + 30)).toString(),
                arrLocation: 'Spain',
                arrName: 'Alicante',
                arrPt: 'ALC',
                avail: 8,
                car: 'EZY',
                cycDate: '2023-06-24',
                depDate: new Date(new Date().setDate(new Date().getDate() + 30)).toString(),
                depLocation: 'London',
                depName: 'London Luton',
                depPt: 'LTN',
                direction: 'outbound',
                fltNo: 'EZY2313',
                id: 'E4b48cb681ea3a672551aa2e851583f02',
                isExt: true,
                routeCd: 'ALCLTN6T',
            },
        ] as IRoute[],
    } as IAmendTransport,
    selectedTransfer: {
        amendmentCharges: 47.85,
        transfer: {
            type: 'PRIVATE',
            iconUrl: '/-/jssmedia/465913cfa96442e889318cf4ef0427cb.ashx',
            content:
                "<ul>\n    <li>Get into holiday mode faster - less waiting when you upgrade to a private taxi transfer</li>\n    <li>You'll get a direct transfer to and from your hotel&nbsp;</li>\n</ul>",
            transferInfo: {
                arrivalInstr:
                    'Once you have collected your luggage, head towards the exit. Just before the automatic doors, to the right hand side, you will find the counter for the easyJet holidays team.  If you have any difficulty in locating your transfer please call our local partner on +34 606 551727 ',
                depInstr:
                    'When you’re going home we plan to collect you from your accommodation between 3 hours 05 minutes and 2 hours 35 minutes before your flight. Please ensure you are ready to go with all of your party and their luggage. The day before you are going home we’lln email your hotel reception to let them know your detailed pick-up information. If you have any problems with your transfer on the day of going home please contact our local partner on +34 606 551727 ',
                duration: 20,
            },
            code: 'JUMB010065PP',
            name: 'Private taxi',
            autoInclude: false,
            startDate: '2023-05-20T00:00:00',
            setType: 'EXTRA',
            typeCode: 'TF',
            prom: 'AUCI',
            quantity: 1,
            serviceStates: ['FIX', 'OPTION', 'QUOTE'],
            rateRule: 'DAY',
            method: 'PI',
            mcMethod: 'MANY',
            price: 60.64,
            minPax: 1,
            maxPax: 3,
            isHidden: false,
        },
    },
    selectedFlightFilters: [],
};

const deserializeAmendStore = (store: any, additionalData = {}) => {
    store.amendPaymentPayload = { amendPaymentPayload: transferPayload, ...additionalData };
};

const createRootStore = (data = {} as any) =>
    ({
        amendSeatsStore: {
            amendmentCharges: 0,
            initFromPayload: jest.fn(),
            ...(data.amendSeatsStore || {}),
        },
        layoutStore: {
            basePath: '/en/holidays',
            getPhrase: t => t,
            isAmendTransfersPage: false,
            isAmendFlightsPage: false,
            isCreditBookingEnabled: true,
            ...(data.layoutStore || {}),
        } as LayoutStore,
        routerStore: {
            redirectToHomePage: jest.fn(),
            redirectToViewBookingsPage: jest.fn(),
            redirectToLoginPage: jest.fn(),
            ...(data.routerStore || {}),
        },
        amendFlightsStore: {
            changeSelectedFlight: jest.fn(),
            ...(data.amendFlightsStore || {}),
        },
        amendTransfersStore: {
            changeSelectedTransfer: jest.fn(),
            ...(data.amendTransfersStore || {}),
        },
        userStore: {
            checkIfUserLoggedIn: jest.fn(() => true),
            ...(data.userStore || {}),
        },
        payBalanceStore: {
            toggleFocusAmountForPay: jest.fn(),
            ...(data.payBalanceStore || {}),
        },
        amendHotelStore: {
            newlySelectedHotelOffer: {},
        },
        payStore: {
            canPay: jest.fn(),
            setBillingInfo: jest.fn(),
            onForceErrors: jest.fn(),
            amount: 10,
            forceFieldErrors: false,
            amountToPay: 20,
            usedCredit: 30,
            setAmount: jest.fn(),
            setPaymentAuthorization: jest.fn(),
            clearCardInfo: jest.fn(),
            setSessionId: jest.fn(),
            clearUI: jest.fn(),
            setPaymentError: jest.fn(),
            setFailedToPay: jest.fn(),
            setPaymentErrors: jest.fn(),
            clearStore: jest.fn(),
            getCredit: jest.fn(),
            setCurrency: jest.fn(),
            ...(data.payStore || {}),
        },
        seatMapStore: {
            ShouldOpenSeatMapForced: false,
            setIsSelectedSeatsUnavailableError: jest.fn(),
        },
        amendDatesStore: data.amendDatesStore || {},
        amendRoomAndBoardStore: {
            setAreOptionsNotValidated: jest.fn(),
            loadRoomAndBoardData: jest.fn(),
        },
        viewBookingStore: {
            updateBookingInfo: jest.fn(),
        },
        paymentStore: { ...(data.paymentStore || {}) },
        paymentTypeStore: {
            selectedPaymentType: PaymentType.Card,
        },
    } as any);

const mockPushTrackingEvent = jest.fn();

const setAmendPaymentPayload = (store: any, payload = {}) => {
    store.amendPaymentPayload = payload;
};

Object.defineProperty(window, 'open', {
    configurable: true,
});
window.open = jest.fn();

jest.mock('frontend/services/booking.service', () => ({
    validateAmendAlternativeTransfersPrice: (_, data) => ({ transfers: data }),
    getAmendAlternativeFlightsWithLivePrice: (_, data) => ({ transports: data }),
    validateRefundAmount: data => data,
    amendCommitBooking: jest.fn(data => ({ data: { ...data, resultCode: 'resultCode' } })),
    viewBooking: jest.fn(() => Promise.resolve(() => ({ data: {} }))),
}));
jest.mock('frontend/utils/webStorage.utils', () => ({
    setWebStorageItem: jest.fn(),
}));
jest.mock('frontend/utils/submitForm', () => ({
    submitForm: jest.fn(),
}));
jest.mock('frontend/utils/viewBooking.utils', () => ({
    getBookingPayload: jest.fn(() => ({
        bookingReference: mockBooking.bookingReference,
        lastName: mockBooking.guests.find(g => g.isLead)?.lastName,
        date: mockBooking.package?.accom?.startDate,
        package: mockBooking.package,
        paymentInfo: mockBooking.paymentInfo,
    })),
}));

jest.mock('frontend/utils/paymentTransaction');
const mockIsTransactionProcessing = isTransactionProcessing as jest.MockedFn<typeof isTransactionProcessing>;
const mockGetTransaction = getTransaction as jest.MockedFn<typeof getTransaction>;
const mockGetTransactionId = getTransactionId as jest.MockedFn<typeof getTransactionId>;

jest.mock('frontend/services/logging', () => ({
    __esModule: true,
    logger: { info: jest.fn() },
}));
jest.mock('frontend/utils/payment.utls');

const mockGetAmendPaymentConfig = jest.fn();
jest.mock('frontend/components/renderings/AmendPayment/AmendPayment.utils', () => ({
    getAmendPaymentConfig: () => mockGetAmendPaymentConfig(),
}));

const mockCanPayRemainingBalance = jest.fn();
jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    canPayRemainingBalance: (...args) => mockCanPayRemainingBalance(...args),
}));

let mockStore: AmendPaymentStore;

describe('AmendPaymentStore', () => {
    let mockFlightStoreTotalPrice: number | undefined = 47.85;

    beforeEach(() => {
        mockStore = new AmendPaymentStore(
            createRootStore({
                flightsStore: {
                    promocodeBreakdown: 'flightsStore_promocodeBreakdown',
                },
                amendHotelStore: {
                    setIsNoAvailabilityError: jest.fn(),
                },
                payStore: {
                    onForceErrors: jest.fn(),
                },
            }),
        );
        mockGetAmendPaymentConfig.mockReturnValue({
            storeKey: 'amendFlightsStore',
            prevPage: SitePath.AmendFlights,
            labelKey: 'FlightLabel',
        });
        mockIsTransactionProcessing.mockReturnValue(true);
        mockGetTransaction.mockReturnValue({ q: 'getTransactionResult' } as any);
        Object.defineProperty(mockStore.rootStore.amendFlightsStore, 'totalPrice', {
            get: function () {
                return mockFlightStoreTotalPrice;
            },
        });

        mockStore.amendPaymentPayload = { selectedFlight: mockValidatedFlights.transports[0] } as any;
        mockStore.confirmPolicy = false;
    });

    describe('updateAmendPaymentPayload', () => {
        it('should update selectedFlight', () => {
            const mockValidatedFlight = { ...mockValidatedFlights.transports[0] };
            mockValidatedFlight.amendmentPaymentInfo!.amendmentCharges = 1000;

            mockStore.amendPaymentPayload = {
                selectedFlight: mockValidatedFlights.transports[0],
            } as IAmendPaymentPayload;

            mockStore.updateAmendPaymentPayload(mockValidatedFlight);

            expect(mockStore.amendPaymentPayload.selectedFlight!.amendmentPaymentInfo?.amendmentCharges).toBe(1000);
        });

        it('should update datesOffer', () => {
            const mockValidatedDatesOffer = {
                ...mockAmendDatesOfferWithPrice,
                amendmentPaymentInfo: {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: 1000,
                },
            };

            mockStore.rootStore.amendDatesStore.offerWithPrices = mockValidatedDatesOffer;

            mockStore.amendPaymentPayload = { amendDatesOffer: mockAmendDatesOfferWithPrice } as IAmendPaymentPayload;

            mockStore.updateAmendPaymentPayload();

            expect(mockStore.amendPaymentPayload.amendDatesOffer!.amendmentPaymentInfo!.amendmentCharges).toBe(1000);
        });

        it('should update amendRoomAndBoardOffer', () => {
            const mockValidatedFlight = { ...mockValidatedFlights.transports[0] };
            mockValidatedFlight.amendmentPaymentInfo!.amendmentCharges = 1000;

            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
            } as IAmendPaymentPayload;

            mockStore.updateAmendPaymentPayload({
                ...mockRoomAndBoardRoomVariant,
                amendmentPaymentInfo: {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: 1000,
                },
            });

            expect(
                mockStore.amendPaymentPayload.amendRoomAndBoardOffer!.selectedRoomVariant.amendmentPaymentInfo
                    ?.amendmentCharges,
            ).toBe(1000);
        });

        it('should update hotel flow', () => {
            mockStore.amendPaymentPayload = {
                amendHotelOffer: mockAmendHotelOffer,
                bookingReference: 'bookingReference',
                date: '2025-11-22',
                lastName: 'bookingReference',
                package: mockBooking.package,
                paymentInfo: mockPaymentInfo,
            };

            mockStore.updateAmendPaymentPayload({
                ...mockAmendHotelOffer,
                amendmentPaymentInfo: {
                    ...mockAmendPaymentInfo,
                    amendmentCharges: 1000,
                },
            });

            expect(mockStore.amendPaymentPayload.amendHotelOffer!.amendmentPaymentInfo!.amendmentCharges).toBe(1000);
        });
    });

    describe('isProductUnavailable', () => {
        it('should return true if isAmendItemUnavailable is true', () => {
            mockStore.isAmendItemUnavailable = true;

            expect(mockStore.isProductUnavailable).toBe(true);
        });

        it('should return true if amendFlightsStore.isPrevSelectedFlightUnavailable is true', () => {
            mockStore.rootStore.amendFlightsStore.isPrevSelectedFlightUnavailable = true;

            expect(mockStore.isProductUnavailable).toBe(true);
        });

        it('should return true if amendRoomAndBoardStore.areOptionsNotValidated is true', () => {
            mockStore.rootStore.amendRoomAndBoardStore.areOptionsNotValidated = true;

            expect(mockStore.isProductUnavailable).toBe(true);
        });

        it('should return true if amendDatesStore.isValidatedOfferUnavailable is true', () => {
            mockStore.rootStore.amendDatesStore.isValidatedOfferUnavailable = true;

            expect(mockStore.isProductUnavailable).toBe(true);
        });

        it('should return undefined if does not meet any criteria above', () => {
            expect(mockStore.isProductUnavailable).toBe(undefined);
        });
    });

    describe('redirectFromPaymentPage', () => {
        it('Should call setWebStorageItem and window.open', () => {
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.redirectFromPaymentPage(SitePath.AmendDates);

            expect(setWebStorageItem).toHaveBeenCalledWith(
                'amend-booking-payload',
                expect.objectContaining({
                    trackingData: mockAmendPaymentPayload.trackingData,
                }),
                {},
            );
            expect(window.open).toHaveBeenCalledWith(
                `${mockStore.rootStore.layoutStore.basePath + SitePath.AmendDates}`,
                '_self',
            );
        });

        it('should call setWebStorageItem with amend dates from amendPaymentPayload', () => {
            mockStore.rootStore.amendDatesStore.offerWithPrices = null;
            mockStore.amendPaymentPayload!.amendDatesOffer = mockAmendDatesOfferWithPrice;

            mockStore.redirectFromPaymentPage(SitePath.AmendDates);

            expect(setWebStorageItem).toHaveBeenCalledWith(
                'amend-booking-payload',
                {
                    bookingReference: undefined,
                    lastName: undefined,
                    date: undefined,
                    selectedTransfer: undefined,
                    selectedSeats: undefined,
                    amendDatesOffer: mockAmendDatesOfferWithPrice,
                    amendRoomAndBoardOffer: undefined,
                    amendHotelOffer: {},
                    selectedFlight: mockStore.amendPaymentPayload!.selectedFlight,
                    selectedFlightFilters: undefined,
                    redirectedByBreadcrumbs: undefined,
                    isFromAmendFlight: true,
                    isFromAmendTransfer: false,
                },
                sessionStorage,
            );
        });

        it('should call setWebStorageItem with amend dates from store', () => {
            const mockAmendDatesOffer = {
                ...mockAmendDatesOfferWithPrice,
                amendmentDatesCharges: 135,
            };
            mockStore.rootStore.amendDatesStore.offerWithPrices = mockAmendDatesOffer;
            mockStore.amendPaymentPayload!.amendDatesOffer = mockAmendDatesOfferWithPrice;

            mockStore.redirectFromPaymentPage(SitePath.AmendDates);

            expect(setWebStorageItem).toHaveBeenCalledWith(
                'amend-booking-payload',
                {
                    bookingReference: undefined,
                    lastName: undefined,
                    date: undefined,
                    selectedTransfer: undefined,
                    selectedSeats: undefined,
                    amendDatesOffer: mockAmendDatesOffer,
                    amendRoomAndBoardOffer: undefined,
                    amendHotelOffer: {},
                    selectedFlight: mockStore.amendPaymentPayload!.selectedFlight,
                    selectedFlightFilters: undefined,
                    redirectedByBreadcrumbs: undefined,
                    isFromAmendFlight: true,
                    isFromAmendTransfer: false,
                },
                sessionStorage,
            );
        });
    });

    describe('storeKey', () => {
        it('Should set value based on storeKey from amendPaymentConfig', () => {
            expect(mockStore.storeKey).toEqual('amendFlightsStore');
        });

        it('should return undefined when getAmendPaymentConfig return undefined', () => {
            mockGetAmendPaymentConfig.mockReturnValueOnce(undefined);

            expect(mockStore.storeKey).toEqual(undefined);
        });
    });

    describe('totalPrice', () => {
        it('Should return totalPrice based on storeKey from amendPaymentConfig', () => {
            expect(mockStore.totalPrice).toEqual(47.85);
        });

        it('Should return totalPrice as 0 when appropriate store has totalPrice as 0', () => {
            mockFlightStoreTotalPrice = undefined;

            expect(mockStore.totalPrice).toEqual(0);
        });
    });

    it('should call isOnlyCreditRefund', () => {
        mockFlightStoreTotalPrice = -10;
        mockStore.refundData = {
            refund: {
                cash: 0,
                credit: 10,
            },
        } as any;

        expect(mockStore.isOnlyCreditRefund).toBeTruthy();
    });

    describe('toggleErrorPopupVisibility', () => {
        it('Should update isErrorPopupShown prop', () => {
            mockStore.toggleErrorPopupVisibility(true);

            expect(mockStore.isErrorPopupShown).toBe(true);
        });

        it('Should update isErrorPopupShown prop by default value', () => {
            mockStore.toggleErrorPopupVisibility();

            expect(mockStore.isErrorPopupShown).toBe(false);
        });
    });

    it('should call deserializeAmendStore while isFromAmendFlight is true', () => {
        deserializeAmendStore(mockStore, { selectedFlight: transferPayload.selectedTransfer });

        expect(mockStore.isFromAmendFlight).toBeTruthy();
    });

    it('should call deserializeAmendStore while isFromAmendTransfer is true', () => {
        deserializeAmendStore(mockStore, { selectedTransfer: transferPayload.selectedTransfer });

        expect(mockStore.isFromAmendTransfer).toBeTruthy();
    });

    describe('canPay', () => {
        it('should return true if paymentOption is Part and confirmPolicy is true', () => {
            mockStore.paymentOption = PaymentOption.Part;
            mockStore.confirmPolicy = true;
            expect(mockStore.canPay).toBeTruthy();
        });

        it('should return true if paymentOption is AddToBalance and confirmPolicy is true', () => {
            mockStore.paymentOption = PaymentOption.AddToBalance;
            mockStore.confirmPolicy = true;
            (mockStore.rootStore.payStore as any).canPay = true;
            expect(mockStore.canPay).toBeTruthy();
        });

        it('should return true if totalPrice is 0 and confirmPolicy is true', () => {
            mockStore.paymentOption = PaymentOption.Full;
            jest.spyOn(mockStore, 'totalPrice', 'get').mockReturnValue(0);
            mockStore.confirmPolicy = true;
            expect(mockStore.canPay).toBeTruthy();
        });

        it('should return false if totalPrice is 0 and confirmPolicy is false', () => {
            mockStore.paymentOption = PaymentOption.Full;
            jest.spyOn(mockStore, 'totalPrice', 'get').mockReturnValue(0);
            mockStore.confirmPolicy = false;
            expect(mockStore.canPay).toBeFalsy();
        });
    });

    it('should canRefund be truthy', () => {
        mockFlightStoreTotalPrice = -10;
        mockStore.refundData = refundData as any;

        expect(mockStore.canRefund).toBeTruthy();
    });

    it('should canCashOnlyRefund be truthy', () => {
        mockFlightStoreTotalPrice = -10;
        mockStore.refundData = { refund: { ...refundData.refund, cash: 10, credit: 0 } } as any;
        expect(mockStore.canCashOnlyRefund).toBeTruthy();
    });

    describe('isFlightAndHotelPackage', () => {
        it('should return true when booking has FlightAndHotel promo collection', () => {
            mockStore.booking = { ...mockBooking, promoCollections: [OfferPromotionCodes.FlightAndHotel] };

            expect(mockStore.isFlightAndHotelPackage).toBe(true);
        });

        it('should return false when booking has no promo collections', () => {
            mockStore.booking = { ...mockBooking, promoCollections: [] };

            expect(mockStore.isFlightAndHotelPackage).toBe(false);
        });

        it('should return false when booking has no promoCollections property', () => {
            mockStore.booking = { ...mockBooking };

            expect(mockStore.isFlightAndHotelPackage).toBe(false);
        });

        it('should return false when booking is undefined', () => {
            mockStore.booking = undefined;

            expect(mockStore.isFlightAndHotelPackage).toBe(false);
        });
    });

    it('should handle balanceDueAmount', () => {
        mockFlightStoreTotalPrice = -10;
        mockStore.refundData = refundData as any;

        expect(mockStore.canCredit).toBeTruthy();
        expect(mockStore.isRefund).toBeTruthy();
    });

    it('should return false for canCredit when isFlightAndHotelPackage is true', () => {
        mockFlightStoreTotalPrice = -10;
        mockStore.refundData = refundData as any;
        mockStore.booking = { ...mockBooking, promoCollections: [OfferPromotionCodes.FlightAndHotel] };

        expect(mockStore.canCredit).toBe(false);
    });

    it('should handle amountTakenFromBalance', () => {
        expect(mockStore.amountTakenFromBalance).toBe(0);
        mockFlightStoreTotalPrice = -10;
        mockStore.booking = mockBooking;
        expect(mockStore.amountTakenFromBalance).toBe(1);
    });

    describe('newBalanceAmount', () => {
        beforeEach(() => {
            mockStore.rootStore.amendTransfersStore.selectedTransfer = mockTransferWithAmendmentCharges;
        });

        it('should return correct newBalanceAmount for non-refund', () => {
            jest.spyOn(mockStore, 'isRefund', 'get').mockReturnValueOnce(false);
            jest.spyOn(mockStore, 'balanceAmount', 'get').mockReturnValue(10);
            jest.spyOn(mockStore, 'totalPrice', 'get').mockReturnValue(20);
            jest.spyOn(mockStore, 'amountToPay', 'get').mockReturnValue(10);

            expect(mockStore.newBalanceAmount).toBe(20);
        });

        it('should return correct newBalanceAmount for refund', () => {
            mockStore.rootStore.amendTransfersStore.selectedTransfer = {
                ...mockTransferWithAmendmentCharges,
                amendmentCharges: -10,
            };
            mockStore.booking = {
                ...mockBooking,
                paymentInfo: { balanceDueAmount: 100 } as IPaymentInfo,
            } as IBookingInfo;

            expect(mockStore.newBalanceAmount).toBe(90);
        });
    });

    it('should handle remainingToRefund', () => {
        mockFlightStoreTotalPrice = 20;
        mockStore.booking = { paymentInfo: { balanceDueAmount: 10 } as IPaymentInfo } as IBookingInfo;
        expect(mockStore.remainingToRefund).toBe(10);
    });

    it('should handle amendPassingConditionKey', () => {
        mockFlightStoreTotalPrice = 10;
        mockStore.booking = { paymentInfo: { balanceDueAmount: 20 } as IPaymentInfo } as IBookingInfo;
        expect(mockStore.amendPassingConditionKey).toBe(TermsAndConditionsMessageTypes.PayRemainingBalanceTC);

        mockFlightStoreTotalPrice = -10;
        mockStore.booking = { paymentInfo: { balanceDueAmount: -20 } as IPaymentInfo } as IBookingInfo;
        mockStore.refundData = { refund: { cash: {}, credit: null, isEligible: true } } as any;
        mockStore.isCreditRefund = false;
        expect(mockStore.amendPassingConditionKey).toBe(TermsAndConditionsMessageTypes.CashRefundOnlyTC);

        mockStore.isCreditRefund = true;
        expect(mockStore.amendPassingConditionKey).toBe(TermsAndConditionsMessageTypes.CreditRefundTC);

        mockStore.refundData = { refund: { cash: {}, credit: null, isEligible: false } } as any;
        mockStore.isCreditRefund = false;
        expect(mockStore.amendPassingConditionKey).toBe(undefined);
    });

    describe('validateFlight', () => {
        it('should throw an error when flight is unavailable', async () => {
            deserializeAmendStore(mockStore, transferPayload);
            const flight = await mockStore.validateFlight(transferPayload.selectedTransfer as any);

            expect(flight.transport.transfer.code).toBe(transferPayload.selectedTransfer.transfer.code);

            // Unavailable flight
            bookingService.getAmendAlternativeFlightsWithLivePrice = jest.fn(async () => ({ transports: [] }));
            const emptyTransportStore = new AmendPaymentStore(createRootStore());
            deserializeAmendStore(emptyTransportStore, transferPayload);
            let error;
            try {
                await emptyTransportStore.validateFlight(transferPayload.selectedTransfer as any);
            } catch (e) {
                error = e;
            }

            expect(emptyTransportStore.isAmendItemUnavailable).toBe(true);
            expect(error).toEqual(new Error(AmendmentValidationErrors.FlightNotAvailable));
        });

        it('should throw an error when flight is unavailable', async () => {
            mockStore.amendPaymentPayload = undefined;
            let error;

            try {
                await mockStore.validateFlight(mockValidatedFlights.transports[0]);
            } catch (e) {
                error = e;
            }

            expect(error).toEqual(new Error(AmendmentValidationErrors.PayloadExpected));
        });
    });

    describe('validateTransfer', () => {
        it('should throw an error when no transports', async () => {
            deserializeAmendStore(mockStore, transferPayload);

            const transfer = await mockStore.validateTransfer(transferPayload.selectedTransfer as any);

            expect(transfer.code).toBe(transferPayload.selectedTransfer.transfer.code);

            // Unavailable transfer
            bookingService.validateAmendAlternativeTransfersPrice = jest.fn(async () => ({ transports: [] }));
            const emptyTransportStore = new AmendPaymentStore(createRootStore());
            deserializeAmendStore(emptyTransportStore, transferPayload);
            let error;
            try {
                await emptyTransportStore.validateTransfer(transferPayload.selectedTransfer as any);
            } catch (e) {
                error = e;
            }
            expect(emptyTransportStore.isAmendItemUnavailable).toBe(true);
            expect(error).toEqual(new Error(AmendmentValidationErrors.TransferNotAvailable));
        });

        it('should throw an error when no amendPaymentPayload', async () => {
            mockStore.amendPaymentPayload = undefined;
            let error;

            try {
                await mockStore.validateTransfer(mockTransferWithAmendmentCharges);
            } catch (e) {
                error = e;
            }

            expect(error).toEqual(new Error(AmendmentValidationErrors.PayloadExpected));
        });
    });

    describe('validateRoomAndBoard', () => {
        const mockAmendPaymentPayloadWithRoomAndBoard = {
            ...mockAmendPaymentPayload,
            amendRoomAndBoardOffer: {
                roomVariants: [mockRoomAndBoardRoomVariant],
                selectedRoomVariant: mockRoomAndBoardRoomVariant,
            },
        };

        it('Should return validated room variant', async () => {
            bookingService.amendRoomAndBoardValidateOffer = jest
                .fn()
                .mockReturnValueOnce([mockRoomAndBoardRoomVariant]);
            jest.mocked(mockStore.rootStore.amendRoomAndBoardStore.loadRoomAndBoardData).mockImplementationOnce(
                () =>
                    new Promise(res => {
                        mockStore.rootStore.amendRoomAndBoardStore.cachedRoomVariants = [
                            { ...mockRoomAndBoardRoomVariant, roomType: 'cached_room_variant' },
                        ];
                        res();
                    }),
            );

            const result = await mockStore.validateRoomAndBoard(mockAmendPaymentPayloadWithRoomAndBoard);

            expect(mockStore.rootStore.amendRoomAndBoardStore.loadRoomAndBoardData).toHaveBeenCalled();
            expect(bookingService.amendRoomAndBoardValidateOffer).toHaveBeenCalledWith(
                mockRoomAndBoardRoomVariant,
                [{ ...mockRoomAndBoardRoomVariant, roomType: 'cached_room_variant' }],
                mockBooking.bookingReference,
                'discountCode',
            );
            expect(result).toEqual({ ...mockRoomAndBoardRoomVariant });
        });

        it('Should throw error if no amendRoomAndBoardOffer', async () => {
            bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce([
                {
                    ...mockRoomAndBoardRoomVariant,
                    units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'test_code' }],
                },
            ]);

            try {
                await mockStore.validateRoomAndBoard({
                    ...mockAmendPaymentPayloadWithRoomAndBoard,
                });
            } catch (e) {
                expect(e).toEqual(new Error(AmendmentValidationErrors.RoomAndBoardNotAvailable));
            }
        });

        it('Should call setAreOptionsNotValidated if no there are no validated options', async () => {
            bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce([]);

            try {
                await mockStore.validateRoomAndBoard(mockAmendPaymentPayloadWithRoomAndBoard);
            } catch (e) {
                expect(e).toEqual(new Error(AmendmentValidationErrors.RoomAndBoardNotAvailable));
            }

            expect(mockStore.rootStore.amendRoomAndBoardStore.setAreOptionsNotValidated).toHaveBeenCalledWith(true);
        });

        it('Should call setAreOptionsNotValidated if cached amendRoomAndBoard variant has not been found', async () => {
            bookingService.amendRoomAndBoardValidateOffer = jest.fn().mockReturnValueOnce([
                {
                    ...mockRoomAndBoardRoomVariant,
                    units: [{ ...mockRoomAndBoardRoomVariant.units[0], code: 'test_code' }],
                },
            ]);

            try {
                await mockStore.validateRoomAndBoard(mockAmendPaymentPayloadWithRoomAndBoard);
            } catch (e) {
                expect(e).toEqual(new Error(AmendmentValidationErrors.RoomAndBoardNotAvailable));
            }

            expect(mockStore.rootStore.amendRoomAndBoardStore.setAreOptionsNotValidated).toHaveBeenCalledWith(true);
        });

        it('Should throw PayloadExpected error if no amendRoomAndBoard payload', async () => {
            let error;

            try {
                await mockStore.validateRoomAndBoard({
                    ...mockAmendPaymentPayloadWithRoomAndBoard,
                    amendRoomAndBoardOffer: undefined,
                });
            } catch (e) {
                error = e;
            }

            expect(error).toEqual(new Error(AmendmentValidationErrors.PayloadExpected));
        });

        it('Should return selectedRoomVariant directly and set roomVariants when isMultiroom is true', async () => {
            bookingService.amendRoomAndBoardValidateOffer = jest.fn();

            const result = await mockStore.validateRoomAndBoard({
                ...mockAmendPaymentPayloadWithRoomAndBoard,
                isMultiroom: true,
            });

            expect(mockStore.rootStore.amendRoomAndBoardStore.loadRoomAndBoardData).not.toHaveBeenCalled();
            expect(bookingService.amendRoomAndBoardValidateOffer).not.toHaveBeenCalled();
            expect(mockStore.rootStore.amendRoomAndBoardStore.roomVariants).toEqual([mockRoomAndBoardRoomVariant]);
            expect(result).toEqual(mockRoomAndBoardRoomVariant);
        });
    });

    describe('validateHotel', () => {
        it('Should return validated hotel', async () => {
            mockStore.rootStore.viewBookingStore.booking = mockBooking;
            bookingService.validateAlternativeAmendHotel = jest
                .fn()
                .mockReturnValueOnce({ amendHotelOffer: mockAmendHotelOffer });

            const result = await mockStore.validateHotel(mockAmendHotelOffer);

            expect(bookingService.validateAlternativeAmendHotel).toHaveBeenCalledWith(
                mockBooking.bookingReference,
                mockAmendHotelOffer,
            );
            expect(result).toEqual(mockAmendHotelOffer);
        });

        it('Should throw error if no booking', async () => {
            mockStore.rootStore.viewBookingStore.booking = null;
            mockStore.rootStore.amendHotelStore.setIsNoAvailabilityError = jest.fn();

            const result = await mockStore.validateHotel(mockAmendHotelOffer);

            expect(result).toStrictEqual(mockAmendHotelOffer);
            expect(mockStore.rootStore.amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(true);
            expect(mockStore.isAmendItemUnavailable).toBe(true);
        });
    });

    describe('getAmendmentValidator', () => {
        it('Should return validateTransfer() if selectedTransfer is passed', () => {
            mockStore.validateTransfer = jest.fn();
            deserializeAmendStore(mockStore, { selectedTransfer: transferPayload.selectedTransfer });
            mockStore.getAmendmentValidator(mockStore.amendPaymentPayload!);

            expect(mockStore.validateTransfer).toHaveBeenCalledWith(transferPayload.selectedTransfer);
        });

        it('Should call validateFlight if selectedFlight is passed', () => {
            mockStore.validateFlight = jest.fn();
            deserializeAmendStore(mockStore, { selectedFlight: transferPayload.selectedFlight });
            mockStore.getAmendmentValidator(mockStore.amendPaymentPayload!);

            expect(mockStore.validateFlight).toHaveBeenCalledWith(transferPayload.selectedFlight);
        });

        it('Should call validateRoomAndBoard if amendRoomAndBoardOffer is passed', () => {
            mockStore.validateRoomAndBoard = jest.fn();
            const mockRoomAndBoardOffer = {
                roomVariants: [mockRoomAndBoardRoomVariant],
                selectedRoomVariant: mockRoomAndBoardRoomVariant,
            };
            deserializeAmendStore(mockStore, {
                amendRoomAndBoardOffer: mockRoomAndBoardOffer,
            });
            mockStore.getAmendmentValidator(mockStore.amendPaymentPayload!);

            expect(mockStore.validateRoomAndBoard).toHaveBeenCalledWith({
                ...mockStore.amendPaymentPayload,
                amendRoomAndBoardOffer: mockRoomAndBoardOffer,
            });
        });

        it('Should call validateHotel if amendHotelOffer is passed', () => {
            mockStore.validateHotel = jest.fn();
            setAmendPaymentPayload(mockStore, { amendHotelOffer: mockAmendHotelOffer });
            mockStore.getAmendmentValidator(mockStore.amendPaymentPayload!);

            expect(mockStore.validateHotel).toHaveBeenCalledWith(mockAmendHotelOffer);
        });
    });

    describe('handleUpdatePrice', () => {
        it('Should call changeSelectedFlight and update prices if selectedFlight is passed', async () => {
            mockStore.rootStore.amendFlightsStore.changeSelectedFlight = jest.fn();
            mockStore.rootStore.amendFlightsStore.selectedFlight = {
                ...transferPayload.selectedFlight,
                amendmentPaymentInfo: mockAmendPaymentInfo,
            };
            const validatedAmendment = [{ price: 10 }];
            deserializeAmendStore(mockStore, { selectedFlight: transferPayload.selectedFlight });
            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, validatedAmendment);

            expect(mockStore.rootStore.amendFlightsStore.changeSelectedFlight).toHaveBeenCalledWith(validatedAmendment);
            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendPaymentInfo);
            expect(mockStore.prevSelectedItemPrice).toEqual(transferPayload.selectedFlight.amendmentCharges);
        });

        it('Should call changeSelectedTransfer and update prices if selectedTransfer is passed', async () => {
            mockStore.rootStore.amendTransfersStore.changeSelectedTransfer = jest.fn();
            mockStore.rootStore.amendTransfersStore.selectedTransfer = transferPayload.selectedTransfer as any;
            const validatedAmendment = [{ price: 10 }];
            deserializeAmendStore(mockStore, { selectedTransfer: transferPayload.selectedTransfer });
            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, validatedAmendment);

            expect(mockStore.rootStore.amendTransfersStore.changeSelectedTransfer).toHaveBeenCalledWith(
                validatedAmendment,
            );
            expect(mockStore.selectedItemPrice).toEqual(transferPayload.selectedTransfer.amendmentCharges);
            expect(mockStore.prevSelectedItemPrice).toEqual(transferPayload.selectedTransfer.amendmentCharges);
        });

        it('Should call seats initFromPayload if selectedSeats is passed', async () => {
            mockStore.rootStore.amendSeatsStore.initFromPayload = jest.fn();
            deserializeAmendStore(mockStore, { selectedSeats: [mockSelectedSeat] });
            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, {});

            expect(mockStore.rootStore.amendSeatsStore.initFromPayload).toHaveBeenCalled();
        });

        it('Should call initializeAmendDatesPaymentPage and update prices if amendDatesOffer is passed', async () => {
            mockStore.rootStore.amendDatesStore = mockAmendDatesStore as any;
            mockStore.booking = mockBooking;
            deserializeAmendStore(mockStore, { amendDatesOffer: mockAmendDatesOfferWithPrice });
            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, {});

            expect(mockStore.rootStore.amendDatesStore.initializeAmendDatesPaymentPage).toHaveBeenCalledWith(
                mockStore.booking,
                mockAmendDatesOfferWithPrice,
            );
            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendDatesStore.offerPrices?.amendmentPaymentInfo);
            expect(mockStore.prevSelectedItemPrice).toEqual(mockAmendDatesOfferWithPrice.amendmentDatesCharges);
        });

        it('Should throw error if no booking when amendDatesOffer is passed', async () => {
            let error;
            deserializeAmendStore(mockStore, { amendDatesOffer: mockAmendDatesOfferWithPrice });
            mockStore.booking = undefined;

            try {
                await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, {});
            } catch (e) {
                error = e;
            }

            expect(error).toEqual(new Error(AmendmentValidationErrors.BookingExpected));
        });

        it('Should update prices if amendRoomAndBoardOffer is passed', async () => {
            deserializeAmendStore(mockStore, {
                amendRoomAndBoardOffer: {
                    roomVariants: [mockRoomAndBoardRoomVariant],
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                },
            });

            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, mockRoomAndBoardRoomVariant);

            expect(mockStore.prevSelectedItemPrice).toEqual(mockRoomAndBoardRoomVariant.fullAmendmentCharges);
            expect(mockStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant).toEqual(mockRoomAndBoardRoomVariant);
            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendPaymentInfo);
        });

        it('Should update prices if amendHotelOffer is passed', async () => {
            setAmendPaymentPayload(mockStore, { amendHotelOffer: mockAmendHotelOffer });

            await mockStore.handleUpdatePrice(mockStore.amendPaymentPayload!, mockAmendHotelOffer);

            expect(mockStore.selectedItemPrice).toEqual(mockAmendHotelOffer.amendmentChargesInfo!.fullAmendmentCharges);
            expect(mockStore.prevSelectedItemPrice).toEqual(
                mockAmendHotelOffer.amendmentChargesInfo!.fullAmendmentCharges,
            );
            expect(mockStore.amendmentPaymentInfo).toStrictEqual(mockAmendHotelOffer.amendmentPaymentInfo);
        });
    });

    describe('getBookingAndValidateAmendment', () => {
        it('Should call viewBooking and validateAmendment', async () => {
            const validateAmendment = jest.fn().mockResolvedValue([{ price: 10 }]);
            bookingService.viewBooking = jest.fn().mockResolvedValue({ data: mockBooking });
            mockStore.getAmendmentValidator = jest.fn().mockResolvedValue(validateAmendment());

            const { booking, validatedAmendment } = await mockStore.getBookingAndValidateAmendment(
                mockAmendPaymentPayload,
            );

            expect(mockStore.rootStore.viewBookingStore.updateBookingInfo).toHaveBeenCalledWith(
                expect.objectContaining(mockBooking),
            );
            expect(bookingService.viewBooking).toHaveBeenCalledWith(
                mockAmendPaymentPayload.date,
                mockAmendPaymentPayload.bookingReference,
                mockAmendPaymentPayload.lastName,
            );
            expect(validateAmendment).toHaveBeenCalled();
            expect(booking).toEqual(mockBooking);
            expect(validatedAmendment).toEqual([{ price: 10 }]);
        });

        it('Should call getCredit when isCreditBookingEnabled is true', async () => {
            mockStore.rootStore.payStore.getCredit = jest.fn();

            await mockStore.getBookingAndValidateAmendment(mockAmendPaymentPayload);

            expect(mockStore.rootStore.payStore.getCredit).toHaveBeenCalled();
        });
    });

    describe('setBillingInfo', () => {
        it('Should call setBillingInfo from payStore', () => {
            mockStore.rootStore.payStore.setBillingInfo = jest.fn();
            mockStore.setBillingInfo(mockBillingInfo as BillingInfo);

            expect(mockStore.rootStore.payStore.setBillingInfo).toHaveBeenCalledWith(
                mockBillingInfo.fullName,
                mockBillingInfo.address,
                mockBillingInfo.city,
                mockBillingInfo.postCode,
                mockBillingInfo.address2,
            );
        });
    });

    describe('handleTransaction', () => {
        it('Should call onPay if bookingReference === transaction.q and isTransactionProcessing', () => {
            mockStore.onPay = jest.fn();
            mockStore.handleTransaction('getTransactionResult');

            expect(mockStore.onPay).toHaveBeenCalledWith(undefined, true);
        });

        it('Should call startNewTransaction if isTransactionProcessing is false', () => {
            mockStore.onPay = jest.fn();
            mockIsTransactionProcessing.mockReturnValue(false);
            mockStore.handleTransaction('getTransactionResult');

            expect(startNewTransaction).toHaveBeenCalledWith('getTransactionResult');
        });

        it('Should call startNewTransaction if bookingReference !== transaction.q', () => {
            mockStore.onPay = jest.fn();
            mockStore.handleTransaction('getTransactionResult2');

            expect(startNewTransaction).toHaveBeenCalledWith('getTransactionResult2');
        });

        it('Should call startNewTransaction if no transaction', () => {
            mockStore.onPay = jest.fn();
            mockGetTransaction.mockReturnValue(null);
            mockStore.handleTransaction('getTransactionResult');

            expect(startNewTransaction).toHaveBeenCalledWith('getTransactionResult');
        });
    });

    describe('initialize', () => {
        beforeEach(() => {
            bookingService.viewBooking = jest
                .fn()
                .mockResolvedValue({ data: { isLoggedInAsLeadPassenger: true, paymentInfo: { currency: 'CHF' } } });
        });

        afterAll(() => {
            jest.resetAllMocks();
        });

        it('should handle initialize', async () => {
            const emptyStore = new AmendPaymentStore(createRootStore());
            await emptyStore.initialize();

            expect(emptyStore.rootStore.payStore.clearStore).toHaveBeenCalled();
            expect(emptyStore.rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();

            mockStore = new AmendPaymentStore(
                createRootStore({
                    layoutStore: {
                        isCreditBookingEnabled: true,
                    },
                    amendRoomAndBoardStore: {
                        chosenRoomVariant: mockRoomAndBoardRoomVariant,
                    },
                }),
            );
            deserializeAmendStore(mockStore, {
                selectedFlight: transferPayload.selectedFlight,
                selectedTransfer: transferPayload.selectedTransfer,
                amendRoomAndBoardOffer: {
                    roomVariants: [mockRoomAndBoardRoomVariant],
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                },
                billingInfo: {},
            });
            mockStore.validateTransfer = jest.fn().mockResolvedValue({ data: [transferPayload.selectedTransfer] });
            mockStore.validateFlight = jest.fn().mockResolvedValue({ data: [transferPayload.selectedFlight] });
            mockStore.validateRoomAndBoard = jest.fn().mockResolvedValue([mockRoomAndBoardRoomVariant]);
            mockStore.updateAmendPaymentPayload = jest.fn();

            await mockStore.initialize();

            expect(bookingService.viewBooking).toHaveBeenCalled();
            expect(mockStore.rootStore.amendTransfersStore.changeSelectedTransfer).toHaveBeenCalled();
            expect(mockStore.rootStore.amendFlightsStore.changeSelectedFlight).toHaveBeenCalled();
            expect(mockStore.updateAmendPaymentPayload).toHaveBeenCalled();

            Object.defineProperty(mockStore, 'isRefund', { get: () => false });
            Object.defineProperty(mockStore, 'canAddToBalance', { get: () => true });
            mockStore.onChangePaymentOption = jest.fn();
            await mockStore.initialize();

            Object.defineProperty(mockStore, 'isRefund', { get: () => true });
            mockStore.validateRefundAmount = jest.fn();
            await mockStore.initialize();

            expect(mockStore.validateRefundAmount).toHaveBeenCalled();

            // Not logged
            mockStore.rootStore.userStore.checkIfUserLoggedIn = jest.fn(async () => false);
            await mockStore.initialize();

            expect(mockStore.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();

            // ReInvoke onPay
            const reInvokeStore = new AmendPaymentStore(createRootStore());
            deserializeAmendStore(mockStore);
            reInvokeStore.onPay = jest.fn();
            reInvokeStore.amendPaymentPayload = {
                bookingReference: 'getTransactionResult',
            } as any;

            await reInvokeStore.initialize();
            expect(reInvokeStore.onPay).toHaveBeenCalled();

            // Catch errors
            mockStore.rootStore.userStore.checkIfUserLoggedIn = jest.fn(async () => true);
            bookingService.viewBooking = jest.fn(() => {
                throw 'Test error';
            });
            await mockStore.initialize();
            expect(mockStore.isLoadingDataError).toBe(true);
            expect(mockStore.isLoadingData).toBe(false);
            expect(setWebStorageItem).toHaveBeenCalled();
        });

        it('Should set currency', async () => {
            const setCurrency = jest.fn();
            mockStore = new AmendPaymentStore(
                createRootStore({
                    layoutStore: {
                        isCreditBookingEnabled: true,
                    },
                    payStore: {
                        setCurrency,
                    },
                }),
            );
            mockStore.amendPaymentPayload = { selectedSeats: true } as any;

            await mockStore.initialize();

            expect(setCurrency).toBeCalledWith('CHF');
        });

        it('Should invoke amendDatesStore initialize method if in payload that has been putted in post request exists amend dates full offer', async () => {
            mockStore = new AmendPaymentStore(createRootStore({ amendDatesStore: mockAmendDatesStore }));
            deserializeAmendStore(mockStore, { amendDatesOffer: mockAmendDatesOfferWithPrice });

            await mockStore.initialize();

            expect(mockStore.rootStore.amendDatesStore.initializeAmendDatesPaymentPage).toHaveBeenCalledWith(
                { isLoggedInAsLeadPassenger: true, paymentInfo: { currency: 'CHF' } },
                mockAmendDatesOfferWithPrice,
            );
            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendDatesStore.offerPrices?.amendmentPaymentInfo);
            expect(mockStore.prevSelectedItemPrice).toEqual(mockAmendDatesOfferWithPrice.amendmentDatesCharges);
        });

        it('Should NOT invoke amendDatesStore initialize method if in payload that has NOT been putted in post request exists amend dates full offer', async () => {
            mockStore = new AmendPaymentStore(createRootStore({ amendDatesStore: mockAmendDatesStore }));
            deserializeAmendStore(mockStore, { amendDatesOffer: null });

            await mockStore.initialize();

            expect(mockStore.rootStore.amendDatesStore.initializeAmendDatesPaymentPage).not.toHaveBeenCalled();
        });

        it('should set amendmentPaymentInfo and prevSelectedItemPrice for flights', async () => {
            mockStore = new AmendPaymentStore(
                createRootStore({
                    amendFlightsStore: {
                        selectedFlight: {
                            ...transferPayload.selectedFlight,
                            amendmentCharges: 50,
                            amendmentPaymentInfo: mockAmendPaymentInfo,
                        },
                    },
                }),
            );
            mockStore.validateFlight = jest.fn(() =>
                Promise.resolve(() => ({ data: [transferPayload.selectedFlight] } as any)),
            );
            deserializeAmendStore(mockStore, {
                selectedFlight: transferPayload.selectedFlight,
            });
            await mockStore.initialize();

            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendPaymentInfo);
            expect(mockStore.prevSelectedItemPrice).toEqual(transferPayload.selectedFlight.amendmentCharges);
        });

        it('should set selectedItemPrice and prevSelectedItemPrice for transfers', async () => {
            mockStore = new AmendPaymentStore(
                createRootStore({
                    amendTransfersStore: {
                        selectedTransfer: { ...transferPayload.selectedTransfer, amendmentCharges: 50 },
                    },
                }),
            );
            mockStore.validateTransfer = jest.fn().mockResolvedValue({ data: [transferPayload.selectedTransfer] });
            deserializeAmendStore(mockStore, { selectedTransfer: transferPayload.selectedTransfer });
            await mockStore.initialize();

            expect(mockStore.selectedItemPrice).toEqual(50);
            expect(mockStore.prevSelectedItemPrice).toEqual(transferPayload.selectedTransfer.amendmentCharges);
        });

        it('should set selectedItemPrice and prevSelectedItemPrice for room and board', async () => {
            mockStore.validateRoomAndBoard = jest.fn(() => Promise.resolve(mockRoomAndBoardRoomVariant));
            deserializeAmendStore(mockStore, {
                amendRoomAndBoardOffer: {
                    roomVariants: [mockRoomAndBoardRoomVariant],
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                },
            });

            await mockStore.initialize();

            expect(mockStore.amendmentPaymentInfo).toEqual(mockAmendPaymentInfo);
            expect(mockStore.prevSelectedItemPrice).toEqual(mockRoomAndBoardRoomVariant.fullAmendmentCharges);
        });

        it('Should set isCreditRefund to false when only cash refund is available', async () => {
            const refundStore = new AmendPaymentStore(
                createRootStore({
                    amendFlightsStore: {
                        changeSelectedFlight: jest.fn(),
                        totalPrice: -50,
                    },
                }),
            );

            deserializeAmendStore(refundStore, {
                selectedFlight: transferPayload.selectedFlight,
            });

            refundStore.getBookingAndValidateAmendment = jest.fn().mockResolvedValue({
                booking: mockBooking,
                validatedAmendment: null,
            });

            refundStore.validateRefundAmount = jest.fn().mockImplementation(async () => {
                refundStore.refundData = {
                    refund: { isEligible: true, cash: 50, credit: 0 },
                    credit: { isEligible: false },
                } as any;
            });

            await refundStore.initialize();

            expect(refundStore.isCreditRefund).toBe(false);
        });
    });

    describe('validateRefundAmount', () => {
        it('should handle validateRefundAmount', async () => {
            mockStore.rootStore.amendTransfersStore.selectedTransfer = { amendmentCharges: 10 } as any;
            mockStore.booking = { paymentInfo: { balanceDueAmount: 20 } as IPaymentInfo } as IBookingInfo;

            await mockStore.validateRefundAmount(mockAmendPaymentPayload);

            const clearStore = new AmendPaymentStore(createRootStore());
            setAmendPaymentPayload(clearStore, {
                selectedFlight: mockFlightsRoutes[0],
                bookingReference: 'bookingReference',
            });
            await clearStore.validateRefundAmount(mockAmendPaymentPayload);

            expect(clearStore.refundData).toBe('bookingReference');

            // Don't do calculate
            const emptyStore = new AmendPaymentStore(createRootStore());
            setAmendPaymentPayload(emptyStore, {
                selectedTransfer: mockFlightsRoutes[0],
                bookingReference: 'bookingReference',
            });

            await emptyStore.validateRefundAmount(mockAmendPaymentPayload);
        });
    });

    describe('onChangePaymentOption', () => {
        it('Should change passed options', () => {
            mockStore.paymentOption = PaymentOption.Part;
            mockStore.rootStore.payStore.setAmount = jest.fn();
            mockFlightStoreTotalPrice = 10;
            mockStore.booking = mockBooking;

            mockStore.onChangePaymentOption(PaymentOption.Part);
            expect(mockStore.rootStore.payStore.setAmount).not.toHaveBeenCalled();

            mockStore.onChangePaymentOption(PaymentOption.Full);
            expect(mockStore.paymentOption).toBe(PaymentOption.Full);
            expect(mockStore.rootStore.payStore.setAmount).toHaveBeenCalledWith(11);

            mockStore.onChangePaymentOption(PaymentOption.Part);
            expect(mockStore.paymentOption).toBe(PaymentOption.Part);
            expect(mockStore.rootStore.payStore.setAmount).toHaveBeenCalledWith(10);

            mockStore.onChangePaymentOption(PaymentOption.AddToBalance);
            expect(mockStore.paymentOption).toBe(PaymentOption.AddToBalance);
            expect(mockStore.rootStore.payStore.setAmount).toHaveBeenCalledWith(0);

            expect(mockStore.rootStore.payStore.amount).toBe(10);
        });

        it('Should clear payStore errors once method has been invoked', () => {
            mockStore.rootStore.payStore.paymentErrors = [mockPaymentError];

            mockStore.onChangePaymentOption(PaymentOption.Full);

            expect(mockStore.rootStore.payStore.paymentErrors.length).toBe(0);
        });

        it('should set amount to fees amount if fees exist and payment option is AddToBalance', () => {
            mockStore.amendmentPaymentInfo = { totalFeesAmount: 1 } as any;

            mockStore.onChangePaymentOption(PaymentOption.AddToBalance);

            expect(mockStore.rootStore.payStore.setAmount).toHaveBeenCalledWith(1);
        });

        it('should set amount to 0 if fees do not exist and payment option is AddToBalance', () => {
            mockStore.onChangePaymentOption(PaymentOption.AddToBalance);

            expect(mockStore.rootStore.payStore.setAmount).toHaveBeenCalledWith(0);
        });
    });

    it('should handle onForceErrors', async () => {
        mockStore.onForceErrors(true);
        expect(mockStore.rootStore.payStore.onForceErrors).toHaveBeenCalled();
        expect(mockStore.rootStore.payBalanceStore.toggleFocusAmountForPay).toHaveBeenCalledWith(true);
    });

    describe('isFromAmendHotel', () => {
        it('should return true if amendPaymentPayload contains amendHotelOffer', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;

            expect(mockStore.isFromAmendHotel).toBeTruthy();
        });

        it('should return false if amendPaymentPayload does not contain amendHotelOffer', () => {
            mockStore.amendPaymentPayload = undefined;

            expect(mockStore.isFromAmendHotel).toBeFalsy();
        });
    });

    describe('amendmentType', () => {
        beforeEach(() => {
            Object.defineProperty(mockStore, 'isFromAmendFlight', {
                get: function () {
                    return false;
                },
            });
        });

        it('should return flight if isFromAmendFlight is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendFlight', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.Flight);
        });

        it('should return transfer if isFromAmendTransfer is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendTransfer', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.Transfer);
        });

        it('should return roomAndBoard if isFromAmendRoomAndBoard is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendRoomAndBoard', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.RoomAndBoard);
        });

        it('should return dates if isFromAmendDates is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendDates', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.Dates);
        });

        it('should return seats if isFromAmendSeats is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendSeats', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.Seats);
        });

        it('should return hotel if isFromAmendHotel is true', () => {
            Object.defineProperty(mockStore, 'isFromAmendHotel', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.amendmentType).toBe(AmendmentType.Hotel);
        });

        it('should return null if none of the conditions are met', () => {
            expect(mockStore.amendmentType).toBe(null);
        });
    });

    describe('onPay', () => {
        const paymentStoreWithCanPay = new AmendPaymentStore(
            createRootStore({
                payStore: {
                    canPay: true,
                },
            }),
        );

        it('should handle onPay', async () => {
            mockStore.rootStore.payStore.amount = 0;
            mockStore.onForceErrors = jest.fn();
            deserializeAmendStore(mockStore);
            mockStore.confirmPolicy = false;
            mockStore.onPay();
            expect(mockStore.onForceErrors).toHaveBeenCalled();

            mockStore.rootStore.amendTransfersStore.selectedTransfer = { amendmentCharges: -10 } as any;
            mockStore.rootStore.amendFlightsStore.selectedFlight = transferPayload.selectedFlight as any;
            mockStore.onPay({ paRes: { md: true } } as any, true);
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();

            mockStore.rootStore.amendTransfersStore.selectedTransfer = { amendmentCharges: 0 } as any;
            bookingService.amendCommitBooking = jest.fn(data => ({ data } as any));
            mockStore.onPay({ paRes: { md: true } } as any, true);
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();

            const storeWithoutPayload = new AmendPaymentStore(createRootStore());
            expect(await storeWithoutPayload.onPay()).toBe(undefined);
        });

        it('should handle onPay catch errors', async () => {
            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.RoutesModifyProhibited,
                    additionalData: 'additionalData_error',
                };
            });

            mockStore.goBackToPreviousPage = jest.fn();
            mockStore.onForceErrors = jest.fn();
            deserializeAmendStore(mockStore);

            mockStore.onPay(undefined, true);
            expect(startNewTransaction).toHaveBeenCalled();
            expect(mockStore.goBackToPreviousPage).toHaveBeenCalled();
            expect(mockStore.rootStore.payStore.setSessionId).toHaveBeenCalled();

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.NotLeadPassengerLogged,
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.CommitBookingError,
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalled();

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.CancelPaymentError,
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalled();

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: 'test-error-code',
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.payStore.setPaymentErrors).toHaveBeenCalled();
        });

        it('Should call setIsSelectedSeatsUnavailableError when SelectedSeatsUnavailableAmendFlow error is received', () => {
            setAmendPaymentPayload(mockStore, { selectedSeats: [mockSelectedSeat] });

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.SelectedSeatsUnavailableAmendFlow,
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
        });

        it('Should call setIsSelectedSeatsUnavailableError when SelectedSeatsPriceChangeAmendFlow error is received', () => {
            setAmendPaymentPayload(mockStore, { selectedSeats: [mockSelectedSeat] });

            bookingService.amendCommitBooking = jest.fn(() => {
                throw {
                    errorCode: ApiErrors.SelectedSeatsPriceChangeAmendFlow,
                };
            });
            mockStore.onPay(undefined, true);
            expect(mockStore.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toBeCalledWith(true);
        });

        it('Should set seatSelection onPay', async () => {
            deserializeAmendStore(paymentStoreWithCanPay);
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = {
                selectedSeats: {
                    validatedSeatsWithPrices: [{ sectorId: '11', seats: [{ paxIndex: 1, seatNumber: '11' }] }],
                } as any,
            } as any;
            await mockStore.onPay();

            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                {
                    bookingReference: undefined,
                    browserInfo: {},
                    date: undefined,
                    deviceId: undefined,
                    lastName: undefined,
                    paymentInfo: {},
                    seatSelection: [{ seats: [{ paxIndex: 1, seatNumber: '11' }], sectorId: '11' }],
                    sessionId: undefined,
                },
                undefined,
            );
        });

        it('Should onPay be invoked with amend dates offer and new date of the booking', () => {
            deserializeAmendStore(paymentStoreWithCanPay);
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.amendPaymentPayload.amendDatesOffer = mockAmendDatesOfferWithPrice;
            mockStore.onPay();
            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    discountCode: undefined,
                    offer: mockAmendDatesOfferWithPrice.offer,
                }),
                undefined,
            );
        });

        it('Should onPay be called with room and boards', () => {
            deserializeAmendStore(paymentStoreWithCanPay);
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.amendPaymentPayload.amendRoomAndBoardOffer = mockAmendRoomAndBoardOffer;
            mockStore.rootStore.amendRoomAndBoardStore = mockAmendRoomAndBoardStore as AmendRoomAndBoardStore;
            mockStore.onPay();

            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    units: mockAmendRoomAndBoardOffer.selectedRoomVariant.units,
                    discountCode: mockAmendRoomAndBoardOffer.selectedRoomVariant.promoCodeBreakDown!.promoCode,
                }),
                undefined,
            );
        });

        it('Should call amendCommitBooking with amendHotelOffer', () => {
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.amendPaymentPayload.amendHotelOffer = mockAmendHotelOffer;
            mockStore.onPay();
            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    amendHotelOffer: mockAmendHotelOffer,
                    discountCode: mockAmendHotelOffer.amendmentChargesInfo!.promoCodeBreakDown.promoCode,
                }),
                undefined,
            );
        });

        it('Should call amendCommitBooking with amendHotelOffer without promocode', () => {
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.amendPaymentPayload.amendHotelOffer = mockAmendHotelOffer;
            delete mockStore.amendPaymentPayload.amendHotelOffer.amendmentChargesInfo!.promoCodeBreakDown.promoCode;
            delete mockAmendHotelOffer.amendmentChargesInfo!.promoCodeBreakDown.promoCode;

            mockStore.onPay();
            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    amendHotelOffer: mockAmendHotelOffer,
                    discountCode: undefined,
                }),
                undefined,
            );
        });

        it('should add promo code to the amendCommitBooking request on onPay', () => {
            deserializeAmendStore(paymentStoreWithCanPay);
            mockStore.confirmPolicy = true;
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            mockStore.amendPaymentPayload.amendDatesOffer = {
                ...mockAmendDatesOfferWithPrice,
                promoCodeBreakDown: mockPromoCodeBreakdown,
            };
            mockStore.onPay();
            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    offer: mockAmendDatesOfferWithPrice.offer,
                    discountCode: mockPromoCodeBreakdown.promoCode,
                }),
                undefined,
            );
        });

        it('Should call amendCommitBooking with payment data for flights', () => {
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            setAmendPaymentPayload(mockStore, {
                ...mockAmendPaymentPayload,
                selectedFlight: mockValidatedFlights.transports[0],
            });
            jest.spyOn(mockStore, 'canPay', 'get').mockReturnValueOnce(true);

            mockStore.onPay();

            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(
                {
                    browserInfo: {},
                    bookingReference: mockAmendPaymentPayload.bookingReference,
                    lastName: mockAmendPaymentPayload.lastName,
                    date: mockAmendPaymentPayload.date,
                    paymentInfo: {},
                    discountCode: undefined,
                    sessionId: undefined,
                    deviceId: undefined,
                },
                undefined,
            );
        });

        it('should process payment successfully and trigger pushTrackingEvent for refunds', async () => {
            setAmendPaymentPayload(mockStore, {
                ...mockAmendPaymentPayload,
                selectedFlight: mockValidatedFlights.transports[0],
            });

            bookingService.amendCommitBooking = jest.fn(data => ({ data } as any));

            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });

            Object.defineProperty(mockStore, 'isCreditRefund', {
                get: function () {
                    return true;
                },
            });

            mockStore.refundData = { refund: { ...refundData.refund, cash: 0, credit: 10 } } as any;

            await mockStore.onPay({ paRes: { md: true } } as any, true, mockPushTrackingEvent);

            expect(bookingService.amendCommitBooking).toHaveBeenCalled();
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaRefundAmendmentsSuccess(RefundPaymentMethod.Credit));
        });

        it('should process payment successfully and trigger pushTrackingEvent for cash refunds', async () => {
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            bookingService.amendCommitBooking = jest.fn(data => ({ data } as any));

            Object.defineProperty(mockStore, 'canRefund', {
                get: function () {
                    return true;
                },
            });

            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });

            Object.defineProperty(mockStore, 'isCreditRefund', {
                get: function () {
                    return false;
                },
            });

            mockStore.refundData = { refund: { ...refundData.refund, cash: 10, credit: 0 } } as any;

            await mockStore.onPay({ paRes: { md: true } } as any, true, mockPushTrackingEvent);

            expect(bookingService.amendCommitBooking).toHaveBeenCalled();
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaRefundAmendmentsSuccess(RefundPaymentMethod.Original));
        });

        it('should process payment successfully and trigger pushTrackingEvent for balance refunds', async () => {
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            bookingService.amendCommitBooking = jest.fn(data => ({ data } as any));

            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });
            Object.defineProperty(mockStore, 'isCreditRefund', {
                get: function () {
                    return false;
                },
            });
            Object.defineProperty(mockStore, 'isOnlyRefundToBalance', {
                get: function () {
                    return true;
                },
            });

            mockStore.refundData = null as any;

            await mockStore.onPay({ paRes: { md: true } } as any, true, mockPushTrackingEvent);

            expect(bookingService.amendCommitBooking).toHaveBeenCalled();
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaRefundAmendmentsSuccess(RefundPaymentMethod.Balance));
        });

        it('should trigger gaPaymentSuccess when isRefund is false', async () => {
            mockStore.amendPaymentPayload = mockAmendPaymentPayload;
            bookingService.amendCommitBooking = jest.fn(data => ({ data } as any));
            Object.defineProperty(mockStore, 'isRefund', {
                get: () => false,
            });

            mockStore.booking = {
                ...mockBooking,
                paymentInfo: {
                    ...mockBooking.paymentInfo,
                    paymentHistory: [
                        {
                            amount: 100,
                            isCredit: false,
                            card: { code: '111', number: '222' },
                            paymentDate: 'test-date',
                        },
                    ],
                },
            };

            await mockStore.onPay({ paRes: { md: true } } as any, true, mockPushTrackingEvent);

            expect(mockPushTrackingEvent).toHaveBeenCalled();
        });

        describe('new onPay implementation tests', () => {
            let threeDSData: IThreeDSData;
            let payBody;
            let mockPushTrackingEvent;
            let mockGoBackToViewBooking;
            let shouldNotBlockPayment;

            beforeEach(() => {
                threeDSData = { bookingReference: '123' };
                payBody = { paymentInfo: { currency: 'GBP', amount: 10 } };
                mockPushTrackingEvent = jest.fn();
                mockGoBackToViewBooking = jest.spyOn(mockStore, 'goBackToViewBooking');
                mockStore.buildCardPaymentBody = jest.fn().mockReturnValue(payBody);
                mockGetTransactionId.mockReturnValue('transactionId');
                (bookingService.amendCommitBooking as jest.Mock).mockResolvedValue({
                    data: { bookingReference: 'mockBookingReference' },
                });
                shouldNotBlockPayment = true;
            });

            it('should process card payment and handle success', async () => {
                // Act
                await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                // Assert
                expect(mockStore.rootStore.payStore.clearUI).toHaveBeenNthCalledWith(1, false);
                expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(payBody, 'transactionId');
                expect(mockStore.rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(false);
                expect(mockStore.rootStore.payStore.clearUI).toHaveBeenNthCalledWith(2);
                expect(mockStore.rootStore.payStore.clearCardInfo).toHaveBeenCalledTimes(1);
                expect(mockPushTrackingEvent).toHaveBeenNthCalledWith(
                    1,
                    gaBalancePaymentSuccess(
                        payBody.paymentInfo as IApplePayBookingPaymentInfo,
                        CurrencyCode.GBP,
                        'mockBookingReference',
                        false,
                    ),
                );
                expect(mockGoBackToViewBooking).toHaveBeenCalledTimes(1);
                expect(mockStore.isPaying).toBe(false);
            });

            it('should send refund event', async () => {
                // Arrange
                jest.spyOn(mockStore, 'isRefund', 'get').mockReturnValue(true);
                jest.spyOn(mockStore, 'getTypeOfRefund' as any).mockReturnValue(RefundPaymentMethod.Credit);

                // Act
                await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                // Assert
                expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                    gaRefundAmendmentsSuccess(RefundPaymentMethod.Credit),
                );
            });

            it('should NOT process Card payment when amendPaymentPayload does not exist', async () => {
                // Arrange
                mockStore.amendPaymentPayload = null as any;

                // Act
                await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                // Assert
                expect(mockStore.isPaying).toBe(false);
                expect(bookingService.amendCommitBooking).not.toHaveBeenCalled();
            });

            it('should NOT process Card payment when payment should be blocked', async () => {
                // Arrange
                shouldNotBlockPayment = false;

                // Act
                await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                // Assert
                expect(mockStore.isPaying).toBe(false);
                expect(bookingService.amendCommitBooking).not.toHaveBeenCalled();
            });

            it('should NOT process Card payment and handle authorization required', async () => {
                // Arrange
                (bookingService.amendCommitBooking as jest.Mock).mockResolvedValue({
                    data: { bookingReference: 'ref', resultCode: 'Unauthorized' },
                });

                // Act
                await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Payment Authorization required: Unauthorized');
                expect(mockStore.rootStore.payStore.setPaymentAuthorization).toHaveBeenCalledWith({
                    data: { bookingReference: 'ref', resultCode: 'Unauthorized' },
                });
            });

            describe('onPay error handling', () => {
                it('should handle errors', async () => {
                    // Arrange
                    const mockToggleErrorPopupVisibility = jest.spyOn(mockStore, 'toggleErrorPopupVisibility');
                    const error = { errorCode: 'UNKNOWN_ERROR' } as ApiError;
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();
                    expect(mockStore.rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
                    expect(mockStore.rootStore.payStore.setPaymentErrors).toHaveBeenCalled();
                    expect(mockToggleErrorPopupVisibility).toHaveBeenCalledWith(true);
                    expect(mockStore.isPaying).toBe(false);
                });

                it('should handle RoutesModifyProhibited error and call goBackToPreviousPage', async () => {
                    // Arrange
                    const error = { errorCode: ApiErrors.RoutesModifyProhibited } as ApiError;
                    jest.spyOn(mockStore, 'goBackToPreviousPage');
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.goBackToPreviousPage).toHaveBeenCalled();
                });

                it('should handle NotLeadPassengerLogged error and redirect to view bookings', async () => {
                    // Arrange
                    const error = { errorCode: ApiErrors.NotLeadPassengerLogged } as ApiError;
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
                });

                it('should handle AMEND_SEATS_UNAVAILABLE_API_ERRORS and set seat unavailable error', async () => {
                    // Arrange
                    const error = { errorCode: AMEND_SEATS_UNAVAILABLE_API_ERRORS[0] } as ApiError;
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(
                        true,
                    );
                });

                it('should handle CommitBookingError and set commit booking error', async () => {
                    // Arrange
                    const error = { errorCode: ApiErrors.CommitBookingError, correlationId: 'cid' } as ApiError;
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalledWith(
                        expect.objectContaining({ correlationId: 'cid' }),
                    );
                });

                it('should handle CancelPaymentError and set cancel payment error', async () => {
                    // Arrange
                    const error = { errorCode: ApiErrors.CancelPaymentError, correlationId: 'cid' } as ApiError;
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalledWith(
                        expect.objectContaining({ correlationId: 'cid' }),
                    );
                });

                it('should set sessionId if additionalData is present', async () => {
                    // Arrange
                    const error = { additionalData: { sessionId: 'sid' } };
                    (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

                    // Act
                    await mockStore.onPay(threeDSData, shouldNotBlockPayment, mockPushTrackingEvent);

                    // Assert
                    expect(mockStore.rootStore.payStore.setSessionId).toHaveBeenCalledWith('sid');
                });
            });
        });
    });

    describe('buildCardPaymentBody', () => {
        let threeDSData: IThreeDSData;

        beforeEach(() => {
            threeDSData = {
                bookingReference: '3DS-bookingReference',
                paRes: '456',
                requestId: '778899',
                sessionId: '3DS-sessionId',
                threeDSServerTransID: '3DS-transID',
            };
        });

        it('should build card payment body', async () => {
            // Arrange
            setAmendPaymentPayload(mockStore, mockAmendPaymentPayload);
            const expectedPayload = {
                browserInfo: {},
                bookingReference: threeDSData.bookingReference, //mockAmendPaymentPayload.bookingReference,
                lastName: mockAmendPaymentPayload.lastName,
                date: mockAmendPaymentPayload.date,
                sessionId: threeDSData.sessionId, //mockStore.rootStore.payStore.sessionId,
            };

            // Act
            const paymentBody = await mockStore.buildCardPaymentBody(threeDSData);

            // Assert
            expect(paymentBody.browserInfo).toEqual(expectedPayload.browserInfo);
            expect(paymentBody.bookingReference).toEqual(expectedPayload.bookingReference);
            expect(paymentBody.lastName).toEqual(expectedPayload.lastName);
            expect(paymentBody.date).toEqual(expectedPayload.date);
            expect(paymentBody.sessionId).toEqual(expectedPayload.sessionId);
        });
    });

    describe('buildApplePayPaymentBody', () => {
        const creditAmount = 30;
        const token = { paymentMethod: { network: 'amex' } };

        beforeEach(() => {
            mockStore = new AmendPaymentStore(
                createRootStore({
                    flightsStore: {
                        promocodeBreakdown: 'flightsStore_promocodeBreakdown',
                    },
                    amendHotelStore: {
                        setIsNoAvailabilityError: jest.fn(),
                    },
                    payStore: {
                        onForceErrors: jest.fn(),
                        paymentInfo: {
                            creditAmount: creditAmount,
                        },
                        sessionId: 'sessionId',
                        billingInfo: mockBillingInfo,
                    },
                    paymentStore: { currency: CurrencyCode.GBP },
                }),
            );
        });

        it('should build Apple Pay payment body', async () => {
            // Arrange
            setAmendPaymentPayload(mockStore, mockAmendPaymentPayload);

            const mockApplePayPayment = {
                payment: { token: token },
            } as ApplePayJS.ApplePayPaymentAuthorizedEvent;

            const expectedPayload = {
                browserInfo: {},
                bookingReference: mockAmendPaymentPayload.bookingReference,
                lastName: mockAmendPaymentPayload.lastName,
                date: mockAmendPaymentPayload.date,
                sessionId: mockStore.rootStore.payStore.sessionId,
                paymentInfo: {
                    billingInfo: mockBillingInfo,
                    amount: 20,
                    currency: 'GBP',
                    creditAmount: creditAmount,
                    token: token,
                    cardType: 'AmericanExpress',
                    paymentType: PaymentType.ApplePay,
                },
            };

            // Act
            const paymentBody = await mockStore.buildApplePayPaymentBody(mockApplePayPayment);

            // Assert
            expect(paymentBody.browserInfo).toEqual(expectedPayload.browserInfo);
            expect(paymentBody.sessionId).toEqual(expectedPayload.sessionId);
            expect(paymentBody.paymentInfo).toEqual(expectedPayload.paymentInfo);
        });
    });

    describe('commitBookingWithApplePay', () => {
        let mockApplePayPayment;
        let mockPushTrackingEvent;
        let mockGoBackToViewBooking;
        let payBody;
        let mockAmendCommitBookingResponse;

        beforeEach(() => {
            mockApplePayPayment = {
                payment: { token: { paymentMethod: { network: 'Visa' } } },
            } as ApplePayJS.ApplePayPaymentAuthorizedEvent;
            mockPushTrackingEvent = jest.fn();
            mockGoBackToViewBooking = jest.spyOn(mockStore, 'goBackToViewBooking');

            jest.spyOn(mockStore, 'isRefund', 'get').mockReturnValue(false);

            mockGetTransactionId.mockReturnValue('transactionId');

            mockStore.amendPaymentPayload = { bookingReference: 'ref' } as any;
            payBody = { paymentInfo: { amount: 10, currency: 'GBP', cardType: 'Visa' } };
            mockStore.buildApplePayPaymentBody = jest.fn().mockReturnValue(payBody);

            mockAmendCommitBookingResponse = {
                data: { amount: 10, cardType: 'Visa', bookingReference: 'mockBookingReference' },
            };
            (bookingService.amendCommitBooking as jest.Mock).mockResolvedValue(mockAmendCommitBookingResponse);
        });

        it('should process Apple Pay payment and handle success ', async () => {
            // Act
            await mockStore.onPayWithApplePay(mockApplePayPayment.data, mockPushTrackingEvent);

            // Assert
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenNthCalledWith(1, false);
            expect(bookingService.amendCommitBooking).toHaveBeenCalledWith(payBody, 'transactionId');
            expect(mockStore.rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(false);
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenNthCalledWith(2);
            expect(mockStore.rootStore.payStore.clearCardInfo).toHaveBeenCalledTimes(1);
            expect(mockPushTrackingEvent).toHaveBeenNthCalledWith(
                1,
                gaBalancePaymentSuccess(
                    mockAmendCommitBookingResponse.data,
                    CurrencyCode.GBP,
                    'mockBookingReference',
                    true,
                ),
            );
            expect(mockGoBackToViewBooking).toHaveBeenCalledTimes(1);
            expect(mockStore.isPaying).toBe(false);
        });

        it('should send refund event', async () => {
            // Arrange
            jest.spyOn(mockStore, 'isRefund', 'get').mockReturnValue(true);
            jest.spyOn(mockStore, 'getTypeOfRefund' as any).mockReturnValue(RefundPaymentMethod.Credit);

            // Act
            await mockStore.onPayWithApplePay(mockApplePayPayment, mockPushTrackingEvent);

            // Assert
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaRefundAmendmentsSuccess(RefundPaymentMethod.Credit));
        });

        it('should NOT process Apple Pay payment if amendPaymentPayload does not exist', async () => {
            // Arrange
            mockStore.amendPaymentPayload = null as any;

            // Act
            await mockStore.onPayWithApplePay(mockApplePayPayment, mockPushTrackingEvent);

            // Assert
            expect(mockStore.isPaying).toBe(false);
            expect(bookingService.amendCommitBooking).not.toHaveBeenCalled();
        });

        it('should NOT process Apple Pay payment and handle authorization required', async () => {
            // Arrange
            (bookingService.amendCommitBooking as jest.Mock).mockResolvedValue({
                data: { bookingReference: 'ref', resultCode: 'Unauthorized' },
            });

            // Act
            await mockStore.onPayWithApplePay(mockApplePayPayment, mockPushTrackingEvent);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Payment Authorization required: Unauthorized');
            expect(mockStore.rootStore.payStore.setPaymentAuthorization).toHaveBeenCalledWith({
                data: { bookingReference: 'ref', resultCode: 'Unauthorized' },
            });
        });

        it('should handle errors', async () => {
            // Arrange
            const mockToggleErrorPopupVisibility = jest.spyOn(mockStore, 'toggleErrorPopupVisibility');

            const error = { errorCode: 'UNKNOWN_ERROR' } as ApiError;

            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.payStore.clearUI).toHaveBeenCalled();
            expect(mockStore.rootStore.payStore.setFailedToPay).toHaveBeenCalledWith(true);
            expect(mockStore.rootStore.payStore.setPaymentErrors).toHaveBeenCalled();
            expect(mockToggleErrorPopupVisibility).toHaveBeenCalledWith(true);
            expect(mockStore.isPaying).toBe(false);
        });

        it('should handle RoutesModifyProhibited error and call goBackToPreviousPage', async () => {
            // Arrange
            const error = { errorCode: ApiErrors.RoutesModifyProhibited } as ApiError;
            jest.spyOn(mockStore, 'goBackToPreviousPage');
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.goBackToPreviousPage).toHaveBeenCalled();
        });

        it('should handle NotLeadPassengerLogged error and redirect to view bookings', async () => {
            // Arrange
            const error = { errorCode: ApiErrors.NotLeadPassengerLogged } as ApiError;
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should handle AMEND_SEATS_UNAVAILABLE_API_ERRORS and set seat unavailable error', async () => {
            // Arrange
            const error = { errorCode: AMEND_SEATS_UNAVAILABLE_API_ERRORS[0] } as ApiError;
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalledWith(true);
        });

        it('should handle CommitBookingError and set commit booking error', async () => {
            // Arrange
            const error = { errorCode: ApiErrors.CommitBookingError, correlationId: 'cid' } as ApiError;
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId: 'cid' }),
            );
        });

        it('should handle CancelPaymentError and set cancel payment error', async () => {
            // Arrange
            const error = { errorCode: ApiErrors.CancelPaymentError, correlationId: 'cid' } as ApiError;
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.payStore.setPaymentError).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId: 'cid' }),
            );
        });

        it('should set sessionId if additionalData is present', async () => {
            // Arrange
            const error = { additionalData: { sessionId: 'sid' } };
            (bookingService.amendCommitBooking as jest.Mock).mockRejectedValueOnce(error);

            // Act
            await mockStore.onPayWithApplePay({} as any);

            // Assert
            expect(mockStore.rootStore.payStore.setSessionId).toHaveBeenCalledWith('sid');
        });
    });

    describe('goBackToPreviousPage', () => {
        it('should handle goBackToPreviousPage', () => {
            mockStore.goBackToPreviousPage(true);
            expect(window.open).toHaveBeenCalled();
        });

        it('Should invoke window.open with amend dates summary page', () => {
            mockStore.amendPaymentPayload = {
                amendDatesOffer: mockAmendDatesOfferWithPrice,
            } as IAmendPaymentPayload;
            mockGetAmendPaymentConfig.mockReturnValueOnce({ prevPage: SitePath.AmendDatesSummary });
            mockStore.goBackToPreviousPage(true);

            expect(window.open).toHaveBeenCalledWith(
                `${mockStore.rootStore.layoutStore.basePath + SitePath.AmendDatesSummary}`,
                '_self',
            );
        });

        it('Should invoke window.open with amend room and board page', () => {
            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
            } as IAmendPaymentPayload;
            mockGetAmendPaymentConfig.mockReturnValueOnce({ prevPage: SitePath.AmendRoomAndBoard });

            mockStore.goBackToPreviousPage(true);

            expect(window.open).toHaveBeenCalledWith(
                `${mockStore.rootStore.layoutStore.basePath + SitePath.AmendRoomAndBoard}`,
                '_self',
            );
        });

        it('Should get to view booking page when room and board amendment', () => {
            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
            } as IAmendPaymentPayload;
            mockStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant =
                mockAmendRoomAndBoardOffer.selectedRoomVariant;
            (getBookingPayload as jest.MockedFn<any>).mockReturnValue({});

            mockStore.goBackToPreviousPage();

            expect(setWebStorageItem).toHaveBeenCalledWith(
                'amend-booking-payload',
                expect.objectContaining({
                    amendRoomAndBoardOffer: expect.objectContaining({
                        roomVariants: mockStore.rootStore.amendRoomAndBoardStore.roomVariants,
                        selectedRoomVariant: mockStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant,
                    }),
                }),
                {},
            );
        });

        it('Should get to view booking page when seats amendment', () => {
            mockStore.amendPaymentPayload = { selectedSeats: true } as any;
            mockStore.booking = {} as any;
            (getBookingPayload as jest.MockedFn<any>).mockReturnValue({
                bookingReference: mockBooking.bookingReference,
                lastName: mockBooking.guests.find(g => g.isLead)?.lastName,
                date: mockBooking.package?.accom?.startDate,
                package: mockBooking.package,
                paymentInfo: mockBooking.paymentInfo,
            });
            mockStore.goBackToPreviousPage(true);

            expect(setWebStorageItem).toHaveBeenCalledWith(
                'amend-booking-payload',
                expect.objectContaining({
                    amendDatesOffer: undefined,
                    bookingReference: mockBooking.bookingReference,
                    date: mockBooking.package.accom.startDate,
                    isFromAmendFlight: false,
                    isFromAmendTransfer: false,
                    lastName: mockBooking.guests[0].lastName,
                    package: mockBooking.package,
                    paymentInfo: mockBooking.paymentInfo,
                    redirectedByBreadcrumbs: true,
                    selectedFlight: undefined,
                    selectedFlightFilters: undefined,
                    selectedSeats: true,
                    selectedTransfer: undefined,
                }),
                {},
            );
            expect(submitForm).toHaveBeenCalledWith(
                `${mockStore.rootStore.layoutStore.basePath + SitePath.ViewBooking}`,
                'view-booking-payload',
                expect.objectContaining({
                    bookingReference: mockBooking.bookingReference,
                    date: mockBooking.package.accom.startDate,
                    lastName: mockBooking.guests[0].lastName,
                    package: mockBooking.package,
                    paymentInfo: mockBooking.paymentInfo,
                    isBackToPageClicked: true,
                    shouldOpenSeatMapForced: true,
                    amendPaymentPayload: { selectedSeats: true },
                }),
            );
            expect(submitForm).toHaveBeenCalledWith(
                `${mockStore.rootStore.layoutStore.basePath + SitePath.ViewBooking}`,
                'view-booking-payload',
                expect.not.objectContaining({
                    successfulAmendmentStatus: expect.anything(),
                }),
            );
        });
    });

    describe('getAmendTransportLabel', () => {
        const mockLabels: IPaymentLabelsFields = {
            DatesLabel: mockSitecoreField('DatesLabel'),
            FlightLabel: mockSitecoreField('FlightLabel'),
            RoomAndBoardLabel: mockSitecoreField('RoomAndBoardLabel'),
            SeatsLabel: mockSitecoreField('SeatsLabel'),
            TransferLabel: mockSitecoreField('TransferLabel'),
            HotelLabel: mockSitecoreField('HotelLabel'),
        };

        it('Should return an empty string label when no template', () => {
            const result = mockStore.getAmendTransportLabel();

            expect(result).toBe('');
        });

        it('Should return an empty string label when no labels', () => {
            const result = mockStore.getAmendTransportLabel('template {transport}');

            expect(result).toBe('');
        });

        it('Should return an empty string label when no any appropriate entity was provided', () => {
            deserializeAmendStore(mockStore);
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe('');
        });

        it('Should return transfer label', () => {
            deserializeAmendStore(mockStore, { selectedTransfer: transferPayload.selectedTransfer });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.TransferLabel.value}`);
        });

        it('Should return flight label', () => {
            deserializeAmendStore(mockStore, { selectedFlight: transferPayload.selectedTransfer });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.FlightLabel.value}`);
        });

        it('Should return seats label', () => {
            deserializeAmendStore(mockStore, { selectedSeats: {} });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.SeatsLabel.value}`);
        });

        it('Should return dates label', () => {
            deserializeAmendStore(mockStore, { amendDatesOffer: mockAmendDatesOfferWithPrice });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.DatesLabel.value}`);
        });

        it('Should return room and board label', () => {
            deserializeAmendStore(mockStore, { amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.RoomAndBoardLabel.value}`);
        });

        it('Should return hotel label', () => {
            deserializeAmendStore(mockStore, { amendHotelOffer: mockAmendHotelOffer });
            const result = mockStore.getAmendTransportLabel('template {transport}', mockLabels);

            expect(result).toBe(`template ${mockLabels.HotelLabel.value}`);
        });
    });

    it('ShouldConfirmPolicy', () => {
        mockStore.rootStore.payStore.forceFieldErrors = true;
        mockStore.confirmPolicy = false;
        expect(mockStore.shouldConfirmPolicy).toBeTruthy();
    });

    it('should handle togglePolicy', () => {
        mockStore.togglePolicy(true);
        expect(mockStore.confirmPolicy).toBe(true);
    });

    it('should handle setIsCreditRefund', async () => {
        mockStore.setIsCreditRefund(true);

        expect(mockStore.isCreditRefund).toBe(true);
    });

    it('should handle onErrorPopupClose', async () => {
        mockStore.onErrorPopupClose();
        expect(mockStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
    });

    it('Should update isErrorPopupShown prop', () => {
        mockStore.toggleErrorPopupVisibility(true);

        expect(mockStore.isErrorPopupShown).toBe(true);
    });

    describe('hasBalance', () => {
        it('Should return true when balance > 0', () => {
            mockStore.booking = {
                paymentInfo: {
                    balanceDueAmount: 10,
                } as IPaymentInfo,
            } as IBookingInfo;

            expect(mockStore.hasBalance).toBe(true);
        });

        it('Should return false when balance does not exist', () => {
            expect(mockStore.hasBalance).toBe(false);
        });
    });

    describe('isBalanceDueDateExpired', () => {
        it('should return false when booking is a flight and hotel package', () => {
            mockStore.booking = { ...mockBooking, promoCollections: [OfferPromotionCodes.FlightAndHotel] };

            expect(mockStore.isBalanceDueDateExpired).toBe(false);
        });

        it('should return true when canPayRemainingBalance returns false', () => {
            mockStore.booking = mockBooking;
            mockCanPayRemainingBalance.mockReturnValueOnce(false);

            expect(mockStore.isBalanceDueDateExpired).toBe(true);
            expect(mockCanPayRemainingBalance).toHaveBeenCalledWith(mockBooking.paymentInfo.allowPayBalanceDueDate);
        });

        it('should return false when canPayRemainingBalance returns true', () => {
            mockStore.booking = mockBooking;
            mockCanPayRemainingBalance.mockReturnValueOnce(true);

            expect(mockStore.isBalanceDueDateExpired).toBe(false);
            expect(mockCanPayRemainingBalance).toHaveBeenCalledWith(mockBooking.paymentInfo.allowPayBalanceDueDate);
        });

        it('should use empty string when allowPayBalanceDueDate is not set', () => {
            mockStore.booking = {
                ...mockBooking,
                paymentInfo: { ...mockBooking.paymentInfo, allowPayBalanceDueDate: '' },
            };
            mockCanPayRemainingBalance.mockReturnValueOnce(false);

            expect(mockStore.isBalanceDueDateExpired).toBe(true);
            expect(mockCanPayRemainingBalance).toHaveBeenCalledWith('');
        });
    });

    describe('canAddToBalance', () => {
        it('should return false if no booking', () => {
            mockStore.booking = null;

            expect(mockStore.canAddToBalance).toBe(false);
        });

        it('should return false when pay fees only', () => {
            jest.spyOn(mockStore, 'isPayingFeesOnly', 'get').mockReturnValueOnce(true);

            expect(mockStore.canAddToBalance).toBe(false);
        });

        it('should return false when booking is a flight and hotel package', () => {
            mockStore.booking = { ...mockBooking, promoCollections: [OfferPromotionCodes.FlightAndHotel] };
            jest.spyOn(mockStore, 'isPayingFeesOnly', 'get').mockReturnValueOnce(false);

            expect(mockStore.canAddToBalance).toBe(false);
        });

        it('should return true when canPayRemainingBalance returns true', () => {
            mockStore.booking = mockBooking;
            mockCanPayRemainingBalance.mockReturnValueOnce(true);
            jest.spyOn(mockStore, 'isPayingFeesOnly', 'get').mockReturnValueOnce(false);

            const result = mockStore.canAddToBalance;

            expect(result).toBe(true);
            expect(mockCanPayRemainingBalance).toHaveBeenCalledWith(mockBooking.paymentInfo.allowPayBalanceDueDate);
        });

        it('should return false when canPayRemainingBalance returns false', () => {
            mockStore.booking = mockBooking;
            mockStore.booking.paymentInfo.allowPayBalanceDueDate = '';
            mockCanPayRemainingBalance.mockReturnValueOnce(false);
            jest.spyOn(mockStore, 'isPayingFeesOnly', 'get').mockReturnValueOnce(false);

            const result = mockStore.canAddToBalance;

            expect(result).toBe(false);
            expect(mockCanPayRemainingBalance).toHaveBeenCalledWith('');
        });
    });

    describe('isPayingFeesOnly', () => {
        beforeEach(() => {
            mockStore.rootStore.amendTransfersStore.selectedTransfer = mockTransferWithAmendmentCharges;
        });

        it('should return true if totalFeesAmount is greater than totalPrice', () => {
            mockStore.amendmentPaymentInfo = { totalFeesAmount: 20 } as any;
            jest.spyOn(mockStore, 'totalPrice', 'get').mockReturnValue(10);

            expect(mockStore.isPayingFeesOnly).toBe(true);
        });

        it('should return true if totalFeesAmount is equal to totalPrice', () => {
            mockStore.amendmentPaymentInfo = { totalFeesAmount: 13 } as any;
            jest.spyOn(mockStore, 'totalPrice', 'get').mockReturnValue(13);

            expect(mockStore.isPayingFeesOnly).toBe(true);
        });

        it('should return false if totalFeesAmount is less than totalPrice', () => {
            mockStore.amendmentPaymentInfo = { totalFeesAmount: 5 } as any;

            expect(mockStore.isPayingFeesOnly).toBe(false);
        });

        it('should return false if isRefund is true', () => {
            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });
            mockStore.amendmentPaymentInfo = { totalFeesAmount: 20 } as any;

            expect(mockStore.isPayingFeesOnly).toBe(false);
        });

        it('should return false if no totalFeesAmount', () => {
            mockStore.amendmentPaymentInfo = undefined;

            expect(mockStore.isPayingFeesOnly).toBe(false);
        });
    });

    describe('totalPaymentAmount', () => {
        beforeEach(() => {
            Object.defineProperty(mockStore, 'totalPrice', {
                get: function () {
                    return 10;
                },
            });
        });

        it('should return totalPrice when can add to balance', () => {
            Object.defineProperty(mockStore, 'canAddToBalance', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.totalPaymentAmount).toBe(10);
        });

        it('should return totalPrice when isPayingFeesOnly', () => {
            Object.defineProperty(mockStore, 'isPayingFeesOnly', {
                get: function () {
                    return true;
                },
            });

            expect(mockStore.totalPaymentAmount).toBe(10);
        });

        it('should return totalPrice plus balanceAmount when not can add to balance and not isPayingFeesOnly', () => {
            Object.defineProperty(mockStore, 'canAddToBalance', {
                get: function () {
                    return false;
                },
            });
            Object.defineProperty(mockStore, 'isPayingFeesOnly', {
                get: function () {
                    return false;
                },
            });
            mockStore.booking = {
                paymentInfo: {
                    balanceDueAmount: 5,
                } as IPaymentInfo,
            } as IBookingInfo;

            expect(mockStore.totalPaymentAmount).toBe(15);
        });
    });

    describe('goBackToViewBooking', () => {
        it('Should invoke submitForm with default params', () => {
            mockStore = new AmendPaymentStore(
                createRootStore({ amendSeatsStore: { newSelection: [mockSelectedSeat] } }),
            );
            mockStore.booking = mockBooking;
            mockStore.goBackToViewBooking('');

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.objectContaining({
                    bookingReference: 'bookingReference',
                    lastName: 'Brown',
                    date: '2029-06-19',
                    package: mockBooking.package,
                    paymentInfo: mockBooking.paymentInfo,
                    amendmentType: AmendmentType.Seats,
                }),
            );
        });

        it('Should invoke submitForm with hide seats params', () => {
            mockStore = new AmendPaymentStore(
                createRootStore({ amendSeatsStore: { newSelection: [mockSelectedSeat] } }),
            );
            mockStore.booking = mockBooking;
            mockStore.goBackToViewBooking('', false, true);

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.not.objectContaining({
                    successfulAmendmentStatus: expect.anything(),
                }),
            );
        });

        it('Should invoke submitForm with applied seats params', () => {
            mockStore.booking = mockBooking;
            mockStore.goBackToViewBooking('', true);

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.objectContaining({
                    shouldOpenSeatMapForced: true,
                }),
            );
            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.not.objectContaining({
                    successfulAmendmentStatus: expect.anything(),
                }),
            );
        });

        it('Should invoke submitForm with applied amend dates date', () => {
            mockStore.booking = mockBooking;
            mockStore.amendPaymentPayload = {
                amendDatesOffer: mockAmendDatesOfferWithPrice,
            } as IAmendPaymentPayload;

            mockStore.goBackToViewBooking('');

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.objectContaining({
                    date: mockAmendDatesOfferWithPrice.offer.accom.date,
                }),
            );
        });

        it('Should invoke submitForm with Room and Board amendment type', () => {
            mockStore.booking = mockBooking;
            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: {
                    selectedRoomVariant: mockRoomAndBoardRoomVariant,
                },
            } as IAmendPaymentPayload;

            mockStore.goBackToViewBooking('');

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.objectContaining({
                    amendmentType: AmendmentType.RoomAndBoard,
                    rooms: mockStore.booking.package.accom.rooms,
                }),
            );
        });

        it('Should set amendmendType based on store value', () => {
            mockStore.booking = mockBooking;
            Object.defineProperty(mockStore, 'amendmentType', {
                get: function () {
                    return AmendmentType.Flight;
                },
            });

            mockStore.goBackToViewBooking('');

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.objectContaining({
                    amendmentType: AmendmentType.Flight,
                }),
            );
        });

        it('Should NOT set amendmentType based on store value if it is Seats', () => {
            mockStore.booking = mockBooking;
            Object.defineProperty(mockStore, 'amendmentType', {
                get: function () {
                    return AmendmentType.Seats;
                },
            });

            mockStore.goBackToViewBooking('');

            expect(submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/my_booking',
                'view-booking-payload',
                expect.not.objectContaining({
                    amendmentType: AmendmentType.Seats,
                }),
            );
        });

        it('Should NOT be invoked without booking', () => {
            mockStore.booking = null;

            mockStore.goBackToViewBooking('');

            expect(submitForm).not.toHaveBeenCalled();
        });
    });

    describe('addToBalanceDueDate', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
        });

        it('should return amend dates due date', () => {
            mockStore = new AmendPaymentStore(createRootStore({ amendDatesStore: mockAmendDatesStore }));
            mockStore.amendPaymentPayload = { amendDatesOffer: mockAmendDatesOfferWithPrice } as IAmendPaymentPayload;

            expect(mockStore.addToBalanceDueDate.toISOString()).toBe(
                new Date(mockAmendDatesOfferWithPrice.allowPayBalanceDueDate).toISOString(),
            );
        });

        it('should return amend dates due date', () => {
            mockStore.booking = mockBooking;
            mockStore.booking.paymentInfo.allowPayBalanceDueDate = '2020-01-01';

            expect(mockStore.addToBalanceDueDate.toISOString()).toBe(
                new Date(mockBooking.paymentInfo.allowPayBalanceDueDate).toISOString(),
            );
        });

        it('should return default date', () => {
            expect(mockStore.addToBalanceDueDate.toISOString()).toBe(new Date().toISOString());
        });
    });

    describe('isOnlyRefundToBalance', () => {
        it('should return true if refund and no refund data', () => {
            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });
            mockStore.refundData = null as any;

            expect(mockStore.isOnlyRefundToBalance).toEqual(true);
        });

        it('should return false when no isRefund ', () => {
            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return false;
                },
            });
            mockStore.refundData = {} as any;
            expect(mockStore.isOnlyRefundToBalance).toEqual(false);
        });

        it('should return true for right data', () => {
            Object.defineProperty(mockStore, 'isRefund', {
                get: function () {
                    return true;
                },
            });
            mockStore.refundData = null as any;
            expect(mockStore.isOnlyRefundToBalance).toEqual(true);
        });
    });

    describe('promocodeBreakdown', () => {
        it('should return null when AmendStoreKey is Seats', () => {
            jest.spyOn(mockStore, 'storeKey', 'get').mockReturnValueOnce(AmendStoreKey.Seats);

            expect(mockStore.promocodeBreakdown).toBe(null);
        });

        it('should return promocodeBreakDown from amendFlightsStore by key', () => {
            jest.spyOn(mockStore, 'storeKey', 'get').mockReturnValueOnce(AmendStoreKey.Flights);

            expect(mockStore.promocodeBreakdown).toBe(mockStore.rootStore.amendFlightsStore.promocodeBreakdown);
        });
    });

    describe('AmendPaymentStore formValidation', () => {
        const mockPushTrackingEvent = jest.fn();

        it('should return true if billing info is valid and confirm policy is true', () => {
            Object.defineProperty(mockStore.rootStore.payStore, 'isBillingInfoValid', {
                get: jest.fn(() => true),
            });

            mockStore.confirmPolicy = true;

            expect(mockStore.formValidation(mockPushTrackingEvent)).toBe(true);
        });

        it('should call onForceErrors and return false if billing info is invalid', () => {
            const spy = jest.spyOn(mockStore, 'onForceErrors');

            Object.defineProperty(mockStore.rootStore.payStore, 'isBillingInfoValid', {
                get: jest.fn(() => false),
            });

            mockStore.confirmPolicy = true;

            expect(mockStore.formValidation(mockPushTrackingEvent)).toBe(false);
            expect(spy).toHaveBeenCalledWith(true);
        });

        it('should call onForceErrors and return false if confirmPolicy is false', () => {
            const spy = jest.spyOn(mockStore, 'onForceErrors');

            Object.defineProperty(mockStore.rootStore.payStore, 'isBillingInfoValid', {
                get: jest.fn(() => true),
            });

            mockStore.confirmPolicy = false;

            expect(mockStore.formValidation(mockPushTrackingEvent)).toBe(false);
            expect(spy).toHaveBeenCalledWith(true);
        });

        it('should push a tracking event if user has not checked Terms & Conditions', () => {
            // Arrange
            mockStore.confirmPolicy = false;

            // Act
            mockStore.formValidation(mockPushTrackingEvent);

            // Assert
            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                gaApplePayButtonClickedWithoutAcceptingTermsAndConditions,
            );
        });

        it('should NOT push a tracking event if user has checked Terms & Conditions', () => {
            // Arrange
            mockStore.confirmPolicy = true;

            // Act
            mockStore.formValidation(mockPushTrackingEvent);

            // Assert
            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });
    });

    describe('newTaxesAndFees', () => {
        const mockTaxesAndFees = [
            {
                code: 'TAX1',
                exchangeRate: 1.19,
                paylocalAmount: 10,
                paylocalAmountConverted: 8.4,
                paylocalAmountConvertedCurrency: 'GBP',
                paylocalAmountCurrency: 'EUR',
            },
        ];

        it('should return taxesAndFees from amendHotelStore when isFromAmendHotel is true', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;
            mockStore.rootStore.amendHotelStore.newlySelectedHotelOffer = { taxesAndFees: mockTaxesAndFees } as any;

            expect(mockStore.newTaxesAndFees).toEqual(mockTaxesAndFees);
        });

        it('should return taxesAndFees from amendRoomAndBoardStore when isFromAmendRoomAndBoard is true', () => {
            mockStore.amendPaymentPayload = { amendRoomAndBoardOffer: {} } as any;
            mockStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant = { taxesAndFees: mockTaxesAndFees } as any;

            expect(mockStore.newTaxesAndFees).toEqual(mockTaxesAndFees);
        });

        it('should return taxesAndFees from selectedRoomVariant when isFromAmendRoomAndBoard and isMultiroom', () => {
            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: { selectedRoomVariant: { taxesAndFees: mockTaxesAndFees } },
                isMultiroom: true,
            } as any;

            expect(mockStore.newTaxesAndFees).toEqual(mockTaxesAndFees);
        });

        it('should return undefined when isFromAmendRoomAndBoard and isMultiroom but selectedRoomVariant taxesAndFees is absent', () => {
            mockStore.amendPaymentPayload = {
                amendRoomAndBoardOffer: {},
                isMultiroom: true,
            } as any;

            expect(mockStore.newTaxesAndFees).toBeUndefined();
        });

        it('should return taxesAndFees from amendDatesStore when isFromAmendDates is true', () => {
            mockStore.amendPaymentPayload = { amendDatesOffer: {} } as any;
            mockStore.rootStore.amendDatesStore.offerWithPrices = { taxesAndFees: mockTaxesAndFees } as any;

            expect(mockStore.newTaxesAndFees).toEqual(mockTaxesAndFees);
        });

        it('should return undefined when no amendment type matches', () => {
            mockStore.amendPaymentPayload = undefined;

            expect(mockStore.newTaxesAndFees).toBeUndefined();
        });
    });

    describe('newTouristTaxConverted', () => {
        it('should sum paylocalAmountConverted from all taxesAndFees items', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;
            mockStore.rootStore.amendHotelStore.newlySelectedHotelOffer = {
                taxesAndFees: [{ paylocalAmountConverted: 5 }, { paylocalAmountConverted: 3.4 }],
            } as any;

            expect(mockStore.newTouristTaxConverted).toBeCloseTo(8.4);
        });

        it('should sum paylocalAmountConverted across multiple currencies', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;
            mockStore.rootStore.amendHotelStore.newlySelectedHotelOffer = {
                taxesAndFees: [
                    {
                        paylocalAmountConverted: 5,
                        paylocalAmountCurrency: 'EUR',
                        paylocalAmountConvertedCurrency: 'GBP',
                    },
                    {
                        paylocalAmountConverted: 3.4,
                        paylocalAmountCurrency: 'CHF',
                        paylocalAmountConvertedCurrency: 'GBP',
                    },
                ],
            } as any;

            expect(mockStore.newTouristTaxConverted).toBeCloseTo(8.4);
        });

        it('should return 0 when newTaxesAndFees is undefined', () => {
            mockStore.amendPaymentPayload = undefined;

            expect(mockStore.newTouristTaxConverted).toBe(0);
        });
    });

    describe('prevTouristTax', () => {
        it('should return paylocalAmountConverted from first booking taxesAndFees item', () => {
            mockStore.booking = { taxesAndFees: [{ paylocalAmountConverted: 100 }] } as any;

            expect(mockStore.prevTouristTax).toBe(100);
        });

        it('should sum paylocalAmountConverted across multiple currencies', () => {
            mockStore.booking = {
                taxesAndFees: [
                    {
                        paylocalAmountConverted: 60,
                        paylocalAmountCurrency: 'EUR',
                        paylocalAmountConvertedCurrency: 'GBP',
                    },
                    {
                        paylocalAmountConverted: 40,
                        paylocalAmountCurrency: 'CHF',
                        paylocalAmountConvertedCurrency: 'GBP',
                    },
                ],
            } as any;

            expect(mockStore.prevTouristTax).toBe(100);
        });

        it('should return 0 when booking is undefined', () => {
            mockStore.booking = undefined;

            expect(mockStore.prevTouristTax).toBe(0);
        });

        it('should return 0 when booking taxesAndFees is undefined', () => {
            mockStore.booking = {} as any;

            expect(mockStore.prevTouristTax).toBe(0);
        });
    });

    describe('hasTouristTax', () => {
        it('should return true when newTouristTaxConverted is greater than 0', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;
            mockStore.rootStore.amendHotelStore.newlySelectedHotelOffer = {
                taxesAndFees: [{ paylocalAmountConverted: 10 }],
            } as any;

            expect(mockStore.hasTouristTax).toBe(true);
        });

        it('should return false when newTouristTaxConverted is 0', () => {
            mockStore.amendPaymentPayload = { amendHotelOffer: {} } as any;
            mockStore.rootStore.amendHotelStore.newlySelectedHotelOffer = {
                taxesAndFees: [{ paylocalAmountConverted: 0 }],
            } as any;

            expect(mockStore.hasTouristTax).toBe(false);
        });

        it('should return false when newTaxesAndFees is undefined', () => {
            mockStore.amendPaymentPayload = undefined;

            expect(mockStore.hasTouristTax).toBe(false);
        });
    });
});
