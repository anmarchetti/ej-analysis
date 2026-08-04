import { CurrencyCode } from 'code/currency';
import { mockAmendPaymentInfo, mockBoardType, mockHotel } from 'frontend/__mocks__';
import { mockAccomData } from 'frontend/__mocks__/accom';
import { mockBooking } from 'frontend/__mocks__/booking';
import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockFlightsOffers, mockFlightsRoutes } from 'frontend/__mocks__/flights';
import { mockTransfer } from 'frontend/__mocks__/transfer';
import AmendDatesFlights from 'frontend/store/holidays/amend/amendDates/AmendDates.flights';
import AmendDatesSeats from 'frontend/store/holidays/amend/amendDates/AmendDates.seats';
import { AmendDatesTransfer } from 'frontend/store/holidays/amend/amendDates/AmendDates.transfer';
import AmendDatesStore from 'frontend/store/holidays/amend/amendDates/AmendDatesStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IAltBoard, IOffer } from 'models/data/IOffer';
import { PromocodeRestStatuses } from 'models/data/IPromocode';
import { GuestType } from 'models/enum/GuestType';

export const mockAmendDatesOffer: IOffer = {
    extraLuggageInfo: luggageInfoMock,
    hotel: mockHotel,
    id: '0',
    date: '2023-09-11T00:00:00',
    stay: 6,
    price: 2032.36,
    pricePP: 1016.18,
    deposit: 120.0,
    accom: { ...mockAccomData },
    altBoards: [mockBoardType] as IAltBoard[],
    transport: { routes: [...mockFlightsRoutes] },
    transfers: [{ ...mockTransfer }],
    hasDistressedFlights: true,
    currency: {
        code: CurrencyCode.GBP,
    },
    seatSelection: [{ sectorId: '1', flightNumber: '7258', isSeatReservationPossible: true }],
    touristTax: 0,
    touristTaxPP: 0,
    priceExcludingTouristTax: 2032.36,
    pricePPExcludingTouristTax: 1016.18,
    hasDiscountedBoardUpgrade: false,
};

export const mockAmendDatesOfferWithPrice: IAmendDatesResponseItem = {
    offer: mockFlightsOffers[0],
    bookingRef: 'bookingRef',
    bookingPrice: 100,
    offerPrice: 110,
    amendmentFlowCharges: 10,
    amendmentDatesCharges: 20,
    amendmentDatesFees: 10,
    discountCode: 'discountCode',
    allowPayBalanceDueDate: '2025-12-12',
    promoCodeBreakDown: {
        promoCodeStatus: PromocodeRestStatuses.ERROR,
        due: 100,
    },
    amendmentPaymentInfo: mockAmendPaymentInfo,
    seatsChangeEnabled: true,
    unhappyPathOffer: false,
    isSeatsPriceChanged: false,
    isSeatsUnavailable: false,
};

export const mockAmendDatesStore: Partial<AmendDatesStore> = {
    booking: { ...mockBooking },
    offerWithPrices: mockAmendDatesOfferWithPrice,
    flights: { noAvailableFlightOffers: false } as AmendDatesFlights,
    transfer: {
        transferOffers: [mockAmendDatesOfferWithPrice, mockAmendDatesOfferWithPrice],
        isLoading: false,
        handleChangeTransfer: jest.fn() as any,
        upgradePrice: 30,
    } as AmendDatesTransfer,
    seats: {
        isDisabledBySitecore: false,
        isSeatMapShown: false,
        getSeatsAvailability: jest.fn(),
        clearStore: jest.fn(),
        setIsSeatMapShown: jest.fn(),
        handleSelectSeats: jest.fn(),
        checkForSeatsAvailability: jest.fn(),
        amendCTAState: {
            isDisabled: false,
            isVisible: true,
        },
        isAmendCTAVisible: true,
        isSeatNoLongerAvailable: false,
        hasSeatsPriceChanged: false,
        setIsSeatNoLongerAvailable: jest.fn(),
        setHasSeatsPriceChanged: jest.fn(),
        handleContinueWithoutSeats: jest.fn(),
        fetchSeatMapsRequest: null,
        rootStore: {} as HolidaysRootStore,
    } as AmendDatesSeats,
    allowanceRestrictions: {
        byOutOfSync: false,
        byDisruption: false,
        byTimeBound: false,
        byAirportParking: false,
    },
    initiateSummaryPage: jest.fn(),
    initAmendDatesPage: jest.fn(),
    confirmChosenDates: jest.fn(),
    breakSubmitRequest: jest.fn(),
    refreshAvailableDates: jest.fn(),
    setIsValidatedOfferUnavailable: jest.fn(),
    setSelectedMonth: jest.fn(),
    setIsAlternativePackagePopupShown: jest.fn(),
    initializeAmendDatesPaymentPage: jest.fn(),
    numberOfNights: 7,
    offerPrices: {
        bookingPrice: 100,
        offerPrice: 130,
        amendmentDatesCharges: 10,
        amendmentDatesFees: 30,
        amendmentFlowCharges: 20,
        discountCode: 'discountCode',
    },
    onChangeDatesAmendFlightClick: jest.fn(),
    offer: mockAmendDatesOfferWithPrice.offer,
    guestsCounts: {
        [GuestType.Infant]: 1,
        [GuestType.Child]: 1,
        [GuestType.Adult]: 2,
    },
    selectedDates: [new Date('2023-09-11T00:00:00'), new Date('2023-09-12T00:00:00')],
    clearStore: jest.fn(),
    onAmendDatesButtonClick: jest.fn(),
    isAmendCTAVisible: true,
    isNoAvailableDates: false,
    isValidatedOfferUnavailable: false,
    isError: false,
    setIsSummaryRequestError: jest.fn(),
    submitDates: jest.fn(),
    isDatesChanged: false,
};
