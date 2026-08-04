import { AxiosRequestConfig, AxiosResponse, CancelTokenSource, isCancel } from 'axios';

import { webApiUrls } from 'code/endpoints';
import { envAll } from 'code/env';
import { CachedGetRequest } from 'frontend/utils/cache.utils';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import AxiosRequest from 'frontend/utils/request';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAvailableDatesResponse } from 'models/data/IAvailableDatesResponse';
import { ICheapestMonth } from 'models/data/ICheapestMonth';
import { IDestination } from 'models/data/IDestination';
import { IDotComDestinations } from 'models/data/IDotComDestinations';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { IHotel } from 'models/data/IHotel';
import { ILivePrice } from 'models/data/ILivePrice';
import { IAvailableMonthsResponse } from 'models/data/IMonthAvailability';
import { IAltAccommodation } from 'models/data/IOffer';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { ISearchDestinationCountries } from 'models/data/ISearchDestinationCountries';
import { IFilteredPoints, ISearchOffers } from 'models/data/ISearchOffers';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ISitecoreFacility } from 'models/data/ISitecoreFacility';
import { ISpecificOffer } from 'models/data/ISpecificOffer';
import { ITradePortalFeedback } from 'models/data/ITradePortalFeedback';
import { ITypeAheadResponse } from 'models/data/ITypeAheadResponse';
import { IGeoPoints } from 'models/data/map/IMap';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { DestinationTypeBit } from 'models/enum/DestinationType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { IDestinationAvailability } from 'models/IDestinationsAvailability';
import {
    IHotelPointsOfInterest,
    IHotelPointsOfInterestRequestParams,
} from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import logger from './logging/logger.service';

export interface IFetchOffersArgs {
    autoAllocation: boolean;
    dep: string;
    duration: string[];
    flexDays: number;
    geog: string;
    rooms: IQueryRoom[];
    startDate: Date;
    accomCodes?: string;
    boardType?: string;
    cancelSource?: CancelTokenSource;
    destination?: string;
    destinations?: Nullable<string[]>;
    deviceType?: string;
    discountOnly?: boolean;
    distressedFlightsOnly?: boolean;
    endDate?: Date;
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
    isMonthSearch?: boolean;
    isPricePP?: boolean;
    isPromoPage?: boolean;
    maxDisc?: number;
    maxDiscP?: number;
    maxtemp?: Nullable<number>;
    minDisc?: number;
    minDiscP?: number;
    mintemp?: Nullable<number>;
    offers?: string;
    orderBy?: string;
    orderDirection?: string;
    outboundFlightNumber?: string;
    outboundTimeSlots?: string;
    page?: number;
    placementId?: string;
    polyQuery?: string;
    priceFrom?: number | null;
    priceTo?: number | null;
    promc?: Nullable<string>;
    promoPageId?: string;
    searchType?: string;
    starRating?: string;
    take?: number;
    themes?: string;
    tripAdvisorRating?: string;
}

class OffersService {
    // Cache request
    private cachedAvailableDatesReq = new CachedGetRequest();
    private cachedAvailableDestinationsReq = new CachedGetRequest();
    private cachedAvailableOriginsReq = new CachedGetRequest();

