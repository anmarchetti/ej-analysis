import { makeObservable, runInAction, when } from 'mobx';

import { ONE_HUNDRED } from 'code/commonNumbers';
import { DATE_FORMATS } from 'code/dates';
import { notificationsUrls } from 'code/endpoints';
import notificationsService from 'frontend/services/notifications.service';
import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { deepClone } from 'frontend/utils/array.utils';
import { formatDateL10n, getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import { checkDestinationTypeExists } from 'frontend/utils/destinations.utils';
import { withValue } from 'frontend/utils/expEditor.utils';
import isBackend from 'frontend/utils/isBackend';
import { getHotelContractType } from 'frontend/utils/offer.utils';
import { getCreditPaidAmount } from 'frontend/utils/payment.utls';
import { setTransactionTracked } from 'frontend/utils/paymentTransaction';
import { getFlightNumberWithCarNumber, getFlightsReferences } from 'frontend/utils/route.utils';
import { convertToYesNoString } from 'frontend/utils/string.utils';
import { getQuizTabIdentifyingUrl } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import {
    generateGenericValues,
    getBoardsTypes,
    getBrand,
    getBusinessChannel,
    getBusinessType,
    getCreditStatus,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationNames,
    getGuests,
    getPageLang,
    getRoomsTypesTitles,
    getRoutesDepartureDaysDifference,
    getScreenOrientation,
    getScreenSize,
    getSeason,
    getSeatCategory,
    getTimestamp,
    getTrackingTransferName,
    getVersion,
    resolveBoardBasis,
    shouldTrackPurchase,
} from 'frontend/utils/tracking/tracking.utils';
import { getDefaultViewBookingEventParams, ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IAmendPaymentInfo, IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { AmendmentType, IBookingInfo, IChatbotDataLayerPayload } from 'models/data/IBookingInfo';
import { IBaseFilterOption } from 'models/data/IFilters';
import { IQuizResult, IRecommendedInspireData } from 'models/data/IHolidayInspiration';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IPaymentTrackingData } from 'models/data/IPaymentInfo';
import { IRoute } from 'models/data/IRoute';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import { IBookingFlowTypeObject, TEcommerceAmendTransport } from 'models/data/tracking/IEcommerceObject';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { IPageLoadObject } from 'models/data/tracking/IPageLoadObject';
import {
    IAmendTransferProduct,
    IBaseHolidayProduct,
    IDetailHolidayProduct,
    IFeesProduct,
} from 'models/data/tracking/IProduct';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { GuestType } from 'models/enum/GuestType';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitePath from 'models/enum/SitePath';
import { AmendProductPBPostfix } from 'models/enum/tracking/AmendProductPBPostfix';
import { BookingType } from 'models/enum/tracking/BookingType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';
import { GuestTypes } from 'models/enum/tracking/GuestTypes';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories, ProductDimensions } from 'models/enum/tracking/ProductCategories';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { TrackingChangeFeeStore } from './TrackingStore.changeFee';
import { TrackingHotelChangeStore } from './TrackingStore.hotelChange';
import { TrackingStoreRoomAndBoard } from './TrackingStore.roomAndBoard';

