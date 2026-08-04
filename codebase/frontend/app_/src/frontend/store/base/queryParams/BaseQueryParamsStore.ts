import { action, computed, observable, toJS } from 'mobx';
import qs from 'qs';

import { TEN, TWO } from 'code/commonNumbers';
import { envPublic } from 'code/env';
import { DEFAULT_HOTEL_CODE_LENGTH } from 'frontend/store/base/search/constants';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getSearchQueryParamsByPrice } from 'frontend/utils/livePrice.utils';
import {
    buildAltIdsFromAltAccommodationsParams,
    buildGeogParamByDestinationCodeQuery,
    buildGeogParamByRelatedRegionsQuery,
    buildLCBQuery,
    buildRoomAllocationFromOfferUnitParams,
    buildRoomsQueryParams,
    checkIfQueryRooms,
    getSelectedSeatsQueryParams,
} from 'frontend/utils/url.utils';
import { IBd4Tracking } from 'models/data/IBd4Tracking';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { IBaseQueryRoom, IQueryRoom, IQueryRoomParams } from 'models/data/URLQueryRooms';
import { Bd4TravelListIdHolidays, TBd4TravelListId } from 'models/enum/Bd4TravelListId';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import { FlightPlusHotelSitePath } from 'models/enum/SitePath';
import { IMapPopupState } from 'frontend/components/common/MapPopup/MapPopup.utils';

import { BaseQueryParamsGetters } from './BaseQueryParamsGetters';

export interface IQueryParamsStoreInitialState {
    query?: qs.ParsedQs;
}

export class BaseQueryParamsStore extends BaseQueryParamsGetters implements ISssrStore<IQueryParamsStoreInitialState> {
    @observable mapZoomLevel: number = TEN;

    constructor(public rootStore: TRootStore) {
        super();
    }

    public serialize(): IQueryParamsStoreInitialState {
        return {
            query: toJS(this.query),
        };
    }

    public deserialize(initialState?: IQueryParamsStoreInitialState): void {
        if (initialState?.query) {
            this.query = initialState.query;
        }
    }

    @action public setMapZoomLevel = (zoom: number): void => {
        this.mapZoomLevel = zoom;
    };

    // Situational params helpers
    // TODO: should be more investigated. The Returned type qs.ParsedQs[keyof qs.ParsedQs] causes errors
    promoPage = (): string => this.query[QueryParamName.Promo];
    needLogout = (): boolean => this.query[QueryParamName.Logout];
    viewMyBooking = (): boolean => this.query[QueryParamName.ViewMyBooking];
    myBookings = (): boolean => this.query[QueryParamName.MyBookings];
    needOpenSearchPodWhoField = (): boolean => this.query[QueryParamName.OpenSearchPodWhoField];
    isPromotingIframe = (): boolean => this.query[QueryParamName.IsPromotingIframe];

    stringifyQuery = (query: AnyObject, encode: boolean = false): string => {
        [QueryParamName.Rooms, QueryParamName.OfferRooms].forEach(key => {
            if (query[key] && checkIfQueryRooms(query[key])) {
                query[key] = buildRoomsQueryParams(query[key] as IQueryRoomParams[]);
            }
        });

        const queryObject =
            this.rootStore.layoutStore.layout && this.rootStore.layoutStore.isSearchResultsPage
                ? query
                : { ...query, ...this.utmParams };

        return `?${qs.stringify(queryObject, { encode, arrayFormat: 'comma' })}`;
    };

    parseAndSyncQuery = (search: string, forceQuery = false): void => {
        this.parseBrowserQuery(search);
        this.rootStore.syncUrlParamsWithStores(forceQuery);
    };