    public fetchOffers = async ({
        startDate,
        flexDays,
        orderDirection,
        orderBy,
        boardType,
        endDate,
        flights,
        polyQuery,
        cancelSource,
        ...rest
    }: IFetchOffersArgs): Promise<ISearchOffers> => {
        try {
            const url = webApiUrls.search({
                ...rest,
                startDate: formatDateToQuery(startDate),
                flexibleDays: flexDays,
                orderBy: orderDirection && orderBy,
                orderDirection: orderBy && orderDirection,
                boardType: boardType && encodeURIComponent(boardType),
                endDate: endDate ? formatDateToQuery(endDate) : undefined,
                departureAirport: flights,
                polygon: polyQuery,
            });

            const storageValue = getWebStorageItem(WebStorageKeys.SmartSeerStorageKey, false);

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
                headers: {
                    [WebStorageKeys.SmartSeerStorageKey]: storageValue || '',
                },
            });

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public fetchPolygonHotels = async (
        params: { [key: string]: any; rooms: any },
        cancelSource?: CancelTokenSource,
    ): Promise<IGeoPoints> => {
        try {
            const url = webApiUrls.searchMap(params);

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
            });

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public fetchFilteredHotels = async (
        params: { [key: string]: any; geography: string; rooms: any },
        cancelSource?: CancelTokenSource,
    ): Promise<IFilteredPoints> => {
        try {
            const url = webApiUrls.searchSummary(params);

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
            });

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public searchDestinations = async (
        query: string,
        from: string,
        startDate: string,
        endDate: string,
        flexDays: number,
        duration?: number,
        cancelSource?: CancelTokenSource,
    ): Promise<ITypeAheadResponse> => {
        try {
            const result = await AxiosRequest.get(
                webApiUrls.searchDestinations(query, from, startDate, endDate, flexDays, duration),
                {
                    cancelToken: cancelSource ? cancelSource.token : cancelSource,
                },
            );

            return result.data;
        } catch (e) {
            if (!isCancel(e) && e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public searchDestinationsByQueryAndTypes = async (
        query: string,
        types: DestinationTypeBit[],
        cancelSource?: CancelTokenSource,
    ): Promise<ITypeAheadResponse> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.searchDestinationsByQueryAndTypes(query, types), {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
            });

            return result.data;
        } catch (e) {
            if (!isCancel(e)) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public loadPlacesTitlesByCodes = async (codes: string[]): Promise<IDestination[]> => {
        try {
            const result = await AxiosRequest.post(
                webApiUrls.getPlaceTitleByCodeUrl(),
                JSON.stringify({ codes: codes }),
            );

            return result.data;
        } catch (e) {
            // FIXME:
            // logger.error({ ...e, targetUrl: webApiUrls.getPlaceTitleByCodeUrl, data: { codes } });
            throw e;
        }
    };

    public loadHotelInfo = async (code: string, board?: string, room?: string, cookie?: string): Promise<IHotel> => {
        try {
            const result = await AxiosRequest.get(
                webApiUrls.hotelInfo(code, board, room),
                cookie
                    ? {
                          headers: { Cookie: cookie },
                      }
                    : undefined,
            );

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getAllDestinations = async (): Promise<ISearchDestinationCountries> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.getAllDestinations());

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getHotelPointsOfInterest = async (
        params: IHotelPointsOfInterestRequestParams,
    ): Promise<IHotelPointsOfInterest[]> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.hotelPointsOfInterest(params));

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getAvailableDestinations = async (
        from: string,
        startDate: string,
        endDate: string,
        flexDays: number,
        duration?: number,
    ): Promise<string[]> => {
        // cache availableDestination request for 150ms to prevent duplicate requests
        const request = this.cachedAvailableDestinationsReq.getRequest(
            webApiUrls.getAvailableDestinations(from, startDate, endDate, flexDays, duration),
        );

        try {
            const result = await request;

            return result.data;
        } catch (e) {
            if (!isCancel(e) && e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getAvailableDates = async (
        from: string,
        to: string | undefined,
        startDate: string,
        endDate: string,
        promoPageId?: string,
        selectedFromDate?: string,
    ): Promise<IAvailableDatesResponse> => {
        // cache availableDates request for 150ms to prevent duplicate requests
        const request = this.cachedAvailableDatesReq.getRequest(
            webApiUrls.getAvailableDates(from, to, startDate, endDate, promoPageId, selectedFromDate),
        );

        try {
            const result = await request;

            return result.data;
        } catch (e) {
            if (!isCancel(e)) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getAvailableMonths = async (
        duration: number,
        from?: string,
        to?: string,
    ): Promise<IAvailableMonthsResponse> => {
        try {
            const url = webApiUrls.getAvailableMonths(duration, from, to);
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getAvailableOrigins = async (
        to: string,
        startDate: string,
        endDate: string,
        flexDays: number,
        promoPageId?: string,
        duration?: number,
    ): Promise<AxiosResponse<any>> => {
        // cache availableDates request for 150ms to prevent duplicate requests
        const request = this.cachedAvailableOriginsReq.getRequest(
            webApiUrls.getAvailableOrigins(to, startDate, endDate, flexDays, promoPageId, duration),
        );

        try {
            const result = await request;

            return result;
        } catch (e) {
            if (!isCancel(e)) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getDestinationsAvailability = async (to: string): Promise<IDestinationAvailability> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.getDestinationsAvailability(to));

            return result.data;
        } catch (e) {
            logger.error({ e });

            throw e;
        }
    };

    public fetchOffer = async (
        sdate: Date | null,
        flexDays: number,
        stay: string,
        dep: string,
        roomsAllocation: IQueryRoom[],
        accommodationId: string,
        outboundRouteId: string,
        inboundRouteId: string,
        packageId: string,
        boardType?: string,
        transferCode?: string,
        geog?: string,
        isExtAccomm?: boolean,
        isLateRoomCheckout?: boolean,
        altAcc?: IAltAccommodation[],
        selectedSeats?: ISelectedSeat[],
        selectedLuggageAdults: IHoldLuggageInfo = {},
        selectedLuggageChildren: IHoldLuggageInfo = {},
        selectedSportEquipmentAdults: IHoldLuggageInfo = {},
        selectedSportEquipmentChildren: IHoldLuggageInfo = {},
        hotelTypes?: string,
        searchPrice?: number,
        lcbOut?: string,
        lcbIn?: string,
        airportParkingCode?: string,
        ecp?: string,
    ): Promise<ISpecificOffer> => {
        try {
            const url = webApiUrls.searchHotel(
                formatDateToQuery(sdate),
                flexDays,
                stay,
                dep,
                roomsAllocation,
                accommodationId,
                outboundRouteId,
                inboundRouteId,
                packageId,
                boardType && encodeURIComponent(boardType),
                transferCode,
                geog,
                isExtAccomm,
                isLateRoomCheckout,
                altAcc,
                selectedSeats,
                { ...selectedLuggageAdults, ...selectedSportEquipmentAdults },
                { ...selectedLuggageChildren, ...selectedSportEquipmentChildren },
                hotelTypes,
                searchPrice,
                lcbOut,
                lcbIn,
                airportParkingCode,
                ecp,
            );
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getDestinationByDotComCodes = async (query: string): Promise<IDotComDestinations> => {
        try {
            const url = webApiUrls.getDestinationByDotComCodes(query);
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });

            throw e;
        }
    };

    public getFacilities = async (): Promise<ISitecoreFacility[]> => {
        try {
            const url = webApiUrls.facilities();
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });

            throw e;
        }
    };

    public fetchRecommendedOffers = async (
        sdate: Date,
        flexDays: number,
        stay: string[],
        dep: string,
        geog: string,
        autoAllocation: boolean,
        rooms: IQueryRoom[],
        pageName?: string,
        offers?: string,
        distressedFlightsOnly?: boolean,
        placementId?: string,
        atcomCode?: string,
        edate?: Date,
        cancelSource?: CancelTokenSource,
        isPromo?: boolean,
        promoPageId?: string,
        destinations?: Nullable<string[]>,
    ): Promise<ISearchOffers> => {
        try {
            const url = webApiUrls.recommended(
                formatDateToQuery(sdate),
                flexDays,
                stay,
                dep,
                geog,
                autoAllocation,
                rooms,
                pageName,
                offers,
                distressedFlightsOnly,
                placementId,
                atcomCode,
                edate && formatDateToQuery(edate),
                isPromo,
                promoPageId,
                destinations,
            );

            envAll.ENABLE_BD4_LOGGING && logger.info(`Frontend send recomended request: ${url}`);
            const storageValue = getWebStorageItem(WebStorageKeys.SmartSeerStorageKey, false);

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
                headers: {
                    [WebStorageKeys.SmartSeerStorageKey]: storageValue || '',
                },
            });

            return result.data;
        } catch (e) {
            envAll.ENABLE_BD4_LOGGING && logger.info(`offers.service: Error while fetching recomended`);
            logger.error({ e });
            throw e;
        }
    };

    public fetchRecommendedOffersBrowse = async (
        destinations: string[],
        isDestinationSearch: boolean,
        placementId: string,
        pageName?: string,
        atcomCode?: string,
        cancelSource?: CancelTokenSource,
        requestedAmount?: number,
    ): Promise<ISearchOffers> => {
        try {
            const url = webApiUrls.recommendedBrowse(
                destinations,
                isDestinationSearch,
                placementId,
                pageName,
                atcomCode,
                requestedAmount,
            );

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public fetchGenericRecommendedOffers = async (
        placementId: string,
        pageName?: string,
        isDestinationSearch: boolean = true,
        isLivePrice: boolean = false,
        hotelThemeTypes?: string,
        cancelSource?: CancelTokenSource,
    ): Promise<ISearchOffers> => {
        try {
            const url = webApiUrls.recommendedGeneric(
                placementId,
                pageName,
                isDestinationSearch,
                isLivePrice,
                hotelThemeTypes,
            );

            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : cancelSource,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getFeaturedFacilities = async (offerCode: string) => {
        try {
            const url = webApiUrls.featuredFacilities(offerCode);
            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getLivePrice = async (
        codes: string,
        round: boolean = true,
        promo: boolean = false,
        config?: AxiosRequestConfig,
    ): Promise<ILivePrice[]> => {
        try {
            const response = await AxiosRequest.get(webApiUrls.getLivePrice(codes, round, promo), config);

            return response.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getRequestedPrice = async (codes: string[], round: boolean = true): Promise<IRequestedPrice[]> => {
        try {
            const key = codes.join(',');
            const response = await AxiosRequest.get(webApiUrls.geRequestedPrice(key, round));

            return response.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public sendPricePromise = async (formData: any) => {
        try {
            return await AxiosRequest.post(webApiUrls.pricePromise(), formData, {
                headers: {
                    'content-type': 'multipart/form-data',
                },
            });
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public sendFeedbackForm = async (formData: ITradePortalFeedback) => {
        try {
            return await AxiosRequest.post(webApiUrls.tradeAgentFeedback(), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public fetchDestinationsByCodes = async (
        codes: string[],
        includeRelatedItems?: boolean,
    ): Promise<IDestination[]> => {
        try {
            const response = await AxiosRequest.post(webApiUrls.destinationsByCodes(includeRelatedItems), codes);

            return response.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public getLastAvailableDate = async (): Promise<Date | null> => {
        try {
            const response = await AxiosRequest.get(webApiUrls.getLastAvailableDate());
            const lastDateStr = response.data.lastAvailableDate;

            return !isNaN(Date.parse(lastDateStr)) ? new Date(lastDateStr) : null;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };

    public fetchCheapestMonthList = async (
        airportCode: string,
        destinationQuery: string,
    ): Promise<ICheapestMonth[]> => {
        try {
            const url = webApiUrls.getCheapestMonths(airportCode, destinationQuery);
            const response = await AxiosRequest.get(url);

            return response.data;
        } catch (e) {
            logger.error({ e });
            throw e;
        }
    };
}

export default new OffersService();
