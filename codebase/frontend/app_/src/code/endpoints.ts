import qs, { IStringifyOptions } from 'qs';

import isBackend from 'frontend/utils/isBackend';
import {
    buildAltAccommodationsParams,
    buildChildAgesQuery,
    buildCmsUrlWithMediaSizeQuery,
    buildLuggageQuery,
    buildRoomsParams,
    buildSelectedSeatsQuery,
} from 'frontend/utils/url.utils';
import { ISubmitDatesQuery } from 'models/data/bookingAmendment/AmendDates';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { IValidateQuizAnswersParams } from 'models/data/IHolidayInspiration';
import { IAltAccommodation } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { IMediaSizeParams } from 'models/data/MediaSizeParams';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { DestinationTypeBit } from 'models/enum/DestinationType';
import { DEPARTURE_ALL_CODE, GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { IHotelPointsOfInterestRequestParams } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import { getCMSLang } from './cmsLang';
import { TWO } from './commonNumbers';
import { envPublic, getEnvAll } from './env';

interface ISearchArgs {
    autoAllocation: boolean;
    dep: string;
    duration: string[];
    flexibleDays: number;
    geog: string;
    rooms: IQueryRoom[];
    startDate: string;
    accomCodes?: string;
    boardType?: string;
    departureAirport?: string;
    destination?: string;
    destinations?: Nullable<string[]>;
    deviceType?: string;
    discountOnly?: boolean;
    distressedFlightsOnly?: boolean;
    endDate?: string;
    facilities?: string;
    flightDurationFrom?: number;
    flightDurationTo?: number;
    flights?: string;
    hotelTypes?: string;
    inboundFlightNumber?: string;
    inboundTimeSlots?: string;
    initialPricePPFrom?: number | null;
    initialPricePPTo?: number | null;
    initialThemes?: string;
    initialTotalPriceFrom?: number | null;
    initialTotalPriceTo?: number | null;
    isPricePP?: boolean;
    isPromoPage?: boolean;
    maxDisc?: number;
    maxDiscP?: number;
    minDisc?: number;
    minDiscP?: number;
    offers?: string;
    orderBy?: string;
    orderDirection?: string;
    outboundFlightNumber?: string;
    outboundTimeSlots?: string;
    page?: number;
    placementId?: string;
    polygon?: string;
    priceFrom?: number | null;
    priceTo?: number | null;
    promoPageId?: string;
    searchType?: string;
    starRating?: string;
    take?: number;
    themes?: string;
    tripAdvisorRating?: string;
}

export const QS_CONFIG: IStringifyOptions = {
    encode: false,
    allowDots: true,
    skipNulls: true,
    filter: (_, value) => (value !== '' && value !== undefined ? value : undefined),
};

export const cmsUrls = {
    placeholdersLayout: (path: string, placeholders: string[], lang: string): string => {
        let layoutPath = `${envPublic.CMS_LAYOUT}/placeholder?item=${path}&lang=${lang}`;

        placeholders.forEach((p, i) => {
            layoutPath += `&placeholderName[${i}]=${p}`;
        });

        return layoutPath;
    },

    media: (_path: string, mediaSizeParams?: IMediaSizeParams): string => {
        const path = _path || '';

        const group = path.match(
            /(https?:\/\/(?:[a-z][a-z\.\d\-]+)\.(?:[a-z][a-z\-]+)(?![\w\.]))?(\/\-\/(jss)?media.*)/i,
        );

        const url = group?.length ? `${envPublic.CMS_MEDIA}${group[group.length - TWO]}` : path;

        return mediaSizeParams ? buildCmsUrlWithMediaSizeQuery(url, mediaSizeParams) : url;
    },

    // Experience Editor specific
    itemDetails: (itemId: string, fields = '', lang: string = 'en'): string => {
        let url = `/sitecore/api/ssc/item/${itemId}?sc_lang=${getCMSLang(lang)}`;

        if (fields) {
            url += `&fields=${fields}`;
        }

        return url;
    },
    itemChildren: (
        itemId: string,
        fields?: string,
        includeStandardTemplateFields?: boolean,
        lang: string = 'en',
    ): string => {
        let url = `/sitecore/api/ssc/item/${itemId}/children?sc_lang=${getCMSLang(lang)}`;

        if (fields) {
            url += `&fields=${fields}`;
        }

        if (includeStandardTemplateFields) {
            url += '&includeStandardTemplateFields=true';
        }

        return url;
    },
    createItem: (itemPath: string, lang: string): string =>
        `/sitecore/api/ssc/item/${encodeURIComponent(itemPath.substr(1))}?sc_lang=${getCMSLang(lang)}`,
    deleteItem: (itemId: string, lang: string): string =>
        `/sitecore/api/ssc/item/${itemId}?sc_lang=${getCMSLang(lang)}`,
    itemPopup: (itemId: string, lang: string): string =>
        `/sitecore/shell/applications/content-editor?fo={${itemId}}&id={${itemId}}&mo=popup&sc_lang=${getCMSLang(
            lang,
        )}`,

    getVirtualFacilityGroupIdByFacilityId: (itemId: string, lang: string): string =>
        `/api/ReferenceData/GetVirtualFacilityGroupIdByFacilityId?sc_lang=${getCMSLang(lang)}&id=${itemId}`,
    sortItems: (lang: string): string => `/api/utilities/SortItems?sc_lang=${getCMSLang(lang)}`,
    deleteItems: (lang: string): string => `/api/utilities/DeleteItems?sc_lang=${getCMSLang(lang)}`,
    sendPersonalizeOrderData: (): string => `${envPublic.CMS_API}/SitecorePersonalizeUtil/OrderCheckoutReference`,
    getHotelImage: (hotelCode: string): string =>
        `${envPublic.CMS_API}/DestinationsSearch/GetHotelImage?code=${hotelCode}`,
    getDestinationImage: (resortCode: string): string =>
        `${envPublic.CMS_API}/DestinationsSearch/GetImage?code=${resortCode}`,
};

export const getWepApiUri = (): string => {
    if (isBackend()) {
        return `${getEnvAll().ORIGINAL_WEBAPI_URL}/v1.0`;
    }

    return `${envPublic.WEBAPI_URL}/v1.0`;
};

export const getUMApiUri = (): string => `${envPublic.USER_MANAGEMENT_API_URL}/v1`;

export const boolToString = (value: boolean): string => {
    if (value) return 'true';

    return 'false';
};

export const webApiUrls = {
    search: (args: ISearchArgs): string => {
        const {
            dep,
            isPromoPage,
            destination,
            geog,
            autoAllocation,
            rooms,
            accomCodes,
            priceFrom,
            priceTo,
            isPricePP,
            distressedFlightsOnly,
            discountOnly,
            destinations,
            deviceType,
            ...rest
        } = args;

        return (
            `${getWepApiUri()}/search/packages?` +
            qs.stringify(
                {
                    ...rest,
                    departure: dep || DEPARTURE_ALL_CODE,
                    geography:
                        !isPromoPage || (isPromoPage && destination)
                            ? destination || geog || GEOGRAPHY_ALL_CODE
                            : undefined,
                    automaticAllocation: boolToString(autoAllocation),
                    room: buildRoomsParams(rooms),
                    childAges: buildChildAgesQuery(rooms),
                    accomCodes: accomCodes && !isPromoPage ? accomCodes : undefined,
                    PriceFrom: priceFrom,
                    PriceTo: priceTo,
                    IsPricePP: priceFrom || priceTo ? isPricePP : undefined,
                    distressedFlightsOnly: boolToString(!!distressedFlightsOnly),
                    discountOnly: discountOnly || undefined,
                    isPromo: isPromoPage ? boolToString(isPromoPage) : undefined,
                    destinations: destinations || undefined,
                    originalGeography: geog,
                    DeviceType: deviceType,
                },
                QS_CONFIG,
            )
        );
    },

    searchMap: ({ rooms, ...rest }): string =>
        `${getWepApiUri()}/search/packages-map?` +
        qs.stringify(
            {
                room: buildRoomsParams(rooms),
                childAges: buildChildAgesQuery(rooms),
                ...rest,
            },
            QS_CONFIG,
        ),

    searchSummary: ({ rooms, ...rest }): string =>
        `${getWepApiUri()}/search/packages-summary?` +
        qs.stringify(
            {
                room: buildRoomsParams(rooms),
                childAges: buildChildAgesQuery(rooms),
                ...rest,
            },
            QS_CONFIG,
        ),

    searchDestinations: (
        query: string,
        from: string,
        startDate: string,
        endDate: string,
        flexibleDays: number,
        duration?: number,
    ): string =>
        `${getWepApiUri()}/destinations/search?` +
        qs.stringify(
            {
                query,
                from,
                startDate,
                endDate,
                flexibleDays,
                duration,
            },
            {
                ...QS_CONFIG,
                encode: true,
            },
        ),

    /**
     * Search destination by query and types.
     * The type filter ("destination" param) is a bit flag in api. So send a total bits of all types.
     */
    searchDestinationsByQueryAndTypes: (query: string, types: DestinationTypeBit[] = []): string => {
        const totalBits = types.reduce((total, bit) => total + bit, 0);

        return `${getWepApiUri()}/destinations?query=${query}&destination=${totalBits}`;
    },

    searchHotel: (
        startDate: string,
        flexibleDays: number,
        duration: string,
        departure: string,
        roomsAllocation: IQueryRoom[],
        accommodationId: string,
        outboundRouteId: string,
        inboundRouteId: string,
        packageId: string,
        boardType?: string,
        transfer?: string,
        geography?: string,
        isExt?: boolean,
        lateRoomCheckout?: boolean,
        altAcc?: IAltAccommodation[],
        selectedSeats?: ISelectedSeat[],
        selectedLuggageAdults?: IHoldLuggageInfo,
        selectedLuggageChildren?: IHoldLuggageInfo,
        hotelTypes?: string,
        searchPrice?: number,
        lcbOut?: string,
        lcbIn?: string,
        airportParkingCode?: string,
        ecp?: string,
    ): string =>
        `${getWepApiUri()}/hotel/offers?` +
        qs.stringify(
            {
                startDate,
                flexibleDays,
                duration,
                departure,
                room: buildRoomsParams(roomsAllocation),
                childAges: buildChildAgesQuery(roomsAllocation),
                accommodationId,
                outboundRouteId,
                inboundRouteId,
                packageId,
                altAcc: buildAltAccommodationsParams(altAcc),
                boardType,
                transfer,
                geography,
                isExt,
                lateRoomCheckout,
                seats: buildSelectedSeatsQuery(selectedSeats),
                lug: [buildLuggageQuery(selectedLuggageAdults), buildLuggageQuery(selectedLuggageChildren)],
                lcbOut,
                lcbIn,
                hotelTypes,
                searchPrice,
                airportParkingCode,
                ecp,
            },
            {
                ...QS_CONFIG,
                filter: (prefix, value) =>
                    //**Should have seats as a param even if one of the route them is empty ANC-1290*/
                    prefix.includes('seats') || (value !== '' && value !== undefined) ? value : undefined,
            },
        ),

    searchOffersAlterations: (
        startDate: string,
        flexibleDays: number,
        duration: string,
        departure: string,
        roomsAllocation: IQueryRoom[],
        accommodationId: string,
        outboundRouteId: string,
        inboundRouteId: string,
        packageId: string,
        boardType: string,
        isExternal?: boolean,
        altAcc?: IAltAccommodation[],
        transferCode?: string,
        ecp?: string,
    ): string =>
        `${getWepApiUri()}/search/offers-alterations?` +
        qs.stringify(
            {
                startDate,
                flexibleDays,
                duration,
                departure,
                room: buildRoomsParams(roomsAllocation),
                childAges: buildChildAgesQuery(roomsAllocation),
                accommodationId,
                outboundRouteId,
                inboundRouteId,
                packageId,
                altAcc: buildAltAccommodationsParams(altAcc),
                boardType,
                isExt: isExternal || undefined,
                transfer: transferCode || undefined,
                ecp,
            },
            QS_CONFIG,
        ),

    searchAlternativeFlights: (
        startDate: string,
        flexibleDays: number,
        duration: string,
        departure: string,
        roomsAllocation: IQueryRoom[],
        accommodationId: string,
        boardType?: string,
        outboundRouteId?: string,
        inboundRouteId?: string,
        transfer?: string,
        withHotels?: boolean,
        originalAirport?: string,
        ecp?: string,
    ): string =>
        `${getWepApiUri()}/search/alternative-flights?` +
        qs.stringify(
            {
                startDate,
                flexibleDays,
                duration,
                departure,
                room: buildRoomsParams(roomsAllocation),
                childAges: buildChildAgesQuery(roomsAllocation),
                accommodationId,
                boardType,
                outboundRouteId,
                inboundRouteId,
                transfer: transfer || undefined,
                withHotels: withHotels ? boolToString(withHotels) : undefined,
                originalAirport,
                ecp,
            },
            QS_CONFIG,
        ),

    validatePackage: (): string => `${getWepApiUri()}/booking/validate-package`,
    validatePromoCode: (): string => `${getWepApiUri()}/booking/validate-promo-code`,
    fetchSeatMap: (
        depAirportCode: string,
        arrAirportCode: string,
        departureDate: string,
        flightNumber: string,
        isOutboundFlight: boolean,
        offerPromoCode?: string,
    ): string =>
        `${getWepApiUri()}/seats?` +
        qs.stringify(
            {
                DepAirportCode: depAirportCode,
                ArrAirportCode: arrAirportCode,
                DepartureDate: departureDate,
                FlightNumber: flightNumber,
                IsOutboundFlight: boolToString(isOutboundFlight),
                Promo: offerPromoCode,
            },
            QS_CONFIG,
        ),
    toggleBookingPrivacy: (): string => `${getWepApiUri()}/booking/make-private`,
    commitBooking: (): string => `${getWepApiUri()}/booking/commit`,
    changeBooking: (): string => `${getWepApiUri()}/booking/change`,
    payRemainingBalance: (): string => `${getWepApiUri()}/booking/pay-remaining-balance`,
    amendCommit: (): string => `${getWepApiUri()}/amend/commit`,
    logging: {
        post: (): string => `${getWepApiUri()}/logging`,
        level: (): string => `${envPublic.FRONT_LOGGING_LEVEL}`,
    },
    session: {
        login: (): string => `${getWepApiUri()}/account/login`,
        register: (): string => `${getWepApiUri()}/account`,
        logout: (): string => `${getWepApiUri()}/account/logout`,
        status: (): string => `${getWepApiUri()}/account/status`,
        userDetails: (): string => `${getWepApiUri()}/account/customer-details`,
        resetPassword: (email: string): string => `${getWepApiUri()}/account/reset-password?email=${email}`,
        verifyEmail: (email: string): string => `${getWepApiUri()}/account/exists?email=${email}`,
    },
    getAllDestinations: (): string => `${getWepApiUri()}/destinations/countries`,

    getLastAvailableDate: (): string => `${getWepApiUri()}/availability/last-available-date`,

    getHoldLuggage: (): string => `${getWepApiUri()}/search/flight-extras`,

    getAvailableDestinations: (
        from: string,
        startDate: string,
        endDate: string,
        flexibleDays: number = 0,
        duration?: number,
    ): string =>
        `${getWepApiUri()}/availability/to?` +
        qs.stringify(
            {
                from,
                startDate,
                endDate,
                flexibleDays,
                duration,
            },
            QS_CONFIG,
        ),

    getAvailableDates: (
        from: string,
        to: string | undefined,
        startDate: string,
        endDate: string,
        promoPageId?: string,
        selectedFromDate?: string,
    ): string =>
        `${getWepApiUri()}/availability/dates?` +
        qs.stringify(
            {
                from,
                to: !promoPageId ? to : undefined,
                startDate,
                endDate,
                promoPageId,
                selectedFromDate,
            },
            QS_CONFIG,
        ),

    getAvailableMonths: (duration: number, from?: string, to?: string): string =>
        `${getWepApiUri()}/availability/months?` + qs.stringify({ duration, from, to }, QS_CONFIG),

    getAvailableOrigins: (
        to: string,
        startDate: string,
        endDate: string,
        flexDays: number = 0,
        promoPageId?: string,
        duration?: number,
    ): string =>
        `${getWepApiUri()}/availability/from?` +
        qs.stringify(
            {
                to: !promoPageId ? to : undefined,
                startDate: startDate,
                endDate: endDate,
                flexibleDays: flexDays,
                promoPageId: promoPageId,
                duration,
            },
            QS_CONFIG,
        ),

    getDestinationsAvailability: (to: string): string => `${getWepApiUri()}/availability/exists?to=${to}`,

    getDestinationByDotComCodes: (query: string): string => `${getWepApiUri()}/destinations/map?query=${query}`,

    getDestinationLocationImage: (locationCode: string): string =>
        `${getWepApiUri()}/destinations/${locationCode}/image`,

    getPlaceTitleByCodeUrl: (): string => `${getWepApiUri()}/destinations/title`,

    simpleBookingSearch: (bookingReference: string): string =>
        `${getWepApiUri()}/trade-portal/booking/search/simple/?bookingReference=${bookingReference}`,

    countries: (): string => `${getWepApiUri()}/content/countries`,
    dialingCodes: (): string => `${getWepApiUri()}/content/dialing-codes`,
    hotelInfo: (hotelCode: string, board?: string, room?: string): string =>
        `${getWepApiUri()}/content/hotels/${hotelCode}?board=${board || ''}&room=${room || ''}`,
    mapsInfo: (): string => `${getWepApiUri()}/content/maps-info`,
    destinationHotelsSummary: (code: string): string => `${getWepApiUri()}/hotel/summary/location?code=${code}`,
    polygonDestinationHotelsSummary: (): string => `${getWepApiUri()}/hotel/summary/polygon`,
    searchExtras: (): string => `${getWepApiUri()}/search/extras`,

    viewBooking: (): string => `${getWepApiUri()}/booking/retrieve`,
    getBookingTransfers: (): string => `${getWepApiUri()}/booking/transfer`,
    fetchBookings: (): string => `${getWepApiUri()}/booking/list`,
    fetchBookingsFromApollo: (): string => `${getWepApiUri()}/apollo/get-upcoming-bookings`,
    assistedTravel: (bookingReference: string): string =>
        `${getWepApiUri()}/booking/${bookingReference}/assisted-travel`,
    amendBookingSSR: (): string => `${getWepApiUri()}/amend/amend-ssr`,
    amendPassengerDetails: (): string => `${getWepApiUri()}/amend/pax-name`,
    checkForNameChangePossibility: (): string => `${getWepApiUri()}/amend/pax-limit-validation`,
    assignBooking: (): string => `${getWepApiUri()}/booking/assign`,
    bookingToken: (): string => `${getWepApiUri()}/booking/token`,
    bookingByToken: (token: string): string => `${getWepApiUri()}/booking/${token}`,
    pdfBooking: (): string => `${getWepApiUri()}/booking/confirmation`,
    pdfPaymentReceipt: (date: string, reference: string, lastName: string): string =>
        `${getWepApiUri()}/booking/payment-receipt?` +
        `bookingReference=${reference}` +
        `&lastName=${lastName}` +
        `&date=${date}`,
    creditBooking: (): string => `${getWepApiUri()}/booking/credit`,

    facilities: (): string => `${getWepApiUri()}/content/filter-facilities`,

    getReviews: (hotelId: number): string => `${getWepApiUri()}/hotel/reviews/${hotelId}`,

    getFeefoReviews: (
        count: number,
        rating: string[],
        createdDateTime?: string,
        updatedDateTime?: string,
        sort?: string,
        createdSince?: string,
        tagDate?: string,
        tagCategory?: string,
        tagDestinationCountry?: string,
        tagDestinationRegion?: string,
        tagResort?: string,
        tagNumberOfPassengers?: string,
        tagPackageType?: string,
    ): string =>
        `${getWepApiUri()}/reviews?` +
        qs.stringify(
            {
                count,
                rating,
                createdDateTime,
                updatedDateTime,
                sort,
                createdSince,
                tagDate,
                tagCategory,
                tagDestinationCountry,
                tagDestinationRegion,
                tagResort,
                tagNumberOfPassengers,
                tagPackageType,
            },
            QS_CONFIG,
        ),
    loadResortInfo: (code: string): string => `${getWepApiUri()}/hotel/resort-info?code=${code}`,

    loadHotelHighlightsInfo: (code: string): string => `${getWepApiUri()}/hotel/highlights-info?code=${code}`,

    featuredFacilities: (code: string): string => `${getWepApiUri()}/hotel/featured-facilities?code=${code}`,

    getPriceGraphDates: (
        startDate: string,
        initialDate: string,
        flexibleDays: number,
        duration: number,
        departure: string,
        roomsAllocation: IQueryRoom[],
        accommodationIds: string,
        boardType: string,
        outboundDepartureTime: ITimeSlot[],
        inboundDepartureTime: ITimeSlot[],
        isCheapestRoom?: boolean,
    ): string =>
        `${getWepApiUri()}/search/price-graph?` +
        qs.stringify(
            {
                startDate,
                initialDate,
                flexibleDays,
                duration,
                departure,
                room: buildRoomsParams(roomsAllocation),
                childAges: buildChildAgesQuery(roomsAllocation),
                accommodationIds,
                boardType,
                outboundDepartureTime,
                inboundDepartureTime,
                isCheapestRoom,
            },
            QS_CONFIG,
        ),
    getPricesForCompareCalendar: (
        startDate: string,
        start: string,
        end: string,
        flexibleDays: number,
        duration: number,
        departure: string,
        roomsAllocation: IQueryRoom[],
        accommodationIds: string,
        boardType: string,
        outboundDepartureTime: ITimeSlot[],
        inboundDepartureTime: ITimeSlot[],
        isCheapestRoom: boolean,
    ): string =>
        `${getWepApiUri()}/search/price-graph/month?` +
        qs.stringify(
            {
                startDate,
                start,
                end,
                flexibleDays,
                duration,
                departure,
                room: buildRoomsParams(roomsAllocation),
                childAges: buildChildAgesQuery(roomsAllocation),
                accommodationIds,
                boardType,
                outboundDepartureTime,
                inboundDepartureTime,
                isCheapestRoom,
            },
            QS_CONFIG,
        ),

    getArticles: (): string => `${getWepApiUri()}/mediacenter/search`,

    // Recommender Hotels Booking
    recommended: (
        startDate: string,
        flexibleDays: number,
        duration: string[],
        dep: string,
        geog: string,
        autoAllocation: boolean,
        rooms: IQueryRoom[],
        pageType?: string,
        offers?: string,
        distressedFlightsOnly?: boolean,
        placementId?: string,
        atcomCode?: string,
        endDate?: string,
        isPromo?: boolean,
        promopageId?: string,
        destinations?: Nullable<string[]>,
    ): string =>
        `${getWepApiUri()}/search/recommended?` +
        qs.stringify(
            {
                startDate,
                endDate,
                flexibleDays,
                duration,
                departure: dep || DEPARTURE_ALL_CODE,
                geography: !isPromo || (isPromo && geog) ? geog || GEOGRAPHY_ALL_CODE : undefined,
                automaticAllocation: boolToString(autoAllocation),
                room: buildRoomsParams(rooms),
                childAges: buildChildAgesQuery(rooms),
                offers,
                searchType: 'normal',
                distressedFlightsOnly: boolToString(!!distressedFlightsOnly),
                placementId,
                pageType,
                accomCodes: atcomCode && !isPromo ? atcomCode : undefined,
                isPromo: isPromo || undefined,
                promopageId,
                destinations,
            },
            QS_CONFIG,
        ),

    // Recommender Hotels Browse
    recommendedBrowse: (
        destinations: string[],
        isDestinationSearch: boolean,
        placementId: string,
        pageType?: string,
        accomCodes?: string,
        requestedAmountOfHotels?: number,
    ): string =>
        `${getWepApiUri()}/search/recommended?` +
        qs.stringify(
            {
                destinations,
                IsDestinationSearch: isDestinationSearch,
                placementId,
                pageType,
                accomCodes,
                requestedAmountOfHotels,
            },
            QS_CONFIG,
        ),

    // Generic Recommender Hotels
    recommendedGeneric: (
        placementId: string,
        pageType?: string,
        isDestinationSearch: boolean = true,
        isLivePrice: boolean = false,
        hotelThemeTypes?: string,
    ): string =>
        `${getWepApiUri()}/search/recommended?` +
        qs.stringify(
            {
                placementId,
                pageType,
                isDestinationSearch,
                isLivePrice,
                hotelThemeTypes,
            },
            QS_CONFIG,
        ),

    // Holiday Credit
    getBalanceHistory: (): string => `${getWepApiUri()}/credit/history`,
    getCreditBalance: (): string => `${getWepApiUri()}/credit/me`,

    // Shortlist
    getShortlistOffers: (take?: number, page?: number): string =>
        `${getWepApiUri()}/shortlist?` + qs.stringify({ take, page }, QS_CONFIG),
    deleteShortlistedItems: (ids: string[]): string =>
        `${getWepApiUri()}/shortlist/delete?${qs.stringify({ ids }, QS_CONFIG)}`,
    getHotelShortlistStatus: (giataCode: string): string => `${getWepApiUri()}/shortlist/hotelStatus/${giataCode}`,
    addHotelToShortlist: (): string => `${getWepApiUri()}/shortlist/hotel`,
    addOfferToShortlist: (): string => `${getWepApiUri()}/shortlist`,
    getShortlistStatus: (): string => `${getWepApiUri()}/shortlist/status`,

    getLivePrice: (itemCode: string, round = true, promo = false): string =>
        `${getWepApiUri()}/price?key=${itemCode}&round=${round}&promo=${promo}`,

    geRequestedPrice: (key: string, round = true): string =>
        `${getWepApiUri()}/requested-price?key=${key}&round=${round}`,

    pricePromise: (): string => `${getWepApiUri()}/price-promise`,

    contactUs: (): string => `${getWepApiUri()}/contact-us`,

    tradeAgentFeedback: (): string => `${getWepApiUri()}/trade-portal/feedback`,

    tradeGroupBooking: (): string => `${getWepApiUri()}/trade-portal/group-booking`,

    destinationsByCodes: (includeRelatedItems?: boolean): string =>
        `${getWepApiUri()}/destinations/search?${qs.stringify({ includeRelatedItems }, QS_CONFIG)}`,

    getCheapestMonths: (airports: string, destinations: string): string =>
        `${getWepApiUri()}/search/cheapest-month?${qs.stringify({ airports, destinations }, QS_CONFIG)}`,

    excursionsForDestination: (
        destinationCode: string,
        marketCode: string,
        startDate?: string,
        endDate?: string,
    ): string =>
        `${getWepApiUri()}/excursions?${qs.stringify({ destinationCode, startDate, endDate, marketCode }, QS_CONFIG)}`,

    saveFeedback: (): string => `${getWepApiUri()}/help-centre/feedback/save`,

    saveFaqFeedback: (): string => `${getWepApiUri()}/help-centre/faq/save`,

    marketing: {
        unsubscribe: (): string => `${getWepApiUri()}/marketing/unsubscribe`,
        decryptEncEmail: (encEmail: string): string => `${getWepApiUri()}/marketing/decrypt-email?encEmail=${encEmail}`,
    },
    userVoucherCode: (campaignId: string): string =>
        `${getWepApiUri()}/voucher/single-use-promo-code?campaignId=${campaignId}`,
    validateVoucherCode: (code: string): string => `${getWepApiUri()}/voucher/validate?` + `voucherCode=${code}`,
    redeemVoucher: (code: string): string => `${getWepApiUri()}/voucher/redeem?` + `voucherCode=${code}`,

    getAmendAlternativeFlights: (bookingReference: string): string =>
        `${getWepApiUri()}/amend/alternative-flights?bookingReference=${bookingReference}`,

    getAmendSeats: (): string => `${getWepApiUri()}/amend/seats`,
    getAmendAlternativeFlightsWithLivePrice: (): string => `${getWepApiUri()}/amend/alternative-flights/validate`,

    amendRoomAndBoardOffers: `${getWepApiUri()}/amend/amend-room-and-board/info`,
    amendHotelRoomAndBoardOffers: `${getWepApiUri()}/amend/amend-hotel/alternative-rooms-and-boards`,
    amendRoomAndBoardValidateOffer: `${getWepApiUri()}/amend/amend-room-and-board/validate`,
    validateAmendAlternativeTransfersPrice: (): string =>
        `${getWepApiUri()}/amend/alternative-transfers/validate-price`,
    amendTransfersWithPrice: (): string => `${getWepApiUri()}/amend/alternative-transfers/price`,
    amendDatesAvailability: (
        accommodationId: string,
        departure: string,
        duration: string,
        endDate: string,
        startDate: string,
        rooms?: IQueryRoom[],
    ): string =>
        `${getWepApiUri()}/amend/amend-date/info?` +
        qs.stringify(
            {
                accommodationId,
                departure,
                duration,
                endDate,
                startDate,
                room: buildRoomsParams(rooms),
                childAges: buildChildAgesQuery(rooms),
            },
            QS_CONFIG,
        ),
    amendDatesBooking: ({
        accomId,
        boardType,
        bookingRef,
        duration,
        inboundDepTime,
        outboundDepTime,
        rooms,
        selectedDate,
        transferCode,
    }: ISubmitDatesQuery): string =>
        `${getWepApiUri()}/amend/amend-dates/summary?` +
        qs.stringify(
            {
                accomId,
                boardType,
                bookingRef,
                duration,
                inboundDepTime,
                outboundDepTime,
                room: buildRoomsParams(rooms, true),
                selectedDate,
                transferCode,
                childAges: buildChildAgesQuery(rooms),
            },
            //We don't use QS_CONFIG because we need to encode time value. This needs to support logic that existed before
            { allowDots: true, encodeValuesOnly: true },
        ),
    errataHotelMessage: (): string => `${getWepApiUri()}/errata/accom-errata`,
    amendDatesTransfers: (): string => `${getWepApiUri()}/amend/amend-dates/transfer`,
    amendDatesFlights: (): string => `${getWepApiUri()}/amend/amend-dates/flights`,
    amendDatesValidateOffer: (): string => `${getWepApiUri()}/amend/amend-dates/validate`,

    getAlternativeAmendHotels: (): string => `${getWepApiUri()}/amend/amend-hotel/hotel-list`,
    validateAlternativeAmendHotel: (): string => `${getWepApiUri()}/amend/amend-hotel/validate`,
    getAmendHotelTransfers: (): string => `${getWepApiUri()}/amend/amend-hotel/alternative-transfers`,

    validateRefundAmount: (): string => `${getWepApiUri()}/amend/partial-refund/validate`,
    weather: (code: string): string => `${getWepApiUri()}/weather/region?code=${code}`,

    //Holiday Inspiration
    getQuizResult: (): string => `${getWepApiUri()}/holiday-inspiration/recommended`,

    validHolidayInspirationAnswers: ({ departure, weather }: IValidateQuizAnswersParams): string =>
        `${getWepApiUri()}/holiday-inspiration/validate-answers?` +
        qs.stringify(
            {
                departure,
                weather,
            },
            QS_CONFIG,
        ),

    getAirportParking: (): string => `${getWepApiUri()}/airport-parking/search`,
    cancellationSummary: (): string => `${getWepApiUri()}/booking/cancellation/summary/customer`,
    cancellationSummaryTrade: (): string => `${getWepApiUri()}/booking/cancellation/summary/trade`,
    cancelBooking: (): string => `${getWepApiUri()}/booking/cancellation/customer`,
    cancelBookingTrade: (): string => `${getWepApiUri()}/booking/cancellation/trade`,

    // New Payment Types (npt-apple-pay)
    validateMerchant: (): string => `${getWepApiUri()}/payment/apple-pay/session`,
    hotelPointsOfInterest: (params: IHotelPointsOfInterestRequestParams): string =>
        `${getWepApiUri()}/resort/getpois?${qs.stringify(params)}`,
};

export const userManagementApiUrls = {
    currentUser: (): string => `${getUMApiUri()}/users/current`,
};

export const tradePortalWebApiUrls = {
    session: {
        login: (): string => `${getWepApiUri()}/trade-portal/account/login`,
        logout: (): string => `${getWepApiUri()}/trade-portal/account/logout`,
        status: (): string => `${getWepApiUri()}/trade-portal/account/status`,
    },
};

export const notificationsUrls = {
    subscribe: (): string => `${envPublic.NOTIFICATIONS_URL}/subscribe`,
    unsubscribe: (): string => `${envPublic.NOTIFICATIONS_URL}/unsubscribe`,
    trackBookingData: (): string => `${envPublic.CMS_API}/tracking/booking-data`,
    trackHotelData: (): string => `${envPublic.CMS_API}/tracking/hotel-data`,
    trackUserSearch: (): string => `${envPublic.CMS_API}/tracking/user-search`,
    triggerPatternCard: (): string => `${envPublic.CMS_API}/HotelTheme/TriggerPatternCard`,
};

export const paymentTrackingUrls = {
    sendEventGoogleAnalytics: (): string =>
        `${envPublic.PAYMENT_TRACKING_URL}?measurement_id=${envPublic.GA_MEASUREMENT_ID}&api_secret=${envPublic.GA_TRACKING_API_SECRET}`,
};

export const connectionCheck = '/holidays/connection/check.txt';

export const shareUrls = {
    facebook: (url: string): string =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&display=page`,
    twitter: (title: string, url: string): string =>
        `https://twitter.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    email: (subject: string, body: string): string =>
        `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    sms: (body: string): string => `sms:?&body=${encodeURIComponent(body)}`,
    whatsapp: (body: string): string => `https://wa.me/?text=${encodeURIComponent(body)}`,
    hotukdeals: (title: string, url: string, price: number): string =>
        `https://hotukdeals.com/social/share?title=${encodeURIComponent(title)}&url=${encodeURIComponent(
            url,
        )}&style=vertical&v=2&price=${price}`,
};