    /**
     * Base search params query.
     * Only search pod params.
     *
     * ***Do not use outside of QueryParamsStore***
     */
    private buildSearchParamsQuery = (isBookingFlow: boolean = true): Partial<Record<QueryParamName, any>> => {
        const queryParams = {};

        if (isBookingFlow) {
            queryParams[QueryParamName.IsBookingFlow] = true;
        }

        if (isBookingFlow && this.rootStore.bookingStore.isMonthSearch) {
            queryParams[QueryParamName.IsMonthSearch] = true;
            queryParams[QueryParamName.MonthSearchDuration] = this.rootStore.bookingStore.monthSearchDuration;
        }

        queryParams[QueryParamName.To] = formatDateL10n(
            this.rootStore.bookingStore.to ?? this.rootStore.searchStore.searchWhen.to,
        );
        queryParams[QueryParamName.From] = formatDateL10n(
            this.rootStore.bookingStore.from ?? this.rootStore.searchStore.searchWhen.from,
        );

        queryParams[QueryParamName.OutboundFlightNumber] = this.rootStore.searchFiltersStore.outboundFlightNumber;
        queryParams[QueryParamName.InboundFlightNumber] = this.rootStore.searchFiltersStore.inboundFlightNumber;

        this.applyFlightPlusHotelParams(queryParams);

        // todo: should be more investigated
        // https://jira.build.easyjet.com/browse/EJH-18397
        // for some reason on mac/iphone there are losing selected-destination-codes
        // ================================
        const destinations = this.rootStore.bookingStore?.selectedDestinationCodes?.length
            ? this.rootStore.bookingStore.selectedDestinationCodes
            : this.selectedDestinationCodesFromUrl;

        if (destinations.length > 0) {
            queryParams[QueryParamName.Destination] = destinations.join(',');
        }

        queryParams[QueryParamName.SearchAccommodationId] =
            destinations[0]?.length === DEFAULT_HOTEL_CODE_LENGTH ? destinations.join(',') : '';
        // ================================

        queryParams[QueryParamName.Geog] =
            this.rootStore.bookingStore.selectedDestinationCodesQuery || this.selectedDestinationCodesQueryFromUrl;
        queryParams[QueryParamName.FlexDays] = this.rootStore.bookingStore.flexDays;
        queryParams[QueryParamName.Origin] = [];
        queryParams[QueryParamName.AutoAllocation] = this.rootStore.bookingStore.isAutoAllocation ? 1 : 0;

        const origins = this.rootStore.bookingStore.origins?.length
            ? this.rootStore.bookingStore.origins
            : this.originFromUrl;
        (origins ?? []).forEach((origin, index) => {
            queryParams[QueryParamName.Origin][index] = origin;
        });

        if (this.rootStore.bookingStore.roomsAllocation) {
            queryParams[QueryParamName.Rooms] = this.buildRoomAllocationFromBookingStore();
        }

        // Propagating the returnUrl to go back to hotel details
        if (this.returnPathFromUrl) {
            queryParams[QueryParamName.ReturnPath] = this.returnPathFromUrl;
        }

        return queryParams;
    };

    public buildSearchQueryWithParams = (
        isBookingFlow: boolean = true,
        params: { [key: string]: boolean | string | number },
    ): string =>
        this.stringifyQuery({
            ...this.buildSearchParamsQuery(isBookingFlow),
            ...params,
        });

    private encodeMapStateQueryParam = (accomId: string, zoomLevel: number): string => `${accomId}@${zoomLevel}`;

    /**
     * Search results page params.
     * Depends on base search params query.
     *
     * ***Use only on search results page***
     */
    public buildSearchQuery = (
        isBookingFlow: boolean = true,
        shouldIgnoreOrderParams: boolean = false,
        isReferer?: boolean,
        isMapPopupShown?: boolean,
        mapQueryParams?: IMapPopupState | null,
    ): string => {
        const queryParams = this.buildSearchParamsQuery(isBookingFlow);

        queryParams[QueryParamName.Page] = this.rootStore.searchStore.page;
        queryParams[QueryParamName.Take] = this.itemsPerPageFromUrl;

        if (!shouldIgnoreOrderParams) {
            queryParams[QueryParamName.OrderBy] =
                this.rootStore.searchStore.orderBy || this.rootStore.searchStore.sortConfig?.[0]?.orderBy || '';
            queryParams[QueryParamName.OrderDirection] =
                this.rootStore.searchStore.orderDirection ||
                this.rootStore.searchStore.sortConfig?.[0]?.orderDirection ||
                '';
        }

        [QueryParamName.BoardType].forEach(param => {
            if (queryParams[param]) {
                queryParams[param] = encodeURIComponent(queryParams[param]);
            }
        });

        if (isReferer) {
            queryParams[QueryParamName.IsReferer] = true;
        }

        if (isMapPopupShown) {
            queryParams[QueryParamName.IsMap] = mapQueryParams
                ? this.encodeMapStateQueryParam(mapQueryParams.accomId, mapQueryParams.zoomLevel)
                : 1;
        } else {
            queryParams[QueryParamName.IsMap] = 0;
        }

        return this.stringifyQuery(queryParams);
    };