export class TrackingStore extends BaseTrackingStore {
    // AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA
    comparePriceButtonID: number | undefined = undefined;
    roomAndBoard: TrackingStoreRoomAndBoard;
    changeFee: TrackingChangeFeeStore;
    changeHotel: TrackingHotelChangeStore;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);

        this.roomAndBoard = new TrackingStoreRoomAndBoard(rootStore);
        this.changeFee = new TrackingChangeFeeStore(rootStore);
        this.changeHotel = new TrackingHotelChangeStore(rootStore);

        if (!isBackend()) {
            window.errorTracking = this.errorTracking;
        }
    }

    gatherBookingTrackingMeta = (booking?: IBookingInfo): ICustomParams => {
        if (!this.rootStore.viewBookingStore.booking && !booking) return {};

        const {
            bookingReference,
            package: {
                transport: { routes },
            },
        } = this.rootStore.viewBookingStore.booking || booking!;
        const flightRoute = routes.find(({ direction }) => direction === RouteDirection.Outbound) || ({} as IRoute);

        return {
            genericValue2: flightRoute.depPt ? `${flightRoute.depPt}-${flightRoute.arrPt}` : null,
            genericValue3: bookingReference,
            genericValue4: getFlightsReferences(routes)[0] ?? flightRoute.fltNo ?? null,
        };
    };

    buildAmendTransferProduct = (
        booking: IBookingInfo | IOfferWithoutAltBoards,
        eventType: EventTypes,
        selectedTransfer: ITransferWithAmendmentCharges,
    ): Nullable<IAmendTransferProduct> => {
        const baseData = this.buildBaseHolidayProduct(booking, eventType);
        const { amendmentCharges } = selectedTransfer;

        let category = `${ProductCategories.Transfers}: `;
        let price;
        let dimension15;
        let metric6;
        price = dimension15 = metric6 = 0;

        if (amendmentCharges > 0) {
            category += AmendProductPBPostfix.UPGRADE;
            price = dimension15 = amendmentCharges;
        } else if (amendmentCharges < 0) {
            category += AmendProductPBPostfix.DOWNGRADE;
            metric6 = Math.abs(amendmentCharges);
        } else {
            category += AmendProductPBPostfix.CHANGE;
        }

        const transferName = getTrackingTransferName(selectedTransfer?.transfer.type) || '';

        if (baseData) {
            return {
                ...baseData,
                category,
                price,
                dimension15,
                metric6,
                name: transferName,
                id: transferName,
                quantity: 1,
            };
        }

        return null;
    };

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    protected override buildSearchDetailObject(
        offers: IAlternativeOffer[],
        eventType: EventTypes,
    ): IDetailHolidayProduct {
        const {
            searchTo: { selectedDestinations },
            filteredDestinations,
        } = this.rootStore.searchStore;
        const { Region, VirtualRegion } = DestinationType;

        const isVirtualRegions = checkDestinationTypeExists(selectedDestinations, VirtualRegion);

        const dimension22 =
            isVirtualRegions && !!filteredDestinations
                ? getDestinationLevels(filteredDestinations)
                : getDestinationLevels(selectedDestinations);

        const dimension25 =
            isVirtualRegions && !!filteredDestinations
                ? getDestinationNames(filteredDestinations, Region, VirtualRegion)
                : getDestinationNames(selectedDestinations, Region);

        const dimension26 =
            isVirtualRegions && !!filteredDestinations
                ? getDestinationCodes(filteredDestinations, Region, VirtualRegion)
                : getDestinationCodes(selectedDestinations, Region);

        return this.buildSearchDetailObjectBase(offers, eventType, { dimension22, dimension25, dimension26 });
    }

    // Page load tracking
    public callTagManager = async (): Promise<void> => {
        const { layoutStore, bookingStore, engageStore } = this.rootStore;

        // Tracking Holiday Inspiration page takes place in InspireMeTabs.tsx
        if (isAnalyticsDisabled() || layoutStore.isHolidayInspirationPage) {
            return;
        }

        this.isPageLoadEventLoading = true;

        await this.initializePageLoadObject();
        const ecommerce = await this.buildEcommerceObjectOnPageLoad();
        const bookingFlowTypeObject = this.addBookingFlowTypeTracking();

        // Should be called before adding ecommerce object to data layer
        await this.trackSearchCriteria(ecommerce?.ecommerce, EventTypes.Search);

        // Ecommerce event should be always before page load
        this.addToDataLayer(bookingFlowTypeObject);
        this.addToDataLayer(ecommerce);
        this.addToDataLayer(this.pageLoadObject);

        if (layoutStore.isSearchResultsPage || layoutStore.isPromoPage) {
            this.addToDataLayer({ event: EventTypes.Bd4tProductList });
        }

        if (layoutStore.isPromoPage) {
            this.trackPromoPageBoardBasisViewed();
        }

        if (layoutStore.isConfirmationPage) {
            const { booking } = bookingStore;

            if (ecommerce) {
                setTransactionTracked();

                if (booking?.specialRequests?.length) {
                    this.trackBookingSpecialRequests(EventTypes.SpecialRequestPurchase, booking);
                }
            }

            notificationsService.trackDataForNotification(notificationsUrls.trackBookingData(), {
                AccommodationId: booking?.hotel?.code || booking?.hotel?.giataCode || '',
                Image:
                    booking?.hotel?.images?.[0]?.large ||
                    booking?.hotel?.images?.[0]?.medium ||
                    booking?.hotel?.images?.[0]?.small ||
                    '',
            });
        }

        if (layoutStore.isDestinationPage && !layoutStore.isHotelDetailsBrowsePage) {
            this.addDestinationGuideDimensions();
        }

        if (layoutStore.isHotelDetailsBookPage) {
            engageStore.sendPromoCodeEvent(bookingStore.selectedOffer?.accom.prom);
        }

        layoutStore.isHolidayTypePage && this.trackHolidayTypes();

        runInAction(() => (this.isPageLoadEventLoading = false));
    };

    private readonly trackPromoPageBoardBasisViewed = (): void => {
        const selectedFilters = this.rootStore.searchFiltersStore.selectedFilters || [];
        const boardFilterOptions =
            this.rootStore.searchFiltersStore.filters.find(f => f.code === FilterGroupCodes.BoardType)?.options || [];

        const boardFilters = selectedFilters.filter(f => f.groupCode === FilterGroupCodes.BoardType && f.code);

        const boardTypeParentMap = this.rootStore.layoutStore.isPromoPage
            ? this.rootStore.promoPageStore.boardTypeToParentMap
            : {};

        const canonicalTypes = new Set<string>(
            boardFilters.map(filter => {
                const parentCode = boardTypeParentMap[filter.code] || filter.code;

                const canonical = resolveBoardBasis(parentCode, boardFilterOptions);

                return canonical;
            }),
        );

        canonicalTypes.forEach(boardBasis => {
            this.rootStore.engageStore.sendCustomEvent('BOARD_PROMO_PAGE_VIEWED', { boardBasis });
        });
    };

    protected addBookingFlowTypeTracking = (): IBookingFlowTypeObject | null => {
        const { isExtrasPage, isGuestDetailsPage, isConfirmationPage } = this.rootStore.layoutStore;

        if ((isConfirmationPage && shouldTrackPurchase()) || isGuestDetailsPage || isExtrasPage) {
            const { isFlightAndHotelPackage } = this.rootStore.bookingStore;

            return {
                event: EventTypes.BookingFlow,
                bookingType: isFlightAndHotelPackage ? BookingType.FlightAndHotel : BookingType.HolidaysBooking,
            };
        }

        return null;
    };

    // Hotel details page interaction
    public holidayConfigChangeTrigger = (eventType: EventTypes, priceDiff: number, prevRoutes?: IRoute[]): void => {
        const offer = this.rootStore.bookingStore.selectedOffer;

        if (!offer?.accom?.unit) {
            return;
        }

        const rooms = offer.accom.unit;
        const roomTypes = getRoomsTypesTitles(rooms);
        const boardTypes = getBoardsTypes(rooms);
        const [outboundInfo, inboundInfo] = offer.transport.routes;
        const adults = getGuests(rooms, GuestTypes.Adults);
        const children = getGuests(rooms, GuestTypes.Children);
        const infants = getGuests(rooms, GuestTypes.Infants);
        const guestsNumber = adults + children + infants;

        // AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA
        const comparePriceTestParam =
            eventType === EventTypes.FlightChangePriceGraph
                ? {
                      dimension12: this.pageLoadObject?.dimension12 ?? '',
                      customParams: {
                          genericValue1: `location ${this.comparePriceButtonID}`,
                      },
                  }
                : {};

        const holidayConfig = {
            event: eventType,
            dimension136: this.pageName,
            ...comparePriceTestParam,
            ecommerce: {
                detail: {
                    products: [
                        {
                            event: eventType,
                            dimension13: getTimestamp(),
                            dimension15: offer.price,
                            dimension16: priceDiff * guestsNumber,
                            dimension17: getSeatCategory(outboundInfo.isExt),
                            dimension137: getSeatCategory(inboundInfo.isExt),
                            dimension54: rooms.length,
                            dimension55: roomTypes,
                            dimension56: boardTypes,
                            dimension18: outboundInfo.depItemName ?? outboundInfo.depName,
                            dimension19: outboundInfo.depPt,
                            dimension20: outboundInfo.arrItemName ?? outboundInfo.arrName,
                            dimension21: outboundInfo.arrPt,
                            dimension35: formatDateL10n(outboundInfo.depDate, DATE_FORMATS.query),
                            dimension36: formatDateL10n(outboundInfo.depDate, DATE_FORMATS.yearMonthFormat),
                            dimension37: getSeason(outboundInfo.depDate),
                            dimension38: formatDateL10n(outboundInfo.depDate, DATE_FORMATS.time),
                            dimension40: getDaysDifferenceRoundedFloor(new Date(outboundInfo.depDate), new Date()),
                            dimension83: outboundInfo.fltNo,
                            dimension41: ProductDimensions.DateLevel,
                            dimension42: formatDateL10n(inboundInfo.depDate, DATE_FORMATS.query),
                            dimension43: formatDateL10n(inboundInfo.depDate, DATE_FORMATS.yearMonthFormat),
                            dimension44: getSeason(inboundInfo.depDate),
                            dimension45: formatDateL10n(inboundInfo.depDate, DATE_FORMATS.time),
                            dimension47: offer.accom.stay,
                            dimension77: getHotelContractType(offer.accom.isExt, offer.accom.id),
                            dimension96: getRoutesDepartureDaysDifference(outboundInfo, prevRoutes?.[0]),
                            dimension109: getRoutesDepartureDaysDifference(inboundInfo, prevRoutes?.[1]),
                            price: offer.pricePP,
                            ...(eventType === EventTypes.RoomUpdate &&
                                this.buildUrgencyMessagingDimensions(eventType, offer.accom.unit)),
                        },
                    ],
                },
            },
        };
        this.addToDataLayer(holidayConfig);
    };

    public continueToPaymentTrigger = async (): Promise<void> => {
        this.addPageAndTimestampDimensions(EventTypes.ContinueToPayment);
        const currencyCode = this.rootStore.bookingStore.selectedOffer?.currency?.code;

        // Add Payment PageLoad Object
        await this.initializePageLoadObject({
            title: 'Payment',
            category: PageLoadCategory.Book,
            url: window.location.href.replace(SitePath.GuestsDetails, SitePath.Payment),
            currencyCode,
        });
        this.addToDataLayer(this.pageLoadObject);
    };

    /* AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA */
    public expandPriceGraphTrigger = (buttonID?: number): void => {
        this.setComparePriceButtonID(buttonID);
        this.trackComparePriceTrigger(EventTypes.PriceGraphExpanded);
    };

    public trackCustomError = (errorType: string, errorMessage: string): void => {
        this.addToDataLayer({
            event: EventTypes.ErrorMessage,
            dimension13: getTimestamp(),
            dimension86: errorType,
            dimension87: errorMessage,
            dimension136: this.buildPageName(this.getPageTitle()),
        });
    };

    public trackCreditOnAccount = (creditBalance: IMyCreditInfo[] | null): void => {
        this.addToDataLayer({
            event: EventTypes.CreditOnAccount,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            dimension156: getCreditStatus(creditBalance),
        });
    };

    public trackOffersPriceViewChange = async (): Promise<void> => {
        const { layoutStore, hotelsStore, searchStore, shortlistStore } = this.rootStore;
        const { isPromoPage, isSearchResultsPage, isShortlistPage } = layoutStore;

        if (!isPromoPage && !isSearchResultsPage && !isShortlistPage) return;

        if (isSearchResultsPage || isPromoPage) {
            await when(
                () =>
                    hotelsStore.status !== DataStatus.Loading &&
                    hotelsStore.status !== DataStatus.NotLoaded &&
                    searchStore.searchTo.isLoadingDestinations === false,
            );

            if (hotelsStore.status === DataStatus.Error) return;

            this.setPrices();
        }

        if (isShortlistPage) {
            await when(
                () =>
                    shortlistStore.offersStatus !== DataStatus.Loading &&
                    shortlistStore.offersStatus !== DataStatus.NotLoaded,
            );

            if (shortlistStore.offersStatus === DataStatus.Error) return;
        }

        const offers = isShortlistPage ? shortlistStore.offers : hotelsStore.offers;
        const detailObject = { ...this.buildSearchDetailObject(offers, EventTypes.OffersPriceViewChange) };

        this.addToDataLayer({
            event: EventTypes.OffersPriceViewChange,
            dimension136: this.pageName,
            ecommerce: {
                detail: {
                    products: [detailObject],
                },
                impressions: offers.map((offer, index) =>
                    this.buildBaseHolidayProduct(offer, EventTypes.OffersPriceViewChange, index),
                ),
            },
        });
    };

    public trackAlternativeFlightFiltersUpdate = (isSelectAction: boolean, filter?: IBaseFilterOption): void => {
        const offers = this.rootStore.alternativeFlightsStore.sortAndFilterFlights(
            this.rootStore.bookingStore.alternativeFlights,
        );
        const detailObject = this.buildSearchDetailObject(offers, EventTypes.FlightFiltersUpdate);
        const extraDetailDimensions = this.getFilterActionDimensions(isSelectAction, filter);

        this.addToDataLayer({
            event: EventTypes.FlightFiltersUpdate,
            dimension136: this.pageName,
            // AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA
            dimension12: this.pageLoadObject?.dimension12 ?? '',
            customParams: {
                genericValue1: `location ${this.comparePriceButtonID}`,
            },
            ecommerce: {
                detail: {
                    products: [{ ...detailObject, ...extraDetailDimensions }],
                },
            },
        });
    };

    public trackTransferAmendment = (eventType: EventTypes): void => {
        try {
            const { viewBookingStore, amendTransfersStore, marketStore } = this.rootStore;
            const { booking } = viewBookingStore;
            const pageNameWithCategory =
                eventType === EventTypes.PostBookingConfirmationBasket
                    ? this.buildPageName('Post Booking: Transfer Confirmation') // this click happens on the booking page
                    : [this.pageCategory, this.pageName].join(': ');

            let { selectedTransfer } = amendTransfersStore;

            if (!selectedTransfer && eventType === EventTypes.PostBookingConfirmationBasket) {
                selectedTransfer = viewBookingStore.viewBookingPayload?.amendPaymentPayload?.selectedTransfer;
            }

            if (!booking || !selectedTransfer) return;

            const { bookingReference, currency } = booking;
            const transferProduct = this.buildAmendTransferProduct(booking, eventType, selectedTransfer);

            if (transferProduct) {
                let ecommerce: TEcommerceAmendTransport = {};

                switch (eventType) {
                    case EventTypes.AmendTransferSelect:
                        ecommerce.click = {
                            actionField: {
                                action: 'click',
                                list: pageNameWithCategory,
                            },
                            products: [transferProduct],
                        };

                        break;
                    case EventTypes.AmendTransferUpdate:
                        ecommerce = {
                            currencyCode: currency?.code ?? marketStore.currency,
                            detail: {
                                actionField: {
                                    list: pageNameWithCategory,
                                },
                                products: [transferProduct],
                            },
                        };
                        break;
                    case EventTypes.PostBookingConfirmationBasket:
                        ecommerce.purchase = {
                            actionField: {
                                event: eventType,
                                id: `${bookingReference}_${Date.now()}_PB_CT`,
                                timestamp: getTimestamp(),
                                revenue: transferProduct.price,
                                action: 'purchase',
                            },
                            products: [transferProduct],
                        };
                        break;
                }
                const dimension66 = this.rootStore.viewBookingStore.dimension66;
                const paymentMethod = this.rootStore.viewBookingStore.paymentMethod;

                this.addToDataLayer({
                    event: eventType,
                    dimension136: pageNameWithCategory,
                    dimension173: bookingReference,
                    ecommerce,
                    dimension66: dimension66 ?? '',
                    paymentMethod: paymentMethod ?? '',
                });
            }
        } catch (err) {}
    };

    public trackGenericAmendmentAction = (eventAction: AmendEventActions, eventLabel: string): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Holidays,
                eventType: EventTypes.Interaction,
                eventAction,
                eventLabel,
            },
            generateGenericValues({
                genericValue4: this.bookingId,
            }),
        );
    };

    public trackGenericAmendmentActionWithGuests = async (
        eventAction: AmendEventActions | AmendEventLabels,
        eventLabel: string,
        customParams: ICustomParams = {},
        prependCategoryToPageName = true,
    ): Promise<void> => {
        // event should be added only after "pageLoad" event
        await when(
            () =>
                this.isPageLoadEventLoading === false && this.pageLoadLayoutId === this.rootStore.layoutStore.layoutId,
        );

        const coreParams = this.buildCoreParamsObject();

        this.addToDataLayer({
            event: EventTypes.GenericEvent,
            coreParams: {
                ...coreParams,
                pageName: prependCategoryToPageName ? `${this.pageCategory}: ${this.pageName}` : this.pageName,
            },
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventType: EventTypes.Interaction,
                eventAction,
                eventLabel,
            },
            customParams: this.generateGenericValuesWithGuests({
                ...customParams,
            }),
        });
    };

    getPrices = (
        paymentInfo?: Partial<IAmendPaymentInfo>,
        withFees?: boolean,
    ): {
        amendmentCharges: number;
        fees: IFeePerPerson | undefined;
        metric6: number;
        productPrice: number;
        revenue: number;
    } => {
        const { amendmentChargesWithoutFees = 0, amendmentCharges = 0, feesPerPersons = [] } = paymentInfo || {};

        const priceWithoutFees = withFees ? amendmentChargesWithoutFees : amendmentCharges;

        return {
            metric6: amendmentCharges < 0 ? Math.abs(amendmentCharges) : 0,
            revenue: amendmentCharges > 0 ? amendmentCharges : 0,
            productPrice: priceWithoutFees < 0 ? 0 : priceWithoutFees,
            fees: withFees ? feesPerPersons[0] : undefined,
            amendmentCharges,
        };
    };

    public trackNewDateSelectionEvent = (customParams: ICustomParams = {}): void => {
        this.trackGenericAmendmentActionWithGuests(
            AmendEventActions.ViewBooking,
            AmendEventLabels.NewDateSelection,
            customParams,
        );
    };

    public trackDateChangeConfirmAction = (
        eventType: EventTypes.PostBookingChangeDatesUpdate | EventTypes.PostBookingConfirmationBasket,
    ): void => {
        const offerFromStore = this.rootStore.amendDatesStore.offerWithPrices;
        const offerFromPayload =
            this.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.amendDatesOffer;
        const { offer, amendmentPaymentInfo, offerPrice, promoCodeBreakDown } =
            offerFromStore || offerFromPayload || {};
        const isConfirmationEvent = eventType === EventTypes.PostBookingConfirmationBasket;

        const { booking } = this.rootStore.viewBookingStore;

        const prices = this.getPrices(amendmentPaymentInfo, isConfirmationEvent);

        if (!offer || !booking) {
            return;
        }

        const bookingRoutes = booking.package.transport.routes;
        const {
            bookingReference,
            package: {
                accom: { hotel },
            },
        } = booking;

        const [bookingOutboundFlight, bookingInboundFlight] = isConfirmationEvent
            ? this.rootStore.viewBookingStore.viewBookingPayload?.package?.transport?.routes || []
            : bookingRoutes;

        const baseHolidayProduct = this.buildBaseHolidayProduct({ ...offer, hotel }, eventType, undefined, {
            category: ProductCategories.ChangeDatePB,
            name: ProductCategories.ChangeDatePB,
            id: `${booking.hotel?.code}_PB`,
            price: prices.productPrice,
            quantity: 1,
            dimension15: offerPrice,
            dimension47: offer?.accom.stay,
            variant: hotel.theme?.itemName ?? hotel.theme?.name,
            brand: getBrand(hotel.type, booking.prom),
        });

        const pageTitle = `${this.pageCategory}: ${this.pageName}`;
        const products: (Nullable<IBaseHolidayProduct> | IFeesProduct)[] = [
            baseHolidayProduct,
            ...(prices.fees ? [this.buildFeesAnalyticProduct(prices.fees)] : []),
        ];

        const dimension66 = this.rootStore.viewBookingStore.dimension66;
        const paymentMethod = this.rootStore.viewBookingStore.paymentMethod;

        this.addToDataLayer({
            event: eventType,
            metric6: prices.metric6,
            dimension173: bookingReference,
            dimension182: `${getFlightNumberWithCarNumber(bookingOutboundFlight)}|${getFlightNumberWithCarNumber(
                bookingInboundFlight,
            )}`,
            ...(isConfirmationEvent
                ? {
                      pageTitle,
                      dimension136: this.buildPageName(`${this.pageCategory}: Change Dates Confirmation`),
                      flightReference: getFlightsReferences(bookingRoutes || []).join('|') || 'Series',
                      ecommerce: {
                          purchase: {
                              actionField: {
                                  event: EventTypes.Booking,
                                  id: `${bookingReference}_${Date.now()}_PB_CD`,
                                  timestamp: getTimestamp(),
                                  revenue: prices.revenue,
                                  coupon: promoCodeBreakDown?.promoCode ?? '',
                                  metric3: getCreditPaidAmount(booking.paymentInfo) ?? 0,
                              },
                              products,
                          },
                      },
                  }
                : {
                      dimension136: pageTitle,
                      ecommerce: {
                          detail: {
                              actionField: {
                                  list: pageTitle,
                              },
                              products,
                          },
                      },
                  }),
            dimension66: dimension66 ?? '',
            paymentMethod: paymentMethod ?? '',
        });
    };

    // AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA
    public setComparePriceButtonID = (id: number | undefined): void => {
        this.comparePriceButtonID = id;
    };

    // AB-TEST: EHD-29 HD:Duplicate the Compare Prices CTA
    public trackComparePriceTrigger = (eventType: EventTypes): void => {
        this.addToDataLayer({
            event: eventType,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            dimension12: this.pageLoadObject?.dimension12 ?? '',
            customParams: {
                genericValue1: `location ${this.comparePriceButtonID}`,
            },
        });
    };

    public trackSuccessfulAmendment = (): void => {
        const amendmentType = this.rootStore.viewBookingStore.successfulAmendmentStatus;

        switch (amendmentType) {
            case AmendmentType.Flight:
                this.trackSuccessfulFlightAmendment();
                break;

            case AmendmentType.Transfer:
                this.trackTransferAmendment(EventTypes.PostBookingConfirmationBasket);
                break;

            case AmendmentType.Seats:
                this.trackSeatsAmendment();
                break;

            case AmendmentType.Dates:
                this.trackDateChangeConfirmAction(EventTypes.PostBookingConfirmationBasket);
                break;

            case AmendmentType.RoomAndBoard:
                this.roomAndBoard.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);
                break;

            case AmendmentType.Hotel:
                this.changeHotel.trackSuccessFullAmendment();
                break;
        }
    };

    trackChangeSortTypeFlightAmendment = (sortOption: AlternativeFlightsSortBy, bookingReference: string): void => {
        const coreParams = this.buildCoreParamsObject();

        this.addToDataLayer({
            event: EventTypes.GenericEvent,
            coreParams,
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventAction: AmendEventActions.ViewBooking,
                eventType: EventTypes.Interaction,
                eventLabel: AmendEventLabels.ChangeFlights,
            },
            customParams: generateGenericValues({
                genericValue1: 'Sort Option',
                genericValue2: sortOption,
                genericValue4: bookingReference,
            }),
        });
    };

    trackWrongPriceSortingAlternativeFlights = (sortOption: AlternativeFlightsSortBy): void => {
        const errorObject = {
            event: EventTypes.ErrorMessage,
            dimension13: getTimestamp(),
            dimension86: 'Sort Error',
            dimension87: sortOption,
            dimension136: this.buildPageName(this.getPageTitle()),
        };

        this.addToDataLayer(errorObject);
    };

    public trackSuccessfulFlightAmendment = (): void => {
        const { booking, viewBookingPayload } = this.rootStore.viewBookingStore;
        const routes = booking?.package.transport.routes;
        const bookingRoutes = viewBookingPayload?.amendPaymentPayload?.package?.transport?.routes;
        const selectedFlight = viewBookingPayload?.amendPaymentPayload?.selectedFlight;

        if (!routes || !bookingRoutes) return;

        this.trackFlightAmendment(
            EventTypes.PostBookingConfirmationBasket,
            routes,
            bookingRoutes,
            selectedFlight?.amendmentPaymentInfo,
        );
    };

    public trackFlightAmendment = (
        eventType: EventTypes,
        routes: IRoute[],
        bookingRoutes: IRoute[],
        paymentInfo?: IAmendPaymentInfo,
    ): void => {
        try {
            const { viewBookingStore, marketStore } = this.rootStore;
            const { booking, viewBookingPayload } = viewBookingStore;
            const pageNameWithCategory =
                eventType === EventTypes.PostBookingConfirmationBasket
                    ? this.buildPageName('Post Booking: Change Flight Confirmation') // this click happens on the booking page
                    : `${this.pageCategory}: ${this.pageName}`;
            const { outbound, inbound } = getRouteByDirection(routes);
            const outboundFlight = deepClone(outbound);
            const inboundFlight = deepClone(inbound);
            const baseHolidayProduct = booking && this.buildBaseHolidayProduct(booking, eventType);

            if (!booking || !outboundFlight || !inboundFlight || !baseHolidayProduct) return;

            const { bookingReference } = booking;
            const { promoCodeBreakDown } = viewBookingPayload?.amendPaymentPayload?.selectedFlight || {};
            const isConfirmationEvent = eventType === EventTypes.PostBookingConfirmationBasket;

            const prices = this.getPrices(paymentInfo, isConfirmationEvent);

            const flightPerAmendChanges = 2; // Inbound and Outbound
            // Divide by number of guests excluding infants as they don't get a seat
            const guests = booking.guests?.filter(guest => guest.type !== GuestType.Infant).length || 1;

            const routePricePP = prices.productPrice
                ? Math.round((prices.productPrice / flightPerAmendChanges / guests) * ONE_HUNDRED) / ONE_HUNDRED
                : 0;

            const { outbound: bookingOutboundFlight, inbound: bookingInboundFlight } =
                getRouteByDirection(bookingRoutes);

            baseHolidayProduct.name += '_PB';
            baseHolidayProduct.id += '_PB';
            outboundFlight.fltNo = getFlightNumberWithCarNumber(outboundFlight);
            inboundFlight.fltNo = getFlightNumberWithCarNumber(inboundFlight);

            const flightProductOverrides = {
                price: routePricePP,
                // Total refund
                metric6: prices.metric6,
            };

            const outboundFlightProduct = this.buildFlightProduct(
                ProductCategories.FlightOutboundPB,
                outboundFlight,
                baseHolidayProduct,
                flightProductOverrides,
                true,
            );
            const inboundFlightProduct = this.buildFlightProduct(
                ProductCategories.FlightInboundPB,
                inboundFlight,
                baseHolidayProduct,
                flightProductOverrides,
                true,
            );

            const ecommerce: TEcommerceAmendTransport = {};

            switch (eventType) {
                case EventTypes.PostBookingChangeFlightsSelect:
                    ecommerce.detail = {
                        actionField: {
                            list: pageNameWithCategory,
                            action: 'click',
                        },
                        products: [outboundFlightProduct, inboundFlightProduct],
                    };
                    break;
                case EventTypes.PostBookingChangeFlightsUpdate:
                    ecommerce.currencyCode = booking.currency?.code ?? marketStore.currency;
                    ecommerce.detail = {
                        actionField: {
                            list: pageNameWithCategory,
                            action: 'detail',
                        },
                        products: [outboundFlightProduct, inboundFlightProduct],
                    };
                    break;
                case EventTypes.PostBookingConfirmationBasket: {
                    ecommerce.purchase = {
                        actionField: {
                            event: eventType,
                            id: `${bookingReference}_${Date.now()}_PB_CF`,
                            timestamp: getTimestamp(),
                            revenue: prices.revenue,
                            coupon: promoCodeBreakDown?.promoCode ?? '',
                            action: 'purchase',
                        },
                        products: [
                            outboundFlightProduct,
                            inboundFlightProduct,
                            ...(prices.fees ? [this.buildFeesAnalyticProduct(prices.fees)] : []),
                        ],
                    };
                }
            }

            const dimension66 = this.rootStore.viewBookingStore.dimension66;
            const paymentMethod = this.rootStore.viewBookingStore.paymentMethod;

            const trackObject = {
                event: eventType,
                dimension136: pageNameWithCategory,
                dimension173: bookingReference,
                dimension182: `${getFlightNumberWithCarNumber(bookingOutboundFlight)}|${getFlightNumberWithCarNumber(
                    bookingInboundFlight,
                )}`,
                ecommerce,
                dimension66,
                paymentMethod,
            };

            this.addToDataLayer(trackObject);
        } catch (error) {}
    };

    public getTrackPaymentData = async (): Promise<IPaymentTrackingData> => {
        const page_category = this.getPageCategoryFromLayout();
        const {
            layoutStore: { layout },
            bookingStore: { isFlightAndHotelPackage },
        } = this.rootStore;
        const [testVariant, pageTitle] = await Promise.all([this.getABTestVariant(layout), this.getPageTitle()]);
        const lang = getPageLang(this.rootStore.layoutStore.lang);
        const sessionItem = sessionStorage.getItem(WebStorageKeys.PrevPage);
        const prevPageData = sessionItem ? JSON.parse(sessionItem) : {};
        const businessChannel = isFlightAndHotelPackage ? 'Flight And Hotel' : getBusinessChannel();

        return {
            page_title: `MP_${pageTitle}|${lang}`, ////title should be unique for each payment page, and language should be dynamically changed based on site's language
            page_category,
            content_group: page_category, //pageCategory property
            logged_in_status: convertToYesNoString(this.rootStore.userStore.isLoggedIn),
            ...(this.rootStore.payStore.currency && { currency: this.rootStore.payStore.currency }),
            business_type: getBusinessType(), //Example value dimension3 property
            business_channel: businessChannel, //Example value dimension2 property
            platform_language: lang, //language should be dynamically changed based on site's language - dimension6
            screen_orientation: getScreenOrientation(), //Example value dimension8 property
            responsive_page_break_view: getScreenSize(this.rootStore.appStore), //Example value dimension9 property
            referral_page_name: prevPageData.prevPageName ?? '', //Example value dimension10 property
            referral_page_category: prevPageData.prevPageCategory ?? '', //Example value dimension11 property
            environment: window.location.origin, //dimension4 property
            site_version: getVersion(), //dimension5 property
            test_variant: testVariant, //dimension12 property
        };
    };

    public setPreviousPage = (): void => {
        const prevPageName = this.pageName;
        const prevPageCategory = this.pageCategory;
        sessionStorage.setItem(WebStorageKeys.PrevPage, JSON.stringify({ prevPageName, prevPageCategory }));
    };

    getPageLoadObject = (): IPageLoadObject | null => this.pageLoadObject;

    fireViewBookingEvent = (
        eventLabel: ViewBookingTrackingEvents,
        label: Nullable<string>,
        booking?: IBookingInfo,
    ): void => {
        const eventParams = getDefaultViewBookingEventParams({
            eventLabel,
        });
        const customParams = {
            genericValue1: label,
            ...this.gatherBookingTrackingMeta(booking),
        };
        const coreParams = this.buildCoreParamsObject();
        this.addToDataLayer({
            event: EventTypes.GenericEvent,
            coreParams,
            customParams,
            eventParams,
        });
    };

    fireChatbotViewBookingEvent = (chatbotDataLayerData: IChatbotDataLayerPayload): void => {
        this.addToDataLayer({
            event: EventTypes.ChatbotViewBooking,
            ...chatbotDataLayerData,
        });
    };

    removeFromDataLayer = (eventType: EventTypes): void => {
        try {
            if (!isAnalyticsDisabled() && eventType) {
                const index = dataLayer.findIndex(event => event.event === eventType);

                if (index !== -1) {
                    dataLayer.splice(index, 1);
                }
            }
        } catch (e) {}
    };

    public trackInspireMePageLoad = async (slideTitle: string, trackingItemName: string): Promise<void> => {
        const quizTabUrl = getQuizTabIdentifyingUrl(withValue(trackingItemName));

        await this.initializePageLoadObject({
            title: `Inspire Me:${slideTitle}`,
            category: PageLoadCategory.InspireMe,
            url: quizTabUrl,
        });

        this.addToDataLayer(this.pageLoadObject);
    };

    public trackSmartseerQuizResults = (eventParams: IQuizResult): void => {
        this.addToDataLayer({
            event: EventTypes.SmartseerQuizAnswers,
            eventParams,
        });
    };

    public smartseetTrackResult = (quizAnswers: IQuizResult, response: IRecommendedInspireData): void => {
        const { destinations, trackingInfo } = response;

        const commonData = {
            listId: 'ejh-inspire-me',
            listOffset: 0,
            pageSize: 1,
            ptoken: trackingInfo?.pToken,
            recoInfo: trackingInfo?.recoInfo,
            context: {
                type: 'inspireme',
                section: 'inspireme',
                label: 'quiz:answers',
                smartseer_quiz_answers: quizAnswers,
            },
            timestamp: getTimestamp(),
            trackingId: '',
            userId: '', // keep userId empty as it's stored in cookies and httpOnly cookie can't be accessed via JS
            action: 'recoview',
            documentLocation: window.location.href,
            documentReferrer: '',
            userAgent: navigator.userAgent,
        };

        const specificData = response.destinations.length
            ? { elements: destinations }
            : { issues: [{ type: 'notAvailable' }] };

        this.addToDataLayer({ ...commonData, ...specificData });
    };
}

export default TrackingStore;
