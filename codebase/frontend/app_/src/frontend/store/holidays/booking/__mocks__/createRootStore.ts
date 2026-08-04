const createRootStore = (): any => ({
    appStore: { setLoading: jest.fn(), setNavigationBooking: jest.fn() },
    layoutStore: {
        basePath: '/en/holidays',
        isHotelDetailsBookPage: false,
        isExtrasPage: false,
        getPhrase: jest.fn(p => p),
        getSetting: jest.fn(),
        getSettingAsNumber: jest.fn(),
        isApplySpecialFilter: jest.fn(),
    },
    redeemVoucherStore: {
        cleanupRedeemStore: jest.fn(),
    },
    guestDetailsStore: {
        guestsDetails: [],
        createGuestsDetails: jest.fn(),
        clearGuestDetails: jest.fn(),
    },
    hotelsStore: {
        activeOfferId: null,
        offers: [],
        clearPrefillParams: jest.fn(),
    },
    searchStore: {
        searchFrom: {
            origins: ['LGW'],
        },
        searchTo: {
            selectedDestinationCodes: ['ES'],
            selectedDestinationCodesQuery: 'ES',
            destinationsDisplayValue: { main: 'test' },
            setSelectedAccommodationCodes: jest.fn(),
        },
        searchWhen: { from: new Date(2020, 0, 1), to: new Date(2020, 0, 7), flexDays: 3 },
        searchWho: {
            roomsAllocation: [
                {
                    adults: [{}, {}],
                    children: [{}],
                    infants: [{}],
                    roomCode: 'QWER',
                },
            ],
        },
        clearSearchValues: jest.fn(),
    },
    queryParamsStore: {
        offerRoomsAllocationFromUrl: [],
        altAccommodationsFromUrl: ['altAccommodationsFromUrl'],
        outboundLCBSelectionFromUrl: 'outboundLCBSelectionFromUrl',
        inboundLCBSelectionFromUrl: 'inboundLCBSelectionFromUrl',
        buildHotelDetailsQuery: jest.fn(() => 'query'),
        isFlightPlusHotelFunnel: false,
    },
    routerStore: {
        redirectToHomePage: jest.fn(),
        updateCurrentPage: jest.fn(),
        state: {
            searchPrice: '500',
        },
    },
    engageStore: {
        getOrderingFromPromoCode: jest.fn(),
    },
    payStore: {
        onForceErrors: jest.fn(),
        setSessionId: jest.fn(),
        setPaymentError: jest.fn(),
        setFailedToPay: jest.fn(),
        setPaymentErrors: jest.fn(),
        setPaymentAuthorization: jest.fn(),
        clearCardInfo: jest.fn(),
        paymentInfo: { creditAmount: 0 },
        selectedPaymentType: '',
    },
    paymentStore: {
        canPay: false,
        clearPaymentUI: jest.fn(),
        clearPaymentStore: jest.fn(),
        setBookingReference: jest.fn(),
        reselectPayment: jest.fn(),
    },
    paymentTypeStore: {
        setSelectedPaymentType: jest.fn(),
    },
    holidayCreditStore: {
        setCreditEnabledApiSettings: jest.fn(),
    },
    userStore: {
        setUserDetails: jest.fn(),
    },
    promoPageStore: {
        from: new Date('2025-12-01'),
        to: new Date('2025-12-10'),
    },
    trackingStore: {
        holidayConfigChangeTrigger: jest.fn(),
        trackTransferChange: jest.fn(),
        trackLateCheckoutChange: jest.fn(),
        setPreviousPage: jest.fn(),
        trackRecommenderNotLoaded: jest.fn(),
        setBd4RecommenderPlacementId: jest.fn(),
        setBd4RecommenderTracking: jest.fn(),
        applyPromoCodeTrigger: jest.fn(),
    },
    seatMapStore: {
        selectedSeats: [
            {
                sectorId: 'sectorId-0',
                seats: [{ paxIndex: '000', seatNumber: 'seatNumber' }],
            },
        ],
        clearSelectedSeatsAndUpdateUrl: jest.fn(() => Promise.resolve()),
        setIsSelectedSeatsUnavailableError: jest.fn(),
        setValidatedSelectedSeats: jest.fn(),
        notValidatedOfferPrice: 0,
    },
    flightsPassengersStore: { setPassengersStore: jest.fn() },
    searchFiltersStore: { hotelTypesFilters: 'lux' },
    airportParkingStore: {
        selectedAirportParking: null,
        setSelectedAirportParking: jest.fn(),
        setIsSelectedParkingUnavailableError: jest.fn(),
    },
});

export default createRootStore;