    public buildSearchQueryByLivePrice = (
        livePrice: ILivePrice,
        isHotel: boolean = false,
        flexDays: number = 0,
        availableOrigins?: string[],
        destinationVirtualCode?: string,
        destinationRelatedRegions?: string[],
    ): string => {
        const { accomCode, geog, startDate, endDate, rooms } = getSearchQueryParamsByPrice(livePrice);
        const params = {
            [QueryParamName.IsBookingFlow]: true,
            [QueryParamName.From]: formatDateL10n(startDate),
            [QueryParamName.To]: formatDateL10n(endDate),
            [QueryParamName.Destination]: isHotel ? accomCode : geog,
            [QueryParamName.Rooms]: rooms,
            [QueryParamName.OrderBy]: OrderBy.Price,
            [QueryParamName.OrderDirection]: OrderDirection.Asc,
            [QueryParamName.FlexDays]: flexDays,
            [QueryParamName.Origin]:
                Array.isArray(availableOrigins) && !!availableOrigins.length
                    ? availableOrigins
                    : [livePrice.searchCriteria.depPt],
        };

        if (isHotel) {
            params[QueryParamName.SearchAccommodationId] = accomCode;
            params[QueryParamName.AccommodationId] = accomCode;
            params[QueryParamName.Geog] = '';
        } else if (destinationVirtualCode && destinationRelatedRegions?.length) {
            params[QueryParamName.Destination] = [destinationVirtualCode, ...destinationRelatedRegions].join(',');
            params[QueryParamName.Geog] = buildGeogParamByRelatedRegionsQuery(destinationRelatedRegions);
        } else {
            params[QueryParamName.Geog] = buildGeogParamByDestinationCodeQuery(geog);
        }

        return this.stringifyQuery(params);
    };

    /**
     *
     * Selected offer params.
     * Depends on base search params query.
     *
     * ***Use on Hotel Details, Extras, Guest Details, and Payment pages***
     */
    buildHotelDetailsQueryBase = (
        fallbackParams: AnyObject = {},
        linkParams: Partial<Record<QueryParamName, string | number | IQueryRoom[] | undefined>> = {},
    ): string => {
        Object.keys(fallbackParams).forEach(key => {
            if (!linkParams[key]) {
                linkParams[key] = fallbackParams[key];
            }
        });

        // Propagating the returnUrl to go back to hotel details
        if (this.returnPathFromHotelDetailsFromUrl) {
            linkParams[QueryParamName.ReturnPathFromHotelDetails] = this.returnPathFromHotelDetailsFromUrl;
        }

        if (this.returnPathFromUrl) {
            linkParams[QueryParamName.ReturnPath] = this.returnPathFromUrl;
        }

        return this.stringifyQuery(linkParams);
    };

    public buildQuery = (params: Nullable<AnyObject>, encode: boolean = false): string =>
        params ? `?${qs.stringify(params, { encode })}` : '';

    /**
     * Build bd4 query param for hotel URL
     * @param offerPosition - 1-based index of selected offer
     * @param paramName - ejReco or ejSort query param name
     * @param bd4TravelListId - Bd4TravelListIdHolidays or Bd4TravelListIdTrade (for Trade)
     * @returns query param with value <placementID/listID>|<absoluteposition>|<ptoken>
     */
    protected buildBD4HotelParam(
        offerPosition: number,
        paramName: QueryParamName,
        bd4TravelListId: TBd4TravelListId = Bd4TravelListIdHolidays,
    ): Nullable<Partial<Record<QueryParamName, string>>> {
        let tracking: Nullable<IBd4Tracking>;
        let sourceId: Nullable<string>;

        if (paramName === QueryParamName.EjReco) {
            tracking = this.rootStore.trackingStore.bd4RecommenderTracking;
            sourceId = this.rootStore.trackingStore.bd4RecommenderPlacementId;
        } else if (paramName === QueryParamName.EjSort) {
            tracking = this.rootStore.trackingStore.bd4SortTracking;
            sourceId = this.rootStore.layoutStore.isPromoPage ? bd4TravelListId.PromoList : bd4TravelListId.HotelsList;
        }

        if (!tracking?.pToken || tracking.apiMessage) {
            return null;
        }

        return { [paramName]: `${sourceId}|${offerPosition}|${tracking.pToken}` };
    }

    // View booking query.
    public buildViewBookingQuery = (): string => {
        const queryParams: Record<string, number> = {};

        queryParams[QueryParamName.ViewMyBooking] = 1;

        return this.stringifyQuery(queryParams);
    };

