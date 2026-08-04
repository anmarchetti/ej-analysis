import Axios, { AxiosError, AxiosResponse, CancelToken, CancelTokenSource } from 'axios';
import qs from 'qs';

import { webApiUrls } from 'code/endpoints';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import { formatDateToQuery, getDate, getDaysDifference } from 'frontend/utils/date.utils';
import AxiosRequest from 'frontend/utils/request';
import { getRoute } from 'frontend/utils/route.utils';
import { buildRoomFromOfferUnitParams } from 'frontend/utils/url.utils';
import { ApiError } from 'models/data/ApiError';
import { IAssistedTravelRequest } from 'models/data/assistedTravelRequest';
import {
    IAmendDatesResponseItem,
    IRequestDatesQuery,
    IRequestDatesResponseData,
    ISubmitDatesQuery,
} from 'models/data/bookingAmendment/AmendDates';
import { IAmendHotelOffer, IAmendHotelOfferResponce } from 'models/data/bookingAmendment/AmendHotel';
import {
    IAmendHotelRoomAndBoardInfoResponse,
    IAmendRoomAndBoardInfoResponse,
    IRoomVariant,
} from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IAmendBookingFlightPromoDataResponse } from 'models/data/IAmendBookingFlights';
import { IAmendBookingRequestBody } from 'models/data/IAmendBookingRequestBody';
import { IApolloBookingsResponse } from 'models/data/IApolloBooking';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { IExtras } from 'models/data/IExtras';
import { IHotelHighlight } from 'models/data/IHotel';
import { IAltAccommodation, IAltBoard, IOffer, ITransferOffer, ITransport, IUnit } from 'models/data/IOffer';
import { IOffersAlterations } from 'models/data/IOffersAlterations';
import { IResortInfo } from 'models/data/IResortInfo';
import { ISearchOffers } from 'models/data/ISearchOffers';
import { IAmendSeatsResponse, ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import {
    IBookingCancellationResponse,
    IBookingRefundResponse,
    ICancellationSummaryResponse,
} from 'models/data/MyCreditInfo';
import { IAgentInfo } from 'models/data/tradePortal/IAgentInfo';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import { CreditType } from 'models/enum/CreditType';
import { RefundOption } from 'models/enum/RefundOptions';
import { RouteDirection } from 'models/enum/RouteDirection';

import { logger } from './logging';

export const DEFAULT_PAGE_SIZE = 10;

class BookingService {
    public validatePackage = async (holidayPackage: any): Promise<AxiosResponse<IValidatePackageInfo>> => {
        try {
            return await AxiosRequest.post(webApiUrls.validatePackage(), holidayPackage);
        } catch (e) {
            const error = new ApiError(e);

            if (e instanceof Error) {
                logger.error({ e });
            }

            throw error;
        }
    };

    public validatePromoCode = async (holidayPackage: any): Promise<AxiosResponse<IValidatePackageInfo>> => {
        try {
            return await AxiosRequest.post(webApiUrls.validatePromoCode(), holidayPackage);
        } catch (e) {
            const error = new ApiError(e);

            if (e instanceof Error) {
                logger.error({ e });
            }

            throw error;
        }
    };

    public fetchBookingExtras = async (reqBody: any) => {
        try {
            const result = await AxiosRequest.post(webApiUrls.getHoldLuggage(), reqBody);

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public fetchSeatMap = async (
        depAirportCode: string,
        arrAirportCode: string,
        departureDate: string,
        flightNumber: string,
        isOutboundFlight: boolean,
        offerPromoCode?: string,
    ) => {
        try {
            const result = await AxiosRequest.get(
                `${webApiUrls.fetchSeatMap(
                    depAirportCode,
                    arrAirportCode,
                    departureDate,
                    flightNumber,
                    isOutboundFlight,
                    offerPromoCode,
                )}`,
            );

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public commitBooking = async (bookingRequestBody: ICommitBookingRequestBody, transactionId: string) => {
        try {
            return await AxiosRequest.post(webApiUrls.commitBooking(), bookingRequestBody, {
                headers: {
                    'X-ejh-Idempotency-Key': transactionId,
                },
            });
        } catch (e) {
            const error = new ApiError(e);

            if (e instanceof Error) {
                logger.error(
                    {
                        e,
                        message: `Failed to commitBooking with bookingReference ${bookingRequestBody.bookingReference} returned errorCode ${error.errorCode}`,
                    },
                    transactionId,
                );
            }

            throw error;
        }
    };

    public payRemainingBalance = async (payInfo: any, transactionId: string) => {
        try {
            return await AxiosRequest.post(webApiUrls.payRemainingBalance(), payInfo, {
                headers: {
                    'X-ejh-Idempotency-Key': transactionId,
                },
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public amendCommitBooking = async (bookingRequestBody: IAmendBookingRequestBody, transactionId: string) => {
        try {
            return await AxiosRequest.post(webApiUrls.amendCommit(), bookingRequestBody, {
                headers: {
                    'X-ejh-Idempotency-Key': transactionId,
                },
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getAmendDatesBooking = async (
        params: ISubmitDatesQuery,
        cancelToken?: CancelToken,
    ): Promise<IAmendDatesResponseItem> => {
        try {
            const request = await AxiosRequest.get(webApiUrls.amendDatesBooking(params), { cancelToken });

            return request.data;
        } catch (e) {
            if (Axios.isCancel(e)) {
                throw e;
            }

            throw new ApiError(e);
        }
    };

    public getHotelErrataMessages = async (params: { codes: string[]; offerDate: string }): Promise<string[]> => {
        try {
            const request = await AxiosRequest.get(
                `${webApiUrls.errataHotelMessage()}?${qs.stringify(params, {
                    allowDots: true,
                })}`,
            );

            return request.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getAmendDatesValidatedOffer = async (offer: IAmendDatesResponseItem): Promise<IAmendDatesResponseItem> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.amendDatesValidateOffer(), [offer]);

            return result?.data[0];
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public getAvailableAmendDates = async ({
        accommodationId,
        departure,
        duration,
        endDate,
        startDate,
        rooms,
    }: IRequestDatesQuery): Promise<IRequestDatesResponseData> => {
        try {
            const request = await AxiosRequest.get(
                webApiUrls.amendDatesAvailability(accommodationId, departure, duration, endDate, startDate, rooms),
            );

            return request.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getAlternativeAmendHotels = async (
        bookingRef: string,
        filters: {
            TripAdvisorRating?: string;
            boardType?: string;
            facilities?: string;
            isPricePP?: boolean;
            packageTheme?: string;
            priceFrom?: number;
            priceTo?: number;
            sortingBy?: AlternativeHotelsSortingOptions;
            starRating?: string;
        } = {},
        page: number = 1,
        pageSize: number = DEFAULT_PAGE_SIZE,
        cancelToken?: CancelToken,
    ): Promise<IAmendHotelOfferResponce> => {
        try {
            const request = await AxiosRequest.post(
                webApiUrls.getAlternativeAmendHotels(),
                {
                    bookingRef,
                    searchParameters: {
                        page,
                        pageSize: pageSize,
                        ...filters,
                    },
                },
                {
                    cancelToken,
                },
            );

            return request.data;
        } catch (e) {
            if (Axios.isCancel(e)) {
                throw e;
            }

            throw new ApiError(e);
        }
    };

    public validateAlternativeAmendHotel = async (
        bookingRef: string,
        amendHotelOffer: IAmendHotelOffer,
    ): Promise<{
        amendHotelOffer: IAmendHotelOffer;
        bookingRef: string;
    }> => {
        try {
            const request = await AxiosRequest.post(webApiUrls.validateAlternativeAmendHotel(), {
                bookingRef,
                amendHotelOffer,
            });

            return request.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    getAmendRoomAndBoardVariants = async (
        bookingReference: string,
        cancelToken?: CancelToken,
    ): Promise<IAmendRoomAndBoardInfoResponse> => {
        try {
            const params = { bookingReference };
            const url = `${webApiUrls.amendRoomAndBoardOffers}?${qs.stringify(params, { allowDots: true })}`;

            const request = await AxiosRequest.get(url, { cancelToken });

            return request.data;
        } catch (e) {
            throw Axios.isCancel(e) ? e : new ApiError(e);
        }
    };

    getAmendHotelRoomAndBoardVariants = async (
        bookingRef: string,
        amendHotelOffer: IAmendHotelOffer,
        cancelToken?: CancelToken,
    ): Promise<IAmendHotelRoomAndBoardInfoResponse> => {
        try {
            const request = await AxiosRequest.post(
                webApiUrls.amendHotelRoomAndBoardOffers,
                {
                    bookingRef,
                    amendHotelOffer,
                },
                { cancelToken },
            );

            return request.data;
        } catch (e) {
            throw Axios.isCancel(e) ? e : new ApiError(e);
        }
    };

    public loadDestinationImage = async (locationCode: string) => {
        try {
            const url = webApiUrls.getDestinationLocationImage(locationCode);

            const result = await AxiosRequest.get(url);

            return result.data;
        } catch (e) {
            throw Axios.isCancel(e) ? e : new ApiError(e);
        }
    };

    amendRoomAndBoardValidateOffer = async (
        selectedRoomVariant: IRoomVariant,
        allVariants: IRoomVariant[],
        bookingRef: string,
        discountCode?: string,
        cancelToken?: CancelToken,
    ): Promise<IRoomVariant[]> => {
        try {
            const request = await AxiosRequest.post(
                webApiUrls.amendRoomAndBoardValidateOffer,
                {
                    selectedRoomVariant,
                    roomVariants: allVariants,
                    bookingRef,
                    discountCode,
                },
                { cancelToken },
            );

            return request.data;
        } catch (e) {
            throw Axios.isCancel(e) ? e : new ApiError(e);
        }
    };

    /** Load transfers and late room */
    public loadExtras = async (offer: ITransferOffer): Promise<IExtras> => {
        const result = await AxiosRequest.post(webApiUrls.searchExtras(), offer);

        return result.data;
    };

    public loadAlternativeFlights = async (
        sdate: Date,
        flexDays: number,
        stay: string,
        dep: string,
        roomsAllocation: IQueryRoom[],
        accomId: string,
        boardType?: string,
        outboundID?: string,
        inboundID?: string,
        transfer?: string,
        withHotels?: boolean,
        originalAirport?: string,
        ecp?: string,
    ): Promise<ISearchOffers> => {
        const url = webApiUrls.searchAlternativeFlights(
            formatDateToQuery(sdate),
            flexDays,
            stay,
            dep,
            roomsAllocation,
            accomId,
            boardType && encodeURIComponent(boardType),
            outboundID,
            inboundID,
            transfer,
            withHotels,
            originalAirport,
            ecp,
        );

        const result = await AxiosRequest.get(url);

        return result.data;
    };

    public fetchOffersAlterations = async (
        sdate: Date,
        flexDays: number,
        stay: string,
        dep: string,
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
    ): Promise<{
        boards: IAltBoard[];
        rooms: IUnit[][];
    }> => {
        const url = webApiUrls.searchOffersAlterations(
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
            isExternal,
            altAcc,
            transferCode,
            ecp,
        );

        const result = await AxiosRequest.get(url);
        const offersAlterations: IOffersAlterations = result.data;

        return {
            rooms: offersAlterations.rooms,
            boards: offersAlterations.altBoards,
        };
    };

    public viewBooking = async (date: string, reference: string, lastName: string) => {
        try {
            const url = webApiUrls.viewBooking();

            return await AxiosRequest.post(url, {
                bookingReference: reference,
                lastName,
                date: formatDateToQuery(date),
            });
        } catch (e) {
            if (e instanceof Error) {
                if ((e as AxiosError).code === 'API-ERR-000002') {
                    logger.error({
                        e,
                        message: 'Failed to get booking',
                    });
                }
            }

            throw new ApiError(e);
        }
    };

    public getBookingTransfers = async (bookingReference: string, lastName: string, date: string) => {
        try {
            const url = webApiUrls.getBookingTransfers();

            return await AxiosRequest.post(url, {
                bookingReference,
                lastName,
                date,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public fetchBookings = async (cancelSource: CancelTokenSource) => {
        try {
            return await AxiosRequest.get(
                webApiUrls.fetchBookings(),
                {
                    cancelToken: cancelSource ? cancelSource.token : cancelSource,
                },
                true,
            );
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public fetchBookingsFromApollo = async (): Promise<{ data: IApolloBookingsResponse }> => {
        try {
            const url = webApiUrls.fetchBookingsFromApollo();
            const response = await AxiosRequest.get(url);

            return { data: response.data };
        } catch (e) {
            logger.error({ e });

            return { data: { bookings: [] } };
        }
    };

    public addBooking = async (bookingReference: string, lastName: string, date: string) => {
        try {
            return await AxiosRequest.post(webApiUrls.assignBooking(), {
                bookingReference,
                lastName,
                date,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public amendBookingSpecialRequests = async (
        bookingReference: string,
        date: string,
        lastName: string,
        specialRequests: string[],
    ): Promise<AxiosResponse<IBookingInfo>> => {
        try {
            return await AxiosRequest.post(webApiUrls.amendBookingSSR(), {
                bookingReference,
                date,
                lastName,
                specialRequests,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public generateBookingToken = async (bookingReference: string, lastName: string, date: string) => {
        try {
            return await AxiosRequest.post(webApiUrls.bookingToken(), {
                bookingReference,
                lastName,
                date,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getBookingByToken = async (token: string) => {
        try {
            return await AxiosRequest.get(webApiUrls.bookingByToken(token), undefined, true);
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public changeBooking = async (token: string, booking: any) => {
        try {
            return await AxiosRequest.post(webApiUrls.changeBooking(), {
                bookingToken: token,
                ...booking,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public creditBooking = async (
        type: CreditType,
        bookingReference: string,
        lastName: string,
        date: string,
    ): Promise<AxiosResponse<IBookingRefundResponse>> => {
        try {
            return await AxiosRequest.post(webApiUrls.creditBooking(), {
                type,
                bookingReference,
                lastName,
                date,
            });
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public loadResortInfo = async (code: string): Promise<IResortInfo> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.loadResortInfo(code));

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public loadHotelHighlightsInfo = async (code: string): Promise<IHotelHighlight[]> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.loadHotelHighlightsInfo(code));

            return result?.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getOtherRoutes = async (offer: IOffer) => {
        const inboundId = getRoute(offer, RouteDirection.Outbound)?.id;
        const outbound = getRoute(offer, RouteDirection.Outbound);
        const outboundId = outbound?.id;
        const searchResults = await this.loadAlternativeFlights(
            getDate(offer.date),
            0, // should get information from search store when we will have a story for flexible flights
            offer.stay?.toString(),
            offer.otherRoutes?.join(',') || '',
            buildRoomFromOfferUnitParams(offer.accom.unit),
            offer.accom.code,
            offer.accom.unit.find(Boolean)?.board,
            outboundId,
            inboundId,
            undefined,
            true,
            outbound?.depPt,
        );
        const flights = searchResults?.offers.filter((x, id, array) => {
            const routeOutbound = getRoute(x, RouteDirection.Outbound);
            const routeInbound = getRoute(x, RouteDirection.Inbound);
            const chipperFlight = array.find(
                y => getRoute(y, RouteDirection.Outbound)?.depPt === routeOutbound?.depPt && y.price < x.price,
            );

            return !chipperFlight && inboundId !== routeInbound?.id && outboundId !== routeOutbound?.id;
        });

        return [offer, ...flights.sort((a, b) => a.price - b.price)];
    };

    /**
     * Get ALL alternative flights to booking (request to Atcom cache)
     */
    public getAmendAlternativeFlights = async (
        booking: IBookingInfo,
        cancelSource?: CancelTokenSource,
    ): Promise<Nullable<ISearchOffers>> => {
        const accom = booking.package?.accom;

        if (!accom) return null;

        try {
            const bookingReference = booking?.bookingReference;
            const url = webApiUrls.getAmendAlternativeFlights(bookingReference);
            const result = await AxiosRequest.get(url, {
                cancelToken: cancelSource ? cancelSource.token : undefined,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    /**
     * Get live prices for booking alternative transfers
     * @param bookingReference
     * @param transports - list of alternative flights that price should be validated
     */
    public validateAmendAlternativeTransfersPrice = async (
        bookingReference: string,
        transfers: ITransfer[],
    ): Promise<any> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.validateAmendAlternativeTransfersPrice(), {
                bookingReference,
                transfers,
            });

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public toggleBookingPrivacy = async (
        isPrivate: boolean,
        bookingReference: string,
        lastName: string,
        date: string,
    ): Promise<AxiosResponse<IBookingInfo>> => {
        try {
            return await AxiosRequest.post(webApiUrls.toggleBookingPrivacy(), {
                isPrivate,
                bookingReference,
                lastName,
                date,
            });
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw new ApiError(e);
        }
    };

    public getAmendTransfersWithPrice = async (
        bookingReference: string,
        defaultTransferCode: string,
        accom: any,
        transport: ITransport,
    ): Promise<ITransferWithAmendmentCharges[]> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.amendTransfersWithPrice(), {
                bookingReference,
                defaultTransferCode,
                accom,
                transport,
            });

            return result.data.transfers;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public getAmendDatesTransferOptions = async (
        offer: IAmendDatesResponseItem,
    ): Promise<IAmendDatesResponseItem[]> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.amendDatesTransfers(), offer);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    getAmendDatesFlightsOptions = async (offer: IAmendDatesResponseItem): Promise<IAmendDatesResponseItem[]> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.amendDatesFlights(), offer);

            return result.data;
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    getAmendDatesValidatedFlights = async (
        offers: IAmendDatesResponseItem[],
        cancelSource?: CancelTokenSource,
    ): Promise<IAmendDatesResponseItem[]> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.amendDatesValidateOffer(), offers, {
                cancelToken: cancelSource?.token,
            });

            return result.data;
        } catch (e) {
            if (Axios.isCancel(e)) {
                throw e;
            }

            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public validateRefundAmount = async (
        bookingReference: string,
        lastName: string,
        date: string,
        refundAmount: number,
    ): Promise<any> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.validateRefundAmount(), {
                bookingReference,
                lastName,
                date,
                refundAmount,
            });

            return {
                credit: {
                    isEligible: result.data?.credit?.isEligible ?? false,
                    credit: Math.abs(result.data?.credit?.credit ?? 0),
                    lostCreditsIfCancelled: result.data.refund.lostCreditsIfCancelled ?? '',
                },
                refund: {
                    isEligible: result.data?.refund?.isEligible ?? false,
                    credit: Math.abs(result.data?.refund?.credit ?? 0),
                    cash: Math.abs(result.data?.refund?.cash ?? 0),
                },
            };
        } catch (e) {
            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public sendSimpleBookingSearch = async (bookingReference: string) => {
        try {
            const result = await AxiosRequest.get(webApiUrls.simpleBookingSearch(bookingReference));

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    public getAmendSeats = async (
        bookingReference: string,
        seatSelection: ISelectedSeat[],
        cancelSource: CancelTokenSource,
    ): Promise<IAmendSeatsResponse> => {
        try {
            const result = await AxiosRequest.post(
                webApiUrls.getAmendSeats(),
                {
                    bookingReference,
                    seatSelection,
                },
                {
                    cancelToken: cancelSource ? cancelSource.token : undefined,
                },
            );

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    getAmendAlternativeFlightsWithLivePrice = async (
        booking: IBookingInfo,
        transports: { price: number; pricePP: number; transport: ITransport }[],
        cancelSource?: CancelTokenSource,
    ): Promise<IAmendBookingFlightPromoDataResponse> => {
        const {
            package: { accom },
        } = booking;
        const payload = {
            bookingReference: booking.bookingReference,
            alternativePackages: transports.map(({ transport, price, pricePP }) => ({
                alternativePackagePrice: price,
                alternativePackagePricePerPerson: pricePP,
                duration: getDaysDifference(new Date(accom.endDate), new Date(accom.startDate)),
                transport,
            })),
        };
        try {
            const result = await AxiosRequest.post(webApiUrls.getAmendAlternativeFlightsWithLivePrice(), payload, {
                cancelToken: cancelSource ? cancelSource.token : undefined,
            });

            return {
                transports: result?.data.amendTransports || [],
            };
        } catch (e) {
            if (Axios.isCancel(e)) {
                throw e;
            }

            logger.error({ e });
            throw new ApiError(e);
        }
    };

    public getAmendHotelTransfers = async (
        bookingRef: string,
        amendHotelOffer: IAmendHotelOffer,
        cancelSource?: CancelTokenSource,
    ): Promise<Array<{ amendHotelOffer: IAmendHotelOffer; bookingRef: string }>> => {
        try {
            const request = await AxiosRequest.post(
                webApiUrls.getAmendHotelTransfers(),
                {
                    bookingRef,
                    amendHotelOffer,
                },
                {
                    cancelToken: cancelSource?.token,
                },
            );

            return request.data;
        } catch (e) {
            if (Axios.isCancel(e)) {
                return [];
            }

            throw new ApiError(e);
        }
    };

    public getCancellationSummary = async (
        bookingReference: string,
        lastName: string,
        date: string,
        isTradePortal: boolean = false,
    ): Promise<ICancellationSummaryResponse> => {
        try {
            const result = await AxiosRequest.post(
                isTradePortal ? webApiUrls.cancellationSummaryTrade() : webApiUrls.cancellationSummary(),
                {
                    bookingReference,
                    lastName,
                    date,
                },
            );

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public cancelBooking = async (
        refundOption: RefundOption,
        bookingBreakdownValidationHash: number,
        bookingReference: string,
        lastName: string,
        date: string,
        isTradePortal: boolean = false,
        agentInfo?: Nullable<IAgentInfo>,
    ): Promise<IBookingCancellationResponse> => {
        try {
            const result = await AxiosRequest.put(
                isTradePortal ? webApiUrls.cancelBookingTrade() : webApiUrls.cancelBooking(),
                {
                    refundOption,
                    bookingBreakdownValidationHash,
                    source: SitecoreChannel.Desktop,
                    bookingReference,
                    lastName,
                    date,
                    supplierId: agentInfo?.number,
                    cancellationName: agentInfo?.name,
                },
            );

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public requestAssistedTravel = async (
        bookingReference: string,
        passengerName: string,
        questionsAndAnswers: { answer: string; question: string; questionCode: string }[],
    ): Promise<void> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.assistedTravel(bookingReference), {
                passengers: [
                    {
                        passengerName,
                        questionsAndAnswers,
                    },
                ],
            });

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };

    public getAssistedTravelRequests = async (bookingReference: string): Promise<IAssistedTravelRequest> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.assistedTravel(bookingReference));

            return result.data;
        } catch (e) {
            throw new ApiError(e);
        }
    };
}

export default new BookingService();