    public hotelParamsBase = (
        offer: Nullable<IOffer> = undefined,
        params: { [key: string]: string } = {},
    ): Partial<Record<QueryParamName, string | number | IQueryRoom[] | undefined>> => {
        const queryParams = this.buildSearchParamsQuery();

        const { bookingStore } = this.rootStore;
        const { selectedOffer } = bookingStore;

        queryParams[QueryParamName.OutboundId] = offer?.transport?.routes?.[0]?.id || bookingStore.outboundFlightId;
        queryParams[QueryParamName.InboundId] = offer?.transport?.routes?.[1]?.id || bookingStore.inboundFlightId;
        queryParams[QueryParamName.AccommodationId] = offer?.accom?.id || bookingStore.accommodationId;
        queryParams[QueryParamName.PackageId] = offer?.accom?.packageId || bookingStore.packageId;
        queryParams[QueryParamName.BoardType] = encodeURIComponent(
            offer?.accom?.unit?.[0]?.board || bookingStore.boardTypeCode,
        );
        queryParams[QueryParamName.OfferRooms] =
            offer?.accom?.unit || selectedOffer?.accom?.unit
                ? buildRoomAllocationFromOfferUnitParams(offer?.accom?.unit || selectedOffer?.accom?.unit || [])
                : this.offerRoomsAllocationFromUrl;

        queryParams[QueryParamName.Transfer] = encodeURIComponent(
            params[QueryParamName.Transfer] || bookingStore.selectedTransferCode || '',
        );
        queryParams[QueryParamName.DefaultTransfer] = encodeURIComponent(
            params[QueryParamName.DefaultTransfer] || bookingStore.defaultTransferFromUrl || '',
        );

        queryParams[QueryParamName.IsExt] = offer?.accom?.isExt || selectedOffer?.accom.isExt ? 1 : 0;

        queryParams[QueryParamName.LateRoomCheckout] =
            offer?.lateRoomCheckout || selectedOffer?.lateRoomCheckout ? 1 : 0;

        const promo = this.promoPage();

        if (promo) {
            queryParams[QueryParamName.Promo] = promo;
        }

        if (bookingStore.otherRoutesFromUrl?.length) {
            queryParams[QueryParamName.OtherRoutes] = bookingStore.otherRoutesFromUrl.join(',');
        }

        if ((offer || selectedOffer)?.accom?.theme?.name) {
            queryParams[QueryParamName.Theme] = (offer || selectedOffer)?.accom?.theme?.name.toLowerCase();
        }

        // add additional params
        Object.keys(params).forEach(key => {
            queryParams[key] = params[key];
        });

        if (this.query[QueryParamName.SpecialRequests]) {
            queryParams[QueryParamName.SpecialRequests] = this.query[QueryParamName.SpecialRequests];
        }

        if (
            queryParams[QueryParamName.SearchAccommodationId]?.split(',').length === TWO &&
            queryParams[QueryParamName.Destination]?.split(',').length === TWO
        ) {
            queryParams[QueryParamName.SearchAccommodationId] = offer?.accom.code;
            queryParams[QueryParamName.Destination] = offer?.accom.code;
        }

        /** Fix for EJH-11607. If a lot of hotels seted up as destination for promo page and
         * user click 'View holoday' btn we need replace all hotels destinations to hotel that user selected.
         * Otherwise some request won't be able to perform on hotel details page as they will be too long because of a lot of destinations */
        if (
            this.rootStore.layoutStore.isPromoPage &&
            queryParams[QueryParamName.Destination]?.split(',').find(dest => dest.length === DEFAULT_HOTEL_CODE_LENGTH)
        ) {
            queryParams[QueryParamName.SearchAccommodationId] = offer?.accom.code;
            queryParams[QueryParamName.Destination] = offer?.accom.code;
        }

        // saving luggage params in url between booking flow pages
        [
            QueryParamName.SelectedLuggage,
            QueryParamName.SelectedSportEquipment,
            QueryParamName.SelectedBagsOut,
            QueryParamName.SelectedBagsIn,
        ].forEach(param => {
            if (queryParams[param]) {
                // If it exists we need to use it. it means we want change this parameter and provided it as a second argument in this function
                queryParams[param] = queryParams[param];
            } else if (queryParams[param] === undefined && this.query[param]) {
                //in it's undefined but exists in query already, means we don't want to change it
                queryParams[param] = this.query[param];
            } else if (!queryParams[param]) {
                //we want to clear it from url
                delete queryParams[param];
            }
        });

        const selectedSeats = this.rootStore.seatMapStore.selectedSeats;

        if (selectedSeats?.length) {
            // enable ability to override the store value with an empty string
            queryParams[QueryParamName.SelectedSeats] =
                params[QueryParamName.SelectedSeats] !== undefined
                    ? params[QueryParamName.SelectedSeats]
                    : getSelectedSeatsQueryParams(selectedSeats);
        }

        // on HD when room changed update altAcc value from selectedOffer
        if (selectedOffer?.altAcc?.length) {
            const [altAccommodationIds, altPackageIds] = buildAltIdsFromAltAccommodationsParams(selectedOffer.altAcc);

            queryParams[QueryParamName.AltAccommodationIds] = altAccommodationIds;
            queryParams[QueryParamName.AltPackageIds] = altPackageIds;
        } else if (this.query[QueryParamName.AltAccommodationIds] && this.query[QueryParamName.AltPackageIds]) {
            queryParams[QueryParamName.AltAccommodationIds] = this.query[QueryParamName.AltAccommodationIds];
            queryParams[QueryParamName.AltPackageIds] = this.query[QueryParamName.AltPackageIds];
        }

        return queryParams;
    };

    public buildRoomAllocationFromBookingStore = (): IBaseQueryRoom[] => {
        const roomAllocation: IBaseQueryRoom[] = [];

        this.rootStore.bookingStore.roomsAllocation.forEach((room, index) => {
            roomAllocation[index] = {} as IBaseQueryRoom;

            roomAllocation[index].adults = room.adults.length;
            roomAllocation[index].children = room.children.length;
            roomAllocation[index].infants = room.infants.length;
            roomAllocation[index].childrenAges = [];

            room.children.forEach((child, i) => {
                roomAllocation[index].childrenAges[i] = child.age;
            });
        });

        return roomAllocation;
    };

    public buildHelpQuestionQuery = (questionCategory?: string, questionTag?: string): string => {
        const question = questionCategory ? { [QueryParamName.HelpCategory]: questionCategory } : {};
        const category = questionTag ? { [QueryParamName.HelpQuestion]: questionTag } : {};

        return this.stringifyQuery({
            ...question,
            ...category,
        });
    };

    updatePageWithLCBQueryBase = (): { lcbIn: string; lcbOut: string } => {
        const lcbParams = {
            [QueryParamName.SelectedBagsOut]: '',
            [QueryParamName.SelectedBagsIn]: '',
        };

        const { outBoundPassengers, inBoundPassengers } = this.rootStore.flightsPassengersStore;

        const outboundQuery = buildLCBQuery(outBoundPassengers);
        const inboundQuery = buildLCBQuery(inBoundPassengers);

        if (outboundQuery) {
            lcbParams[QueryParamName.SelectedBagsOut] = outboundQuery;
        }

        if (inboundQuery) {
            lcbParams[QueryParamName.SelectedBagsIn] = inboundQuery;
        }

        return lcbParams;
    };

    public buildContactUsFormQuery = ({
        package: bookingPackage,
        bookingReference,
        leadPassenger,
        guests,
    }: IBookingInfo): string => {
        const queryParams = {
            [QueryParamName.DateStart]: bookingPackage.accom.startDate,
            [QueryParamName.DateEnd]: bookingPackage.accom.endDate,
            [QueryParamName.BookingRef]: bookingReference,
            [QueryParamName.Email]: leadPassenger?.email,
        };

        const leadPassengerDetails = guests.find(guest => guest.isLead);

        if (leadPassengerDetails) {
            queryParams[QueryParamName.LeadFirstName] = leadPassengerDetails.firstName;
            queryParams[QueryParamName.LeadLastName] = leadPassengerDetails.lastName;
        }

        return this.stringifyQuery(queryParams);
    };

    @computed get itemsPerPageFromUrl(): number {
        return (
            this.parsePaginationValue(this.query[QueryParamName.Take]) ||
            this.rootStore.layoutStore.numberOfResultsPerPage
        );
    }

    public buildRebookHotelQuery = ({ package: bookingPackage }: IBookingInfo): string =>
        this.stringifyQuery({
            [QueryParamName.Rooms]: buildRoomAllocationFromOfferUnitParams(bookingPackage.accom.rooms),
        });

    updateMapInQuery = (isMap: boolean): void => {
        const newQuery = { ...this.query, [QueryParamName.IsMap]: isMap ? 1 : 0 };
        this.rootStore.routerStore.updateSearchResultsPage(this.stringifyQuery(newQuery));
    };

    private readonly applyFlightPlusHotelParams = (
        queryParams: Partial<Record<QueryParamName | FlightPlusHotelQueryParamName, any>>,
    ): void => {
        if (!this.isFlightPlusHotelFunnel || this.rootStore.layoutStore.isTradePortal) {
            return;
        }

        const fphKeys: (FlightPlusHotelQueryParamName | QueryParamName)[] = [
            QueryParamName.ExperienceContextProvider,
            FlightPlusHotelQueryParamName.DestinationAirport,
            FlightPlusHotelQueryParamName.SearchPodDepartureDate,
            FlightPlusHotelQueryParamName.SearchPodReturnDate,
            FlightPlusHotelQueryParamName.Pax,
            FlightPlusHotelQueryParamName.Discount,
            FlightPlusHotelQueryParamName.Signature,
            QueryParamName.OutboundFlightNumber,
            QueryParamName.InboundFlightNumber,
            FlightPlusHotelQueryParamName.RoomAllocation1,
            FlightPlusHotelQueryParamName.RoomAllocation2,
            FlightPlusHotelQueryParamName.SelectedRef,
            FlightPlusHotelQueryParamName.SelectedBoardType,
            FlightPlusHotelQueryParamName.SelectedPackId,
        ];

        fphKeys.forEach(key => {
            if (this.query[key]) {
                queryParams[key] = this.query[key];
            }
        });
    };

    readonly buildFlightPlusHotelUrl = (
        path: FlightPlusHotelSitePath,
        includeHotelCode: boolean = false,
        basicUrl: boolean = false,
    ): string => {
        const baseUrl = envPublic.FLIGHT_PLUS_HOTEL_BASE_URL;
        const lang = this.rootStore.layoutStore.lang;

        const basicKeys: (QueryParamName | FlightPlusHotelQueryParamName)[] = [
            QueryParamName.Origin,
            QueryParamName.ExperienceContextProvider,
            FlightPlusHotelQueryParamName.DestinationAirport,
            FlightPlusHotelQueryParamName.SearchPodDepartureDate,
            FlightPlusHotelQueryParamName.SearchPodReturnDate,
            FlightPlusHotelQueryParamName.Pax,
        ];

        const additionalKeys: (QueryParamName | FlightPlusHotelQueryParamName)[] = [
            QueryParamName.From,
            QueryParamName.To,
            QueryParamName.OutboundFlightNumber,
            QueryParamName.InboundFlightNumber,
            QueryParamName.OutboundId,
            QueryParamName.InboundId,
            QueryParamName.AccommodationId,
            QueryParamName.PackageId,
            QueryParamName.OfferRooms,
            FlightPlusHotelQueryParamName.RoomAllocation1,
            FlightPlusHotelQueryParamName.RoomAllocation2,
            FlightPlusHotelQueryParamName.SelectedRef,
            FlightPlusHotelQueryParamName.SelectedBoardType,
            FlightPlusHotelQueryParamName.SelectedPackId,
        ];

        const fphQueryKeys = basicUrl ? basicKeys : [...basicKeys, ...additionalKeys];

        const queryParams: Partial<Record<QueryParamName | FlightPlusHotelQueryParamName, any>> = {};

        fphQueryKeys.forEach(key => {
            if (this.query[key]) {
                queryParams[key] = this.query[key];
            }
        });

        const queryString = qs.stringify(queryParams, { arrayFormat: 'comma' });
        const hotelCode =
            includeHotelCode &&
            path === FlightPlusHotelSitePath.Hotels &&
            this.rootStore.bookingStore.selectedOffer?.accom?.code
                ? `/${this.rootStore.bookingStore.selectedOffer.accom.code}`
                : '';

        return `${baseUrl}/${lang}${path}${hotelCode}?${queryString}`;
    };

    updateMapStateInQuery = (accomId: string, zoomLevel: number): void => {
        const newQuery = { ...this.query, [QueryParamName.IsMap]: this.encodeMapStateQueryParam(accomId, zoomLevel) };
        this.setMapZoomLevel(zoomLevel);
        this.rootStore.routerStore.updateSearchResultsPage(this.stringifyQuery(newQuery));
    };

    removeQueryParam = (param: QueryParamName | FlightPlusHotelQueryParamName): void => {
        const newQuery = { ...this.query };
        delete newQuery[param];

        this.rootStore.routerStore.updateCurrentPage(this.stringifyQuery(newQuery));
    };
}
