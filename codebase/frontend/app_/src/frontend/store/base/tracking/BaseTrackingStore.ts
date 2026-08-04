import type { DecisionListenerPayload, FlagDecisionInfo } from '@optimizely/optimizely-sdk';
import { AxiosError } from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import { ONE_HUNDRED } from 'code/commonNumbers';
import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { envAll, envPublic } from 'code/env';
import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import { ANALYTIC_SEPARATOR } from 'code/tracking.config';
import { getDefaultGalleryMediaContent } from 'frontend/hooks/useCarouselTracking/useCarouselTracking.utils';
import { logger } from 'frontend/services/logging';
import { TRootStore } from 'frontend/store/IStores';
import { getCountryNameOfAirportByCode } from 'frontend/utils/airports.utils';
import { groupArrayByKey } from 'frontend/utils/array.utils';
import { getCookie } from 'frontend/utils/cookies.utils';
import { formatDateL10n, getDaysDifference, getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import { getParentDestinationByCode } from 'frontend/utils/destinations.utils';
import { encodeSHA256 } from 'frontend/utils/encodeSHA256.utils';
import { getFilterTitle } from 'frontend/utils/filter.utils';
import { getFreeNightsIncludedInOffer } from 'frontend/utils/freeNights.utils';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { findComponentByName } from 'frontend/utils/layout.utils';
import { getGuestsAmountByType } from 'frontend/utils/luggage.utils';
import { checkRoomsOnFreeForKids, containsLuxuryPromoCode, getHotelContractType } from 'frontend/utils/offer.utils';
import { getGuestsAmount } from 'frontend/utils/passenger.utils';
import { getCreditPaidAmount, getTotalPaidAmount } from 'frontend/utils/payment.utls';
import { getFlightDigitalNumber, getFlightNumberWithCarNumber, getFlightsReferences } from 'frontend/utils/route.utils';
import { getSelectedSeatsFromWidgetData } from 'frontend/utils/seatMap.utils';
import { rum } from 'frontend/utils/splunk';
import { convertToYesNoString } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { createABTestsPipedList, getLayoutABTests, getStorageABTests } from 'frontend/utils/tracking/abTests.utils';
import { getFilterSelectionTrackingName } from 'frontend/utils/tracking/filters.utils';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import { createShortlistViewProduct } from 'frontend/utils/tracking/shortlist.utils';
import { getSpecialRequestsAction, getSpecialRequestsGroupCodes } from 'frontend/utils/tracking/specialRequests.utils';
import {
    createFromSearchSelectionItem,
    createToSearchSelectionItem,
    generateGenericValues,
    getAncillariesPrice,
    getBoardsTypes,
    getBookingEmail,
    getBrand,
    getBusinessChannel,
    getBusinessType,
    getChildrenAge,
    getDaysToDepartureBucket,
    getDepartureAirportsNames,
    getDepartureDateFlexibility,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationLevelsByCodes,
    getDestinationNames,
    getFirstPositionOnPage,
    getGuests,
    getHotelFacilities,
    getNumberOfRooms,
    getOffersBrands,
    getOffersDestinationAirportsCodes,
    getOffersDestinationAirportsNames,
    getOffersStarRatings,
    getPageLang,
    getPassengerConfig,
    getPercentageOfTotal,
    getPosition,
    getPromoCodeAmount,
    getRoomsTypesTitles,
    getScreenOrientation,
    getScreenSize,
    getSearchOriginPageTitle,
    getSeason,
    getSeatCategory,
    getSliderListOffset,
    getSliderListPosition,
    getTimestamp,
    getVersion,
    groupSeatsByActionType,
    resolveBoardBasis,
    shouldTrackPurchase,
} from 'frontend/utils/tracking/tracking.utils';
import { createProduct, IProduct } from 'frontend/utils/tracking/trackOffer.utils';
import {
    getCabinBagsUrgencyMessage,
    getRoomsUrgencyMessage,
    getSeatsUrgencyMessage,
} from 'frontend/utils/urgencyMessage.utils';
import { buildSitecoreLinkFullUrl, purifyUrl } from 'frontend/utils/url.utils';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { IBd4Tracking } from 'models/data/IBd4Tracking';
import { IBookingInfo, IBookingSpecialRequest } from 'models/data/IBookingInfo';
import { IExcursion } from 'models/data/IExcursions';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import { IBaseFilterOption, ITrackingFilterOption } from 'models/data/IFilters';
import { ILuggageTrackingProductItem } from 'models/data/IFlightExtras';
import { IRoom } from 'models/data/IHotel';
import { IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISelectedSeat, ISelectedSeatDetails } from 'models/data/ISeatMapStore';
import {
    ISitTogetherClickedData,
    ISitTogetherImpressionData,
    TSeatTogetherCheckbox,
} from 'models/data/ISeatMapWidgetTrackingEvent';
import { ISlidesOptions } from 'models/data/ISlidesOptions';
import { ITransfer } from 'models/data/ITransfer';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { GenericValues } from 'models/data/tracking/AmendEvent';
import { IABTest } from 'models/data/tracking/IABTest';
import { ICoreParams } from 'models/data/tracking/ICoreParams';
import { TDataLayerObject } from 'models/data/tracking/IDataLayerObject';
import {
    IEcommerceDetail,
    IEcommerceObject,
    IHolidaySearchSelection,
    ISearchCriteria,
    TEnhancedEcommerce,
} from 'models/data/tracking/IEcommerceObject';
import {
    ICustomParams,
    IEventParams,
    IExcursionsEventParams,
    IHolidayTypesHubEventParams,
    IHomepageEventParams,
    IModuleClickEventParams,
    INavigationClickEventParams,
} from 'models/data/tracking/IEventWithParams';
import { IHolidayDetails } from 'models/data/tracking/IHolidayDetails';
import {
    IFilterActionDimensions,
    IPageLoadObject,
    IPageMeta,
    IUrgencyMessagingDimensions,
} from 'models/data/tracking/IPageLoadObject';
import {
    IAirportParkingProduct,
    IBagsProduct,
    IBaseHolidayProduct,
    IDetailHolidayProduct,
    IFeesProduct,
    IFlightProduct,
    ILateCheckoutProduct,
    ILCBProduct,
    IPromoCodeProduct,
    IPromoPageDetailObject,
    ISeatsProduct,
    ITransferProduct,
    TProduct,
} from 'models/data/tracking/IProduct';
import { IRecommenderEvent } from 'models/data/tracking/IRecommenderEvent';
import { SearchPodGenericValues } from 'models/data/tracking/SearchPodEvent';
import { ApiErrors } from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes, TQuickFilterType } from 'models/enum/FilterGroupCodes';
import { GuestType } from 'models/enum/GuestType';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { OrderBy, RecommendedOrderBy } from 'models/enum/OrderBy';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { OUTBOUND_ROUTE_ID, RouteDirection } from 'models/enum/RouteDirection';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { AmendProductPBPostfix } from 'models/enum/tracking/AmendProductPBPostfix';
import { BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import {
    BrandValues,
    EventActions,
    EventCategories,
    EventLabels,
    GENERIC_CUSTOM_PARAMS_EMPTY,
    PersonalizationNames,
} from 'models/enum/tracking/GenericEventParams';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import { GuestTypes } from 'models/enum/tracking/GuestTypes';
import { OtherRoutesActions } from 'models/enum/tracking/OtherRoutesActions';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories, ProductDimensions, ProductIds, ProductNames } from 'models/enum/tracking/ProductCategories';
import { RecommenderMedium } from 'models/enum/tracking/RecommenderMedium';
import { TrackHelpCentreClickLocation } from 'models/enum/tracking/TrackHelpCentreClickLocation';
import { TransferType } from 'models/enum/transfer/TransferType';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import { OrderCheckoutPayment, SitecoreChannel } from './sitecore/constants';
import { BaseTrackingSearchPodStore } from './BaseTrackingStore.searchPod';

const SEATS_TEST_ID = '104';
const MODULE_ID_INDEX = -10;
const SAFE_RESOLVE_TIMEOUT = 5000;

const SEATS_URGENCY_MESSAGES_EVENT_TYPES = [
    EventTypes.Guest,
    EventTypes.Booking,
    EventTypes.ExtrasSeatUpdate,
    EventTypes.PostBookingConfirmationBasket,
    EventTypes.Extras,
];
const CABIN_BAGS_URGENCY_MESSAGES_EVENT_TYPES = [
    EventTypes.Booking,
    EventTypes.Guest,
    EventTypes.AddLCBForAllPassengers,
    EventTypes.AddToBasket,
    EventTypes.RemoveFromBasket,
    EventTypes.Extras,
];

const SEATS_TOGETHER_CHECKBOX_EVENTS_TYPES = new Set([
    EventTypes.Guest,
    EventTypes.Booking,
    EventTypes.ExtrasSeatUpdate,
]);

export abstract class BaseTrackingStore {
    public pageName: string = ''; // page title with locale f.e. booking page | EN
    public pageTitle: string = ''; // page title without locale
    public pageLoadObject: IPageLoadObject | null = null;
    public minPrice: number = 0;
    public maxPrice: number = 0;
    pageCategory: string = '';
    protected pageLoadLayoutId: string = '';
    searchPod: BaseTrackingSearchPodStore;

    @observable bd4RecommenderTracking: Nullable<IBd4Tracking>;
    @observable bd4RecommenderPlacementId: Nullable<Bd4TravelPlacementId>;
    @observable bd4SortTracking: Nullable<IBd4Tracking>;
    @observable protected isPageLoadEventLoading: boolean = false;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);

        this.searchPod = new BaseTrackingSearchPodStore(rootStore);
    }

    @computed get pageMeta(): IPageMeta {
        return {
            pageCategory: this.pageCategory,
            pageLoadLayoutId: this.pageLoadLayoutId,
            pageName: this.pageName,
            pageTitle: this.pageTitle,
        };
    }

    @computed get defaultGalleryMedia(): string {
        if (this.rootStore.layoutStore.isHotelDetailsBookPage) {
            return getDefaultGalleryMediaContent(!!this.rootStore.bookingStore.selectedOffer?.hotel?.youtubeVideoId);
        }

        if (this.rootStore.layoutStore.isHotelDetailsBrowsePage) {
            return getDefaultGalleryMediaContent(
                !!this.rootStore.layoutStore.layout?.sitecore?.route?.fields?.YoutubeVideoId?.value,
            );
        }

        return '';
    }

    @computed get bookingId(): string | undefined {
        return (
            this.rootStore.viewBookingStore.booking?.bookingReference ??
            this.rootStore.amendPaymentStore.amendPaymentPayload?.bookingReference
        );
    }

    addToDataLayer = (object: TDataLayerObject): void => {
        try {
            if (!isAnalyticsDisabled(object?.pageReferral) && object) {
                dataLayer.push(object);
            }
        } catch (e) {}
    };

    public trackRumPageView = (): void => {
        if (isAnalyticsDisabled() || !envPublic.SPLUNK_RUM_ENABLED) return;

        rum.trackPageView(this.rootStore.layoutStore.templateId);
    };

    setPrices = (): void => {
        const { minPrice, maxPrice } = this.rootStore.hotelsStore;

        if (minPrice) {
            this.minPrice = minPrice;
        }

        if (maxPrice) {
            this.maxPrice = maxPrice;
        }
    };

    @computed get pageLang(): string {
        return getPageLang(this.rootStore.layoutStore.lang);
    }

    public getPageCurrency = async (): Promise<CurrencyCode> => {
        let currency;

        const { isHotelDetailsBookPage, isGuestDetailsPage, isExtrasPage, isPromoPage, isSearchResultsPage } =
            this.rootStore.layoutStore;

        if (isHotelDetailsBookPage || isGuestDetailsPage || isSearchResultsPage || isPromoPage || isExtrasPage) {
            currency = this.rootStore.marketStore.currency;
        }

        if (this.rootStore.layoutStore.isConfirmationPage && shouldTrackPurchase()) {
            await when(() => this.rootStore.bookingStore.isLoadingBookingConfirmationInfo === false);
            currency = this.rootStore.bookingStore.booking?.currency?.code;
        }

        return currency || this.rootStore.marketStore.currency;
    };

    private get trackingPageTitle(): string {
        const { pageFields, isDynamicPromoPage } = this.rootStore.layoutStore;
        const { TrackingPageTitle, HolidayThemes } = pageFields || {};

        if (isDynamicPromoPage) {
            const themeTitle = HolidayThemes[0]?.fields.Name?.value || '';

            return Tokenizer.replaceTokens(TrackingPageTitle?.value, {
                [Tokens.HolidayTheme]: themeTitle,
                [Tokens.Season]: this.rootStore.promoPageStore.getSeasonName() ?? '',
            });
        }

        return TrackingPageTitle?.value;
    }

    public getPageTitle = (): string => this.trackingPageTitle || this.rootStore.metadataStore.metaPageTitle;

    protected getPageCategoryFromLayout = (): string => {
        const { pageFields, isDestinationPage, isHotelDetailsBrowsePage } = this.rootStore.layoutStore;
        const pageCategory = pageFields?.PageCategory?.value || '';
        const prefix = isDestinationPage && !isHotelDetailsBrowsePage ? 'Destination Guide: ' : '';

        return `${prefix}${pageCategory}`;
    };

    trackBookingExtrasUpdate = async (
        event: EventTypes.ExtrasSeatUpdate | EventTypes.ExtrasBagsUpdate,
    ): Promise<void> => {
        const eCommerce = await this.addBookingFlowPageDimension(event);

        this.addToDataLayer(eCommerce);
    };

    trackEventWithParams = async (
        eventType: EventTypes,
        eventParams: IEventParams | IExcursionsEventParams,
        customParams?: ICustomParams,
        isPageLocation?: boolean,
        isPageUrl?: boolean,
        coreParamsOverride?: Partial<ICoreParams>,
    ): Promise<void> => {
        // event should be added only after "pageLoad" event
        await when(
            () =>
                this.isPageLoadEventLoading === false && this.pageLoadLayoutId === this.rootStore.layoutStore.layoutId,
        );
        const coreParams = this.buildCoreParamsObject();

        this.addToDataLayer({
            event: eventType,
            coreParams: {
                ...coreParams,
                ...coreParamsOverride,
            },
            eventParams: {
                ...eventParams,
                ...(isPageLocation && { location: this.pageName }),
                ...(isPageUrl && { url: this.rootStore.layoutStore.fullUrl }),
            },
            customParams: {
                ...customParams,
            },
        });
    };

    trackLCBBanners = (eventLabel: EventLabels): void => {
        const isInteraction = eventLabel === EventLabels.CapacityFullClick;

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Extras,
                eventAction: EventActions.LargeCabinBags,
                eventLabel,
                eventType: isInteraction ? EventTypes.Interaction : EventTypes.NonInteraction,
            },
            generateGenericValues({ destinationUrl: null }),
        );
    };

    // Track Transfer Change on Extras page
    public trackTransferChange = (transfer: ITransfer, eventType: EventTypes): void => {
        const { selectedOffer } = this.rootStore.bookingStore;
        const baseHoliday = this.buildBaseHolidayProduct(selectedOffer, eventType);

        if (baseHoliday) {
            const actionType = eventType === EventTypes.AddToBasket ? 'add' : 'remove';
            const product = this.buildTransferProduct(transfer, eventType, baseHoliday, {
                dimension173: transfer.code,
            });

            this.addToDataLayer({
                event: eventType,
                ecommerce: {
                    currencyCode: baseHoliday?.currencyCode,
                    [actionType]: {
                        product,
                    },
                },
            });
        }
    };

    // Track Large Cabin Bags Change on Extras page
    public trackLCBChange = (
        eventType: EventTypes.AddToBasket | EventTypes.RemoveFromBasket | EventTypes.AddLCBForAllPassengers,
        LCBQuantity: number,
        isRemoveAllLCB: boolean,
    ): void => {
        const { selectedOffer } = this.rootStore.bookingStore;

        const baseHoliday = this.buildBaseHolidayProduct(selectedOffer, eventType);

        if (baseHoliday) {
            const products = this.buildLCBProducts(eventType, baseHoliday, LCBQuantity, isRemoveAllLCB);
            const actionType =
                eventType === EventTypes.AddToBasket || eventType === EventTypes.AddLCBForAllPassengers
                    ? 'add'
                    : 'remove';

            this.addToDataLayer({
                event: eventType,
                dimension136: isRemoveAllLCB ? this.buildPageName(this.getPageTitle()) : this.pageName,
                dimension173: null,
                ecommerce: {
                    currencyCode: baseHoliday.currencyCode,
                    [actionType]: { products },
                },
            });
        }
    };

    trackPostBookingSeatsUpdated = (
        eventType: EventTypes.PostBookingSeatOutBasket | EventTypes.PostBookingSeatInBasket,
        widgetData: ISelectedSeat[],
    ): void => {
        const { booking } = this.rootStore.viewBookingStore;

        if (booking) {
            const widgetSeats = getSelectedSeatsFromWidgetData(widgetData, true);
            const [outboundInfo, inboundInfo] = booking.package.transport.routes;
            const baseHoliday = this.buildBaseHolidayProduct(booking, eventType);
            const isOutbound = eventType === EventTypes.PostBookingSeatOutBasket;

            const seats =
                baseHoliday &&
                this.buildFlightSeatsProducts(
                    eventType,
                    widgetSeats || [],
                    isOutbound ? outboundInfo : inboundInfo,
                    baseHoliday,
                    false,
                    booking.seatSelection,
                );

            const trackObject = {
                event: eventType,
                dimension136: this.pageName,
                ecommerce: {
                    detail: {
                        products: seats,
                    },
                    impressions: [],
                },
            };

            this.addToDataLayer(trackObject);
        }
    };

    trackSeatsAmendment = async (): Promise<void> => {
        const { viewBookingStore } = this.rootStore;

        await when(() => viewBookingStore.isLoading === false);

        const { booking } = viewBookingStore;

        if (booking) {
            const { paymentInfo, seatSelection, bookingReference } = booking;
            const eventType = EventTypes.PostBookingConfirmationBasket;
            const [outboundInfo, inboundInfo] = booking.package.transport.routes;
            const creditPaidAmount = getCreditPaidAmount(paymentInfo) ?? 0;

            const baseHoliday = this.buildBaseHolidayProduct(booking, eventType);

            const seats =
                baseHoliday &&
                this.buildAllSeatsProducts(eventType, seatSelection || [], outboundInfo, inboundInfo, baseHoliday);

            const seatsAmendmentCharges =
                viewBookingStore?.viewBookingPayload?.amendPaymentPayload?.selectedSeats?.amendmentCharges;

            const dimension66 = this.rootStore.viewBookingStore.viewBookingPayload?.dimension66;
            const paymentMethod = this.rootStore.viewBookingStore.viewBookingPayload?.paymentMethod;

            const trackObject = {
                event: eventType,
                dimension136: this.pageName,
                ecommerce: {
                    purchase: {
                        actionField: {
                            event: eventType,
                            id: `${bookingReference}_${Date.now()}_PB_CS`,
                            timestamp: getTimestamp(),
                            revenue: seatsAmendmentCharges || 0,
                            coupon: baseHoliday?.coupon,
                            metric3: creditPaidAmount,
                        },
                        products: seats,
                    },
                },
                dimension66: dimension66 ?? '',
                paymentMethod: paymentMethod ?? '',
            };

            this.addToDataLayer(trackObject);
        }
    };

    getBookingHolidayDetails = (booking: IBookingInfo): IHolidayDetails => {
        const { marketStore, bookingStore } = this.rootStore;
        const { guests, prom, paymentInfo } = booking;
        const { accom, transport } = booking.package;
        const { code, hotel, rooms, isExt, endDate, startDate } = accom;
        const [outboundInfo, inboundInfo] = transport.routes;

        const {
            adults: adultsCount,
            children: childrenCount,
            infants: infantsCount,
        } = getGuestsAmountByType(booking, accom);
        const children = guests.filter(guest => guest.type === GuestType.Child);
        const ancillariesPrice = getAncillariesPrice(booking);
        const pricePP = (paymentInfo.totalPrice - ancillariesPrice) / (adultsCount + childrenCount);

        return {
            id: code,
            hotel,
            rooms,
            adults: adultsCount,
            children: childrenCount,
            infants: infantsCount,
            childrenAge: children.map(child => child.age).join('|'),
            currencyCode: paymentInfo.currency || marketStore.currency,
            pricePP,
            totalPrice: paymentInfo.totalPrice,
            theme: hotel.theme,
            type: hotel.type,
            prom,
            outboundInfo,
            inboundInfo,
            stay: getDaysDifference(new Date(endDate), new Date(startDate)),
            isExt,
            hasDistressedSeats: false,
            freeNightsIncluded: bookingStore.bookingInfoPayload?.freeNightsIncluded || 0,
        };
    };

    getOfferHolidayDetails = (offer: IOffer | IOfferWithoutAltBoards): IHolidayDetails => {
        const { layoutStore, searchStore, marketStore, bookingStore, seatMapStore } = this.rootStore;

        const isSearchResultsOrPromoPage = layoutStore.isSearchResultsPage || layoutStore.isPromoPage;
        const { transport, accom, hotel, currency, stay, isSponsored } = offer;
        const { unit, id, theme, type, prom, isExt } = accom;
        const [outboundInfo, inboundInfo] = transport.routes;

        let ancillariesPrice = seatMapStore.selectedSeatsPrice + bookingStore.extraLuggage.extraLuggagePriceTotal;

        if ('airportParkingStore' in this.rootStore) {
            const { selectedAirportParking } = this.rootStore.airportParkingStore;

            if (selectedAirportParking) {
                ancillariesPrice += selectedAirportParking.bookingDetails.totalPrice;
            }
        }

        const adultsCount = getGuests(unit, GuestTypes.Adults);
        const childrenCount = getGuests(unit, GuestTypes.Children);
        const pricePPWithoutAncillaries = (bookingStore.totalPrice - ancillariesPrice) / (adultsCount + childrenCount);

        return {
            id,
            hotel,
            theme,
            type,
            prom,
            stay,
            isExt,
            outboundInfo,
            inboundInfo,
            isSponsored,
            rooms: unit,
            hasDistressedSeats: false,
            currencyCode: currency?.code || marketStore.currency,
            pricePP: isSearchResultsOrPromoPage ? offer.pricePP : pricePPWithoutAncillaries,
            totalPrice: isSearchResultsOrPromoPage ? offer.price : bookingStore.totalPrice,
            adults: adultsCount,
            children: childrenCount,
            infants: getGuests(unit, GuestTypes.Infants),
            childrenAge: getChildrenAge(searchStore.searchWho.roomsAllocation),
            freeNightsIncluded: getFreeNightsIncludedInOffer(offer),
        };
    };

    protected getIsFreeForKids = (rooms: Array<IUnit | IRoom>): number => (checkRoomsOnFreeForKids(rooms) ? 1 : 0);

    buildCoreParamsObject = (): Nullable<ICoreParams> => {
        if (!this.pageLoadObject) return null;

        return {
            pageName: this.pageLoadObject.pageName,
            pageCategory: this.pageLoadObject.pageCategory,
            pageReferral: this.pageLoadObject.pageReferral,
            currencyCode: this.pageLoadObject.currencyCode,
            businessType: this.pageLoadObject.dimension3,
            businessChannel: this.pageLoadObject.dimension2,
            pageLanguage: this.pageLoadObject.dimension6,
            pageUrl: this.pageLoadObject.dimension7,
            screenOrientation: this.pageLoadObject.dimension8,
            responsivePagebreakView: this.pageLoadObject.dimension9,
            referralPageName: this.pageLoadObject.dimension10,
            referralPageCategory: this.pageLoadObject.dimension11,
            timestamp: getTimestamp(),
            siteVersion: this.pageLoadObject.dimension5,
            loggedInStatus: this.pageLoadObject.dimension92,
            environment: this.pageLoadObject.dimension4,
            testVariant: this.pageLoadObject.dimension12,
            userId: this.pageLoadObject.dimension1,
            ShortlistsPerUser: this.pageLoadObject.dimension95,
        };
    };

    protected buildProductPromoCodeDimensions = (): IPromoCodeProduct => {
        const { isConfirmationPage, isHotelDetailsBookPage } = this.rootStore.layoutStore;
        const { bookingInfoPayload, booking, promoCode, priceBreakdown } = this.rootStore.bookingStore;
        const [promoCodeCalculated, priceBreakdownCalculated] = isConfirmationPage
            ? [bookingInfoPayload?.promoCode, booking?.priceBreakdown]
            : [promoCode?.value, priceBreakdown];

        /** Coupon dimension should be blank on HotelDetails Page  */
        const coupon = promoCodeCalculated && !isHotelDetailsBookPage ? promoCodeCalculated : '';

        return {
            coupon,
            dimension63: coupon,
            dimension64: coupon ? getPromoCodeAmount(priceBreakdownCalculated) : 0,
            dimension65: coupon ? 'Manual' : '',
        };
    };

    buildBaseHolidayProduct = (
        data: Nullable<IOffer | IOfferWithoutAltBoards | IBookingInfo>,
        eventType: EventTypes,
        index?: number,
        customParams?: object,
        withConfirmationData?: boolean,
    ): Nullable<IBaseHolidayProduct> => {
        if (!data) return null;

        const { isConfirmationPage, isSearchResultsPage, isPromoPage, isHotelDetailsBookPage } =
            this.rootStore.layoutStore;
        const holiday: IHolidayDetails =
            'package' in data ? this.getBookingHolidayDetails(data) : this.getOfferHolidayDetails(data);
        const isLuxuryHoliday = containsLuxuryPromoCode(data.promoCollections);

        const baseHoliday: IBaseHolidayProduct = {
            dimension108: eventType,
            category: ProductCategories.BaseHoliday,
            name: holiday.hotel?.name || '',
            id: holiday.id,
            quantity: holiday.adults + holiday.children,
            price: holiday.pricePP,
            variant: holiday.theme?.itemName || holiday.theme?.name || '',
            brand: isLuxuryHoliday ? BrandValues.LuxuryCollection : getBrand(holiday.type, holiday.prom),
            currencyCode: holiday.currencyCode,
            ...this.buildProductPromoCodeDimensions(),
            dimension13: getTimestamp(),
            dimension15: holiday.totalPrice,
            dimension19: holiday.outboundInfo?.depPt,
            dimension21: holiday.outboundInfo?.arrPt,
            dimension23: holiday.hotel?.country?.itemName || holiday.hotel?.country?.name || '',
            dimension24: holiday.hotel?.country?.code || '',
            dimension25: holiday.hotel?.location?.itemName || holiday.hotel?.location?.name || '',
            dimension26: holiday.hotel?.location?.code || '',
            dimension27: holiday.hotel?.resort?.itemName || holiday.hotel?.resort?.name || '',
            dimension28: holiday.hotel?.resort?.code || '',
            dimension35: formatDateL10n(holiday.outboundInfo.depDate, DATE_FORMATS.query),
            dimension42: formatDateL10n(holiday.inboundInfo.depDate, DATE_FORMATS.query),
            dimension47: holiday.stay,
            dimension49: holiday.adults + holiday.children,
            dimension51: holiday.adults,
            dimension52: holiday.children,
            dimension53: holiday.infants,
            dimension54: holiday.rooms.length,
            dimension56: getBoardsTypes(holiday.rooms),
            dimension57: holiday.hotel?.starRating ? Number.parseInt(holiday.hotel.starRating) : '',
            dimension58: holiday.hotel?.rating || '',
            dimension71: convertToYesNoString(holiday.hasDistressedSeats),
            dimension73: 'Refundable',
            dimension78: this.getIsFreeForKids(holiday.rooms),
            dimension79: holiday.childrenAge,
            dimension172: holiday.freeNightsIncluded,
            dimension183: !!holiday.hotel?.ecoFacility?.name,
            ...customParams,
        };

        if (holiday.isSponsored) {
            baseHoliday.dimension82 = 'Sponsored';
        }

        if (!isConfirmationPage) {
            const { searchWhen, page, take } = this.rootStore.searchStore;
            const { flexDays, isFlexible } = searchWhen;

            baseHoliday.position = getPosition(index || 0, page, take);
            baseHoliday.dimension34 = getDepartureDateFlexibility(flexDays, isFlexible);
            baseHoliday.dimension61 = this.rootStore.hotelsStore.numberOfHotels;
            baseHoliday.dimension75 = this.getSortValue();
            baseHoliday.dimension76 = 'Default';
        }

        if (
            isSearchResultsPage &&
            eventType !== EventTypes.ProductClick &&
            eventType !== EventTypes.OffersPriceViewChange
        ) {
            baseHoliday.dimension162 = convertToYesNoString(this.rootStore.searchStore.searchTo.isAnywhereSelected);
        }

        if (isHotelDetailsBookPage || isConfirmationPage) {
            baseHoliday.dimension186 = holiday.hotel?.giataCode ?? '';
        }

        if (
            !(isSearchResultsPage || isPromoPage) ||
            eventType === EventTypes.ProductClick ||
            eventType === EventTypes.OffersPriceViewChange
        ) {
            baseHoliday.dimension16 = '';
            baseHoliday.dimension17 = getSeatCategory(holiday.outboundInfo.isExt);
            baseHoliday.dimension137 = getSeatCategory(holiday.inboundInfo.isExt);
            baseHoliday.dimension18 = holiday.outboundInfo.depItemName || holiday.outboundInfo.depName;
            baseHoliday.dimension20 = holiday.outboundInfo.arrItemName || holiday.outboundInfo.arrName;
            baseHoliday.dimension36 = formatDateL10n(holiday.outboundInfo.depDate, DATE_FORMATS.yearMonthFormat);
            baseHoliday.dimension37 = getSeason(holiday.outboundInfo.depDate);
            baseHoliday.dimension38 = formatDateL10n(holiday.outboundInfo.depDate, DATE_FORMATS.time);
            baseHoliday.dimension40 = getDaysDifferenceRoundedFloor(new Date(holiday.outboundInfo.depDate), new Date());
            baseHoliday.dimension43 = formatDateL10n(holiday.inboundInfo.depDate, DATE_FORMATS.yearMonthFormat);
            baseHoliday.dimension44 = getSeason(holiday.inboundInfo.depDate);
            baseHoliday.dimension45 = formatDateL10n(holiday.inboundInfo.depDate, DATE_FORMATS.time);
            baseHoliday.dimension50 = getPassengerConfig(holiday.adults, holiday.children, holiday.infants);
            baseHoliday.dimension55 = getRoomsTypesTitles(holiday.rooms);
            baseHoliday.dimension59 = this.minPrice;
            baseHoliday.dimension60 = this.maxPrice;
            baseHoliday.dimension77 = getHotelContractType(holiday.isExt, holiday.id);
            baseHoliday.dimension83 = holiday.outboundInfo.fltNo;
            baseHoliday.dimension84 = holiday.inboundInfo.fltNo;

            if (eventType === EventTypes.OffersPriceViewChange) {
                baseHoliday.dimension74 = this.rootStore.layoutStore.isOffersPriceViewTotal ? 'Total' : 'Per Person';
                baseHoliday.dimension108 = EventTypes.OffersPriceViewChange;
            }

            if (isConfirmationPage || withConfirmationData) {
                const { dimension19, dimension21 } = baseHoliday;

                baseHoliday.dimension81 = getHotelFacilities(holiday.hotel);
                baseHoliday.dimension85 = [dimension19, dimension21].join('|');
            } else {
                const {
                    searchFrom: { origins = [] },
                    searchTo: { selectedDestinations, selectedDestinationCodes },
                } = this.rootStore.searchStore;
                /*  If some pages (e.g. Guest Details/Extras) are opened directly by url (or just refresh page),
                    selectedDestinations will be empty. So need use codes instead.
                */
                baseHoliday.dimension22 = selectedDestinations
                    ? getDestinationLevels(selectedDestinations)
                    : getDestinationLevelsByCodes(selectedDestinationCodes);
                baseHoliday.dimension29 = convertToYesNoString(origins.length > 1);
                baseHoliday.dimension30 = origins.length;
                baseHoliday.dimension31 = convertToYesNoString(selectedDestinationCodes.length > 1);
                baseHoliday.dimension32 = selectedDestinationCodes.length;
                baseHoliday.dimension33 = ProductDimensions.DateLevel;
                baseHoliday.dimension41 = ProductDimensions.DateLevel;
            }
        } else {
            baseHoliday.list = this.pageName;
        }

        return baseHoliday;
    };

    buildUrgencyMessagingDimensions = (
        eventType: EventTypes,
        rooms: IUnit[] | IRoom[],
    ): IUrgencyMessagingDimensions => {
        const urgencyMessage: string[] = [];

        // Rooms
        const { getPhrase, getSetting } = this.rootStore.layoutStore;
        const roomsUrgencyMessage = getRoomsUrgencyMessage(rooms[0].avail, getPhrase, getSetting);
        urgencyMessage[0] = roomsUrgencyMessage == '' ? 'null' : roomsUrgencyMessage;
        const roomTitle = getRoomsTypesTitles(rooms);

        const cabinAndSeatsUrgencyMessageEvents = [
            ...new Set([...CABIN_BAGS_URGENCY_MESSAGES_EVENT_TYPES, ...SEATS_URGENCY_MESSAGES_EVENT_TYPES]),
        ];

        if (cabinAndSeatsUrgencyMessageEvents.includes(eventType)) {
            // Seats
            urgencyMessage[1] = getSeatsUrgencyMessage() ?? 'null';

            // Cabin bags
            urgencyMessage[2] = getCabinBagsUrgencyMessage() ?? 'null';
        }

        return {
            dimension55: roomTitle,
            dimension89: urgencyMessage.join(' | '),
        };
    };

    protected getSortValue = (): string => {
        const { orderBy, orderDirection } = this.rootStore.searchStore;

        if (orderBy && orderBy !== OrderBy.Recommended) {
            return `${orderBy}: ${orderDirection}`;
        }

        // "Recommended" sort by bd4 is applied if bd4 returns pToken and there are no errors (i.e no apiMessage).
        // If there are no results at all, also consider that it's sort by bd4.
        if (
            (this.bd4SortTracking?.pToken && !this.bd4SortTracking?.apiMessage) ||
            !this.rootStore.hotelsStore.hasHotels
        ) {
            return RecommendedOrderBy.Bd4;
        }

        return RecommendedOrderBy.Atcom;
    };

    protected buildPromoPageDetailObject = (offers: IOffer[], eventType: EventTypes): IPromoPageDetailObject => {
        const {
            searchFrom: { origins = [] },
            originsWithNames,
            searchTo: { selectedDestinations },
            page,
            take,
        } = this.rootStore.searchStore;
        const units: IUnit[] = offers.flatMap(offer => [...offer.accom.unit]);
        const promoPageDetailObject: IPromoPageDetailObject = {
            dimension108: eventType,
            dimension18: getDepartureAirportsNames(origins, originsWithNames),
            dimension19: origins.join('|'),
            dimension20: getOffersDestinationAirportsNames(offers),
            dimension21: getOffersDestinationAirportsCodes(offers),
            dimension22: getDestinationLevels(selectedDestinations),
            dimension56: getBoardsTypes(units),
            dimension57: getOffersStarRatings(offers),
            dimension61: this.rootStore.hotelsStore.numberOfHotels,
            dimension62: getFirstPositionOnPage(page, take),
            dimension75: this.getSortValue(),
            brand: getOffersBrands(offers),
        };

        if (eventType === EventTypes.SearchFilterUpdate || eventType === EventTypes.PromoPageFilterUpdate) {
            this.addBd4DimensionsToObject(promoPageDetailObject);
        }

        return promoPageDetailObject;
    };

    buildBagsBookingFlowProducts = (
        routes: IRoute[],
        luggage: ILuggageTrackingProductItem[],
        baseHoliday: IBaseHolidayProduct,
        isExt: boolean,
    ): IBagsProduct[] => {
        if (!luggage.length) {
            return [];
        }

        const { seatMapStore } = this.rootStore;

        const [outboundInfo, inboundInfo] = routes;
        const dimension77 = getHotelContractType(isExt, baseHoliday.id);
        const dimension182 = `${getFlightNumberWithCarNumber(outboundInfo)}|${getFlightNumberWithCarNumber(
            inboundInfo,
        )}`;
        const {
            dimension108,
            variant,
            brand,
            currencyCode,
            coupon,
            dimension64,
            dimension19,
            dimension21,
            dimension23,
            dimension25,
            dimension27,
            dimension35,
            dimension42,
            dimension54,
            dimension56,
            dimension57,
            dimension58,
            dimension78,
            dimension172,
            dimension183,
            dimension16,
            dimension17,
            dimension37,
            dimension38,
            dimension44,
            dimension45,
            dimension50,
            dimension55,
            dimension83,
            dimension84,
        } = baseHoliday;

        return luggage.map(({ routeId, title, quantity, price }) => {
            const isOutbound = routeId === OUTBOUND_ROUTE_ID;
            const direction = isOutbound ? 'Outbound' : 'Inbound';
            const route = isOutbound ? outboundInfo : inboundInfo;
            const aircraftType = seatMapStore.getFlightAircraftType(route);

            return {
                dimension108,
                category: `${ProductCategories.Bags}: ${direction}`, // category name
                name: title, // product name
                id: `${title}_${baseHoliday.id}`, // product sku, product name and hotel id
                quantity, // number of bags
                price, // Price per bag (single price)
                variant,
                brand,
                currencyCode,
                coupon,
                dimension64,
                dimension19,
                dimension21,
                dimension23,
                dimension25,
                dimension27,
                dimension35,
                dimension42,
                dimension54,
                dimension56,
                dimension57,
                dimension58,
                dimension78,
                dimension172,
                dimension183,
                dimension16,
                dimension17,
                dimension37,
                dimension38,
                dimension44,
                dimension45,
                dimension50,
                dimension55,
                dimension83,
                dimension84,
                dimension77, // hotel contract type
                dimension181: aircraftType?.name || '', // aircraft Type
                dimension182, // initial flight number,
            };
        });
    };

    protected buildSeatsPostBookingFlowProducts = (
        flightNumber: string,
        flightSeats: ISelectedSeat,
        direction: string,
        baseHoliday: IBaseHolidayProduct,
        aircraftTypeName: string,
        isAmend: boolean,
        prevSeatsFromBooking?: ISelectedSeat[],
    ): ISeatsProduct[] => {
        const { amendPaymentPayload } = this.rootStore.viewBookingStore.viewBookingPayload || {};
        const prevSeatsFromAmendPaymentPayload = amendPaymentPayload?.selectedSeats?.prevSeatSelection;
        const previousSeatSelection = prevSeatsFromBooking || prevSeatsFromAmendPaymentPayload;

        if (!previousSeatSelection) {
            return [];
        }

        const products: ISeatsProduct[] = [];
        const prevFlightSeats = previousSeatSelection.find(
            flight => !!flightNumber && flight.flightNumber === flightNumber,
        );
        const newSeats = flightSeats?.seats || [];
        const prevSeats = prevFlightSeats?.seats || [];

        const seatsByCategory = groupSeatsByActionType(newSeats, prevSeats);
        /** Taking price from payload as it show price difference between previous seat and new one,  not actual seat price */
        const getAmendSeatPrice = (seatNumber: string): number => {
            const { newSeatSelection } =
                this.rootStore.viewBookingStore.viewBookingPayload?.amendPaymentPayload?.selectedSeats || {};
            const seats = newSeatSelection?.find(flight => flight.flightNumber === flightNumber)?.seats || [];

            return seats.find(s => s.seatNumber === seatNumber)?.price || 0;
        };

        /* Taking calculated earlier price diff as 'prevSeatPrice - newSeatPrice'
        when seats only selected but not finally amended to the booking and we have no amendPaymentPayload */
        const getUpdatedSeatPrice = (seat: ISelectedSeatDetails, actionPostfix: AmendProductPBPostfix): number => {
            if (actionPostfix === AmendProductPBPostfix.ADD) {
                return seat.price || 0;
            }

            return seat.priceDiff || 0;
        };

        // Build separate product for each category
        for (const [actionPostfix, seats] of Object.entries(seatsByCategory) as [
            AmendProductPBPostfix,
            ISelectedSeatDetails[],
        ][]) {
            const seatsByPriceBand = groupArrayByKey(seats, 'priceBand');
            const categoryName = `Seats: ${direction}_${actionPostfix}`;

            for (const [priceBand, seats] of Object.entries(seatsByPriceBand) as [string, ISelectedSeatDetails[]][]) {
                const name = `${priceBand}_${actionPostfix}`; // Standard_add_PB

                const seatsByPriceDiff = seats.reduce((acc, s) => {
                    const priceDiff = isAmend ? getAmendSeatPrice(s.seatNumber) : getUpdatedSeatPrice(s, actionPostfix);

                    if (!acc[priceDiff]) {
                        acc[priceDiff] = [];
                    }

                    acc[priceDiff].push(s);

                    return acc;
                }, {});

                for (const [priceDiff, seats] of Object.entries(seatsByPriceDiff) as [
                    string,
                    ISelectedSeatDetails[],
                ][]) {
                    const id = `${seats.map(s => s.seatNumber).join('|')}_${actionPostfix}`; // 6D|6E_add_PB

                    products.push({
                        ...baseHoliday,
                        category: categoryName,
                        name,
                        id,
                        quantity: seats.length,
                        price: Number(priceDiff),
                        dimension181: aircraftTypeName,
                    });
                }
            }
        }

        return products;
    };

    buildFlightSeatsProducts = (
        eventType: EventTypes | null,
        selectedSeats: ISelectedSeat[],
        route: IRoute,
        baseHoliday: IBaseHolidayProduct,
        isAmend: boolean = true,
        prevSelectedSeats?: ISelectedSeat[],
    ): ISeatsProduct[] => {
        const flightNumber = getFlightDigitalNumber(route);
        const flightSeats = selectedSeats.find(flight => !!flightNumber && flight.flightNumber === flightNumber);

        if (!flightSeats?.seats?.length) return [];

        const { seatMapStore, layoutStore } = this.rootStore;

        const aircraftTypeName = seatMapStore.getFlightAircraftType(route)?.name || '';
        const direction = route.direction === RouteDirection.Outbound ? 'Outbound' : 'Return';

        if (layoutStore.isViewBookingPage) {
            return this.buildSeatsPostBookingFlowProducts(
                flightNumber,
                flightSeats,
                direction,
                baseHoliday,
                aircraftTypeName,
                isAmend,
                prevSelectedSeats,
            );
        }

        return this.buildSeatsBookingFlowProducts(eventType, flightSeats, direction, baseHoliday, aircraftTypeName);
    };

    protected buildSeatsBookingFlowProducts = (
        eventType: EventTypes | null,
        flightSeats: ISelectedSeat,
        direction: string,
        baseHoliday: IBaseHolidayProduct,
        aircraftTypeName: string,
    ): ISeatsProduct[] => {
        const seatsByPriceBand = groupArrayByKey(flightSeats.seats || [], 'priceBand');
        const products: ISeatsProduct[] = [];

        // Build separate product for each price band
        for (const seats of Object.values(seatsByPriceBand)) {
            const priceBand = seats[0].priceBand || SeatType.Standard;

            const seatsByPrice = seats.reduce((acc, s) => {
                const price = s.price || 0;

                if (!acc[price]) {
                    acc[price] = [];
                }

                acc[price].push(s);

                return acc;
            }, {});

            for (const [price, seats] of Object.entries(seatsByPrice) as [string, ISelectedSeatDetails[]][]) {
                const id = seats.map(s => s.seatNumber).join('|'); // 6D|6E

                const webStorageKey =
                    direction === 'Outbound'
                        ? WebStorageKeys.SeatTogetherCheckboxDeparture
                        : WebStorageKeys.SeatTogetherCheckboxReturn;

                const dimension187 = this.getDimension187(
                    eventType,
                    getWebStorageItem<TSeatTogetherCheckbox>(webStorageKey, false, sessionStorage),
                );

                products.push({
                    ...baseHoliday,
                    category: `${ProductCategories.Seats}: ${direction}`,
                    name: priceBand,
                    id,
                    quantity: seats.length,
                    price: Number(price),
                    dimension181: aircraftTypeName,
                    ...(dimension187 ? { dimension187 } : {}),
                });
            }
        }

        return products;
    };

    private readonly isSitTogetherTrackingEvent = (eventType: EventTypes | null): boolean => {
        if (!eventType) {
            return false;
        }

        return SEATS_TOGETHER_CHECKBOX_EVENTS_TYPES.has(eventType);
    };

    getDimension188 = (eventType: EventTypes | null): TSeatTogetherCheckbox | null => {
        let dimension188: TSeatTogetherCheckbox | null = null;

        if (this.isSitTogetherTrackingEvent(eventType)) {
            const seatTogetherCheckboxDeparture = getWebStorageItem<TSeatTogetherCheckbox>(
                WebStorageKeys.SeatTogetherCheckboxDeparture,
                false,
                sessionStorage,
            );
            const seatTogetherCheckboxReturn = getWebStorageItem<TSeatTogetherCheckbox>(
                WebStorageKeys.SeatTogetherCheckboxReturn,
                false,
                sessionStorage,
            );

            if (seatTogetherCheckboxDeparture === 'unavailable' && seatTogetherCheckboxReturn === 'unavailable') {
                dimension188 = 'unavailable';
            } else if (seatTogetherCheckboxDeparture === 'checked' || seatTogetherCheckboxReturn === 'checked') {
                dimension188 = 'checked';
            } else {
                dimension188 = 'unchecked';
            }
        }

        return dimension188;
    };

    getDimension187 = (
        eventType: EventTypes | null,
        seatTogetherCheckboxValue: TSeatTogetherCheckbox | undefined,
    ): TSeatTogetherCheckbox | null =>
        this.isSitTogetherTrackingEvent(eventType) && seatTogetherCheckboxValue ? seatTogetherCheckboxValue : null;

    clearSitTogetherSessionStorage = (): void => {
        removeWebStorageItem(WebStorageKeys.SeatTogetherCheckboxDeparture, sessionStorage);
        removeWebStorageItem(WebStorageKeys.SeatTogetherCheckboxReturn, sessionStorage);
    };

    buildAllSeatsProducts = (
        eventType: EventTypes,
        selectedSeats: ISelectedSeat[],
        outboundInfo: IRoute,
        inboundInfo: IRoute,
        baseHoliday: IBaseHolidayProduct,
    ): ISeatsProduct[] => {
        if (!selectedSeats.length) return [];

        const baseHolidayWithSeatsUrgencyMessage = this.buildBaseHolidayWithSeatsUrgencyMessage(baseHoliday, eventType);
        const seatsOutbound = this.buildFlightSeatsProducts(
            eventType,
            selectedSeats,
            outboundInfo,
            baseHolidayWithSeatsUrgencyMessage,
        );
        const seatsInbound = this.buildFlightSeatsProducts(
            eventType,
            selectedSeats,
            inboundInfo,
            baseHolidayWithSeatsUrgencyMessage,
        );

        return [...seatsOutbound, ...seatsInbound];
    };

    private readonly buildBaseHolidayWithSeatsUrgencyMessage = (
        baseHoliday: IBaseHolidayProduct,
        eventType: EventTypes,
    ): IBaseHolidayProduct => {
        const { dimension89, ...baseHolidayWithoutDimension89 } = baseHoliday;

        return {
            ...baseHolidayWithoutDimension89,
            ...(SEATS_URGENCY_MESSAGES_EVENT_TYPES.includes(eventType)
                ? { dimension89: getSeatsUrgencyMessage() ?? 'null' }
                : {}),
        };
    };

    buildLateCheckoutHolidayProduct = (
        lateCheckout: Nullable<ILateRoomCheckout>,
        eventType: EventTypes,
        baseHoliday: Nullable<IBaseHolidayProduct>,
        extraDimensions?: Partial<ILateCheckoutProduct>,
    ): Nullable<ILateCheckoutProduct> => {
        if (!baseHoliday || !lateCheckout) return null;

        const {
            variant,
            brand,
            currencyCode,
            dimension15,
            dimension23,
            dimension35,
            dimension37,
            dimension38,
            dimension47,
            dimension50,
        } = baseHoliday;

        return {
            dimension108: eventType,
            category: ProductCategories.HotelExtras,
            name: lateCheckout.name || '',
            id: ProductIds.LateCheckout,
            price: lateCheckout.price || 0,
            quantity: 1,
            variant,
            brand,
            currencyCode,
            dimension15,
            dimension23,
            dimension35,
            dimension37,
            dimension38,
            dimension47,
            dimension50,
            dimension85: lateCheckout.code,
            ...extraDimensions,
        };
    };

    protected buildFlightProduct = (
        category:
            | ProductCategories.FlightDeparture
            | ProductCategories.FlightReturn
            | ProductCategories.FlightOutboundPB
            | ProductCategories.FlightInboundPB,
        route: IRoute,
        baseHoliday: IBaseHolidayProduct,
        overrideParameters = {},
        isPostBooking?: boolean,
    ): IFlightProduct => {
        const { isConfirmationPage } = this.rootStore.layoutStore;
        const seatDimension = category === ProductCategories.FlightDeparture ? 'dimension17' : 'dimension137';
        const postBookingPostfix = isPostBooking ? '_PB' : '';
        const {
            dimension108,
            quantity,
            variant,
            brand,
            revenue,
            dimension15,
            dimension13,
            dimension29,
            dimension30,
            dimension31,
            dimension32,
            dimension33,
            dimension71,
            currencyCode,
        } = baseHoliday;
        const { depPt, arrPt, fltNo, isExt, depItemName, depName, arrItemName, arrName, depDate } = route;

        /** Properties order is important. */
        return {
            dimension108,
            category,
            name: `${depPt}-${arrPt}${postBookingPostfix}`,
            id: fltNo + postBookingPostfix,
            price: 0,
            quantity,
            variant,
            brand,
            ...(isConfirmationPage && { revenue }),
            currencyCode,
            dimension15,
            dimension13,
            [seatDimension]: getSeatCategory(isExt),
            dimension18: depItemName || depName || '',
            dimension19: depPt,
            dimension20: arrItemName || arrName || '',
            dimension21: arrPt,
            ...(!isConfirmationPage && { dimension29, dimension30, dimension31, dimension32, dimension33 }),
            dimension35: formatDateL10n(depDate, DATE_FORMATS.query),
            dimension36: formatDateL10n(depDate, DATE_FORMATS.yearMonthFormat),
            dimension37: getSeason(depDate),
            dimension38: formatDateL10n(depDate, DATE_FORMATS.time),
            dimension40: getDaysDifferenceRoundedFloor(new Date(depDate), new Date()),
            dimension71,
            dimension83: fltNo,
            ...overrideParameters,
        };
    };

    protected buildFlightsProducts = (
        outboundInfo: IRoute,
        inboundInfo: IRoute,
        baseHoliday: IBaseHolidayProduct,
    ): IFlightProduct[] => {
        const flightDeparture = this.buildFlightProduct(ProductCategories.FlightDeparture, outboundInfo, baseHoliday);
        const flightReturn = this.buildFlightProduct(ProductCategories.FlightReturn, inboundInfo, baseHoliday);

        return [flightDeparture, flightReturn];
    };

    buildFeesAnalyticProduct = (fees: IFeePerPerson): IFeesProduct => ({
        dimension108: EventTypes.Purchase,
        category: 'Fees',
        name: 'Change Fee',
        id: 'Fees',
        price: fees.feesPerPersonAmount,
        quantity: fees.feesCount,
    });

    buildProducts = (
        offer: Nullable<IOffer | IOfferWithoutAltBoards>,
        index: number,
        eventType: EventTypes,
    ): TProduct[] => {
        if (!offer) {
            return [];
        }

        const { layoutStore, seatMapStore, bookingStore, flightsPassengersStore } = this.rootStore;
        const { isExtrasPage } = layoutStore;

        const baseHoliday = {
            ...this.buildBaseHolidayProduct(offer, eventType, index)!,
            ...this.buildUrgencyMessagingDimensions(eventType, offer.accom.unit),
        };

        const [outboundInfo, inboundInfo] = offer.transport.routes;
        const flights = this.buildFlightsProducts(outboundInfo, inboundInfo, baseHoliday);
        const seats = this.buildAllSeatsProducts(
            eventType,
            toJS(seatMapStore.validatedSelectedSeats),
            outboundInfo,
            inboundInfo,
            baseHoliday,
        );

        let products: (IBagsProduct | ITransferProduct | IFlightProduct | ISeatsProduct | ILCBProduct)[] = [
            baseHoliday,
            ...flights,
            ...seats,
        ];

        if (
            eventType === EventTypes.Guest ||
            eventType === EventTypes.Extras ||
            eventType === EventTypes.ExtrasSeatUpdate ||
            eventType === EventTypes.ExtrasBagsUpdate
        ) {
            const { LCBCount } = flightsPassengersStore;

            if (LCBCount) {
                const lcbProducts = this.buildLCBProducts(eventType, baseHoliday, LCBCount);

                products = products.concat(lcbProducts);
            }
        }

        if (isExtrasPage) {
            const defaultTransfer = this.buildTransferProduct(bookingStore.transfer, eventType, baseHoliday);
            defaultTransfer && products.push(defaultTransfer);

            if (bookingStore.isFlightExternal) {
                const bagsSelection = bookingStore.extraLuggage.getExtraLuggageProductsForTracking();
                const bags = this.buildBagsBookingFlowProducts(
                    offer.transport.routes,
                    bagsSelection,
                    baseHoliday,
                    offer.accom.isExt,
                );

                products = products.concat(bags);
            }
        }

        if ('airportParkingStore' in this.rootStore) {
            const { selectedAirportParking } = this.rootStore.airportParkingStore;

            if (selectedAirportParking) {
                const airportParkingProduct = this.buildAirportParkingProduct(
                    selectedAirportParking,
                    eventType,
                    baseHoliday,
                );

                products = products.concat(airportParkingProduct);
            }
        }

        return products;
    };

    buildAirportParkingProduct = (
        airportParking: IAirportParking,
        eventType: EventTypes,
        baseHoliday: IBaseHolidayProduct,
    ): IAirportParkingProduct => {
        const {
            title,
            bookingDetails: { totalPrice, productCode, type },
        } = airportParking;

        const { bookingStore } = this.rootStore;
        const airportName = bookingStore.outboundFlight?.depName || '';

        const {
            currencyCode,
            coupon,
            dimension63,
            dimension64,
            dimension19,
            dimension21,
            dimension23,
            dimension25,
            dimension27,
            dimension35,
            dimension42,
            dimension54,
            dimension56,
            dimension57,
            dimension58,
            dimension78,
            dimension172,
            dimension183,
            dimension16,
            dimension17,
            dimension37,
            dimension38,
            dimension44,
            dimension45,
            dimension50,
            dimension55,
            dimension83,
            dimension84,
            dimension65,
            dimension13,
            dimension15,
            dimension24,
            dimension26,
            dimension28,
            dimension47,
            dimension49,
            dimension51,
            dimension52,
            dimension53,
            dimension71,
            dimension73,
            dimension79,
            dimension34,
            dimension61,
            dimension75,
            dimension76,
            dimension137,
            dimension18,
            dimension20,
            dimension36,
            dimension40,
            dimension43,
            dimension59,
            dimension60,
            dimension77,
            dimension22,
            dimension29,
            dimension30,
            dimension31,
            dimension32,
            dimension33,
            dimension41,
            dimension89,
            variant,
            brand,
        } = baseHoliday;

        return {
            dimension108: eventType,
            category: ProductCategories.ExternalExtras,
            name: ProductNames.AirportParking,
            id: ProductCategories.ExternalExtras,
            price: totalPrice,
            quantity: 1,
            item_generic_1: [title, productCode, type].join('|'),
            item_generic_2: airportName,
            variant,
            brand,
            currencyCode,
            coupon,
            dimension63,
            dimension64,
            dimension65,
            dimension13,
            dimension15,
            dimension19,
            dimension21,
            dimension23,
            dimension24,
            dimension25,
            dimension26,
            dimension27,
            dimension28,
            dimension35,
            dimension42,
            dimension47,
            dimension49,
            dimension51,
            dimension52,
            dimension53,
            dimension54,
            dimension56,
            dimension57,
            dimension58,
            dimension71,
            dimension73,
            dimension78,
            dimension79,
            dimension172,
            dimension183,
            position: 1,
            dimension34,
            dimension61,
            dimension75,
            dimension76,
            dimension16,
            dimension17,
            dimension137,
            dimension18,
            dimension20,
            dimension36,
            dimension37,
            dimension38,
            dimension40,
            dimension43,
            dimension44,
            dimension45,
            dimension50,
            dimension55,
            dimension59,
            dimension60,
            dimension77,
            dimension83,
            dimension84,
            dimension22,
            dimension29,
            dimension30,
            dimension31,
            dimension32,
            dimension33,
            dimension41,
            dimension89,
        };
    };

    buildTransferProduct = (
        transfer: Nullable<ITransfer>,
        eventType: EventTypes,
        baseHoliday: Nullable<IBaseHolidayProduct>,
        extraDimensions?: Partial<ITransferProduct>,
    ): Nullable<ITransferProduct> => {
        if (!transfer || !baseHoliday) return null;

        const {
            quantity,
            variant,
            brand,
            currencyCode,
            dimension15,
            dimension23,
            dimension35,
            dimension37,
            dimension38,
            dimension47,
            dimension50,
        } = baseHoliday;

        return {
            dimension108: eventType,
            category: ProductCategories.Transfers,
            name: transfer.type === TransferType.NoTransfer ? ProductNames.NoTransfer : transfer.name,
            id: ProductIds.Transfer,
            price: Math.max(transfer.pricePP, 0),
            quantity,
            variant,
            brand,
            currencyCode,
            dimension15,
            dimension23,
            dimension35,
            dimension37,
            dimension38,
            dimension47,
            dimension50,
            dimension85: transfer.code,
            ...extraDimensions,
        };
    };

    buildLCBProduct = (
        eventType:
            | EventTypes.AddToBasket
            | EventTypes.RemoveFromBasket
            | EventTypes.AddLCBForAllPassengers
            | EventTypes.Guest
            | EventTypes.Booking
            | EventTypes.Extras
            | EventTypes.ExtrasSeatUpdate
            | EventTypes.ExtrasBagsUpdate,
        baseHoliday: IBaseHolidayProduct,
        isOutbound: boolean,
        LCBQuantity: number,
        isRemoveAllLCB?: boolean,
        extraDimensions?: Partial<ILCBProduct>,
    ): Nullable<ILCBProduct> => {
        const { bookingStore } = this.rootStore;

        if (!bookingStore.extraLuggage) return null;

        const { selectedOffer, booking } = bookingStore;
        const [outboundInfo, inboundInfo] =
            selectedOffer?.transport?.routes || booking?.package?.transport?.routes || [];
        const route = isOutbound ? outboundInfo : inboundInfo;
        const { depPt, arrPt, fltNo, depItemName, depName, arrItemName, arrName, depDate } = route || {};
        const {
            variant,
            brand,
            currencyCode,
            dimension15,
            dimension13,
            dimension17,
            dimension137,
            dimension23,
            dimension29,
            dimension30,
            dimension31,
            dimension32,
            dimension33,
            dimension47,
            dimension50,
            dimension71,
        } = baseHoliday;

        const price = bookingStore.extraLuggage.getLargeCabinBagsPriceByRoute(isOutbound) || 0;

        const LCBProduct: ILCBProduct = {
            dimension108: eventType,
            category: isOutbound ? ProductCategories.LCBOutbound : ProductCategories.LCBInbound,
            name: ProductNames.LargeCabinBags,
            id:
                isRemoveAllLCB || eventType === EventTypes.AddLCBForAllPassengers
                    ? ProductIds.LargeCabinBagsAll
                    : ProductIds.LargeCabinBagsSingle,
            quantity: LCBQuantity,
            price,
            variant,
            brand,
            currencyCode,
            dimension35: formatDateL10n(depDate, DATE_FORMATS.query),
            dimension37: getSeason(depDate),
            dimension38: formatDateL10n(depDate, DATE_FORMATS.time),
            dimension89: getCabinBagsUrgencyMessage() ?? 'null',
        };

        if (eventType === EventTypes.Guest || eventType === EventTypes.Booking) {
            return {
                ...LCBProduct,
                coupon: '',
                dimension23: isOutbound ? dimension23 : '',
                dimension47,
                dimension50,
                dimension85: [depPt, arrPt].join('|'),
                dimension173: '',
                ...extraDimensions,
            };
        }

        const seatDimension = isOutbound ? 'dimension17' : 'dimension137';

        return {
            ...LCBProduct,
            dimension15,
            dimension13,
            [seatDimension]: isOutbound ? dimension17 : dimension137,
            dimension18: depItemName || depName || '',
            dimension19: depPt,
            dimension20: arrItemName || arrName || '',
            dimension21: arrPt,
            dimension29,
            dimension30,
            dimension31,
            dimension32,
            dimension33,
            dimension36: formatDateL10n(depDate, DATE_FORMATS.yearMonthFormat),
            dimension40: getDaysDifferenceRoundedFloor(new Date(depDate), new Date()),
            dimension71,
            dimension83: fltNo,
            ...extraDimensions,
        };
    };

    buildLCBProducts = (
        eventType:
            | EventTypes.AddToBasket
            | EventTypes.RemoveFromBasket
            | EventTypes.AddLCBForAllPassengers
            | EventTypes.Guest
            | EventTypes.Booking
            | EventTypes.Extras
            | EventTypes.ExtrasSeatUpdate
            | EventTypes.ExtrasBagsUpdate,
        baseHoliday: IBaseHolidayProduct,

        LCBQuantity: number,
        isRemoveAllLCB?: boolean,
        extraDimensions?: Partial<ILCBProduct>,
    ): ILCBProduct[] =>
        [
            this.buildLCBProduct(eventType, baseHoliday, true, LCBQuantity, isRemoveAllLCB, extraDimensions),
            this.buildLCBProduct(eventType, baseHoliday, false, LCBQuantity, isRemoveAllLCB, extraDimensions),
        ].filter(Boolean) as ILCBProduct[];

    /** Get all A/B tests from current layout and sessionStorage
     * and returns them as piped list (e.g '100A|200B|...|') */
    protected getABTestVariant = async (layout: ISitecoreLayout): Promise<string> => {
        const layoutTests: IABTest[] = getLayoutABTests(layout);
        const storedTests: IABTest[] = getStorageABTests();
        const customTests: IABTest[] = await this.getCustomABTests(layout);

        // Merge all tests
        const abTests: IABTest[] = [...layoutTests, ...customTests];

        // Always remove seats test id from session storage on Extras page
        if (this.rootStore.layoutStore.isExtrasPage) {
            const index = storedTests.findIndex(t => t.testId === SEATS_TEST_ID);
            index !== -1 && storedTests.splice(index, 1);
        }

        // If there is the same test Id in session and layout/custom tests, keep layout/custom variant
        abTests.push(...storedTests.filter(storedTest => abTests.every(test => test.testId !== storedTest.testId)));

        return createABTestsPipedList(abTests);
    };

    /**
     * Get custom (hardcoded) AB tests, that don't set up in sitecore, but analytic team wants to track them as dimension12 (test_variant).
     */
    protected getCustomABTests = async (layout: ISitecoreLayout): Promise<IABTest[]> => {
        const tests: IABTest[] = [];

        // Track 'Seat Map' if seats enabled and there is rendering in layout
        if (
            this.rootStore.layoutStore.isExtrasPage &&
            this.rootStore.seatMapStore.isSeatMapFlowEnabled &&
            findComponentByName(layout, 'Seats And Bags')
        ) {
            await when(
                () =>
                    this.rootStore.bookingStore.isValidatingPackage === false &&
                    this.rootStore.bookingStore.isLoadingOffer === false,
            );

            if (!this.rootStore.seatMapStore.isSeatMapFailed && this.rootStore.seatMapStore.outboundFlight) {
                const isDynamicSeats = this.rootStore.seatMapStore.outboundFlight.isExt ?? false;
                // 104B - dynamic seats, 104C - series seats
                tests.push({ testId: SEATS_TEST_ID, testVariant: isDynamicSeats ? 'B' : 'C' });
            }
        }

        return tests;
    };

    // Initialize pageLoad object. If pageParams passed, use them, else get page info from layout.
    public initializePageLoadObject = async (pageParams?: {
        category: string;
        title: string;
        url: string;
        currencyCode?: string;
        pageReferral?: string;
        pageReferralName?: string;
    }): Promise<void> => {
        const { layoutStore, appStore, userStore, viewBookingStore } = this.rootStore;
        const { title, category, pageReferral, url, pageReferralName, currencyCode: paramsCurrency } = pageParams || {};
        const prevPageName = this.pageName;
        const prevPageCategory = this.pageCategory;
        const prevPageUrl = this.pageLoadObject?.dimension7 ?? '';
        const currencyCode = paramsCurrency ?? (await this.getPageCurrency());
        const channel = appStore.isScreenExtraSmall ? SitecoreChannel.Mobile : SitecoreChannel.Desktop;

        // Save page name, category and test variant even if GTM is disabled for current page on sitecore.
        // These data can be used for next events (e.g. pageLoad on next page).
        this.pageTitle = title ?? this.getPageTitle();
        this.pageName = this.buildPageName(this.pageTitle);
        this.pageCategory = category ?? this.getPageCategoryFromLayout();

        const testVariant = await this.getABTestVariant(layoutStore.layout);
        // Save testVariant in sessionStorage, because it should persists throughout the session and should be added to future pageLoad events
        setWebStorageItem(WebStorageKeys.ABTestVariant, testVariant, sessionStorage);

        const pageLoadObject: IPageLoadObject = {
            event: EventTypes.PageLoad,
            pageName: this.pageName,
            pageTitle: this.pageTitle,
            pageCategory: this.pageCategory,
            pageReferral: pageReferral ?? prevPageUrl,
            currencyCode,
            channel,
            dimension1: '', // keep userId empty as it's stored in cookies and httpOnly cookie can't be accessed via JS
            dimension2: getBusinessChannel(),
            dimension3: getBusinessType(),
            dimension4: globalThis.location.origin,
            dimension5: getVersion(),
            dimension6: this.pageLang,
            dimension7: url ?? globalThis.location.href,
            dimension8: getScreenOrientation(),
            dimension9: getScreenSize(appStore),
            dimension10: pageReferralName ?? prevPageName,
            dimension11: prevPageCategory,
            dimension12: testVariant,
            dimension13: getTimestamp(),
            dimension88: this.defaultGalleryMedia,
            dimension92: convertToYesNoString(userStore.isLoggedIn),
            dimension95: '',
            atcomPromoCode: null,
            atcomGrouping: null,
            placeholders: null,
        };

        // Add extra dimensions only if pageLoad object is building by layout (i.e. no passed pageParams).
        if (!pageParams) {
            await this.addExtraDimensionsToGlobalObject(pageLoadObject);
        }

        if (!layoutStore.isTradePortal && (layoutStore.isExtrasPage || layoutStore.isHotelDetailsBookPage)) {
            await this.addExtrasPageDimensions(pageLoadObject);
        }

        if (this.pageCategory === PageLoadCategory.PostBooking) {
            pageLoadObject.customParams = generateGenericValues({});

            if (viewBookingStore.booking) {
                pageLoadObject.dimension126 = getDaysToDepartureBucket(viewBookingStore.booking);
            }
        }

        this.pageLoadObject = pageLoadObject;
        this.pageLoadLayoutId = layoutStore.layoutId;
    };

    private readonly getPlaceholdersGrouping = (): string => {
        const { engageStore } = this.rootStore;

        if (!engageStore.contentOrder?.placeholders?.[PlaceholderNames.SorterWrapperInner]) {
            return '';
        }

        return engageStore.contentOrder.placeholders[PlaceholderNames.SorterWrapperInner]
            .map(c => c.componentName)
            .join('|');
    };

    private readonly addExtrasPageDimensions = async (pageLoadObject: IPageLoadObject): Promise<void> => {
        const { engageStore } = this.rootStore;

        const isPersonalized =
            getCookie(settings.Cookies.Personalization) === '1' && !this.rootStore.layoutStore.isExperienceEditor;

        if (isPersonalized) {
            try {
                await when(() => engageStore.engage !== undefined && engageStore.contentOrder !== undefined, {
                    timeout: SAFE_RESOLVE_TIMEOUT,
                });
            } catch {}
        }

        try {
            await when(() => this.rootStore.bookingStore.selectedOffer !== undefined, {
                timeout: SAFE_RESOLVE_TIMEOUT,
            });
        } catch {}

        pageLoadObject.atcomPromoCode = this.rootStore.bookingStore.selectedOffer?.accom.prom || '';
        pageLoadObject.atcomGrouping = this.getAtcomGrouping(isPersonalized);
        pageLoadObject.placeholders = this.getPlaceholdersGrouping();
    };

    private readonly getAtcomGrouping = (isPersonalized: boolean): string | null => {
        if (!isPersonalized) {
            return [PersonalizationNames.Default, PersonalizationNames.Standard].join(' - ');
        }

        return this.rootStore.engageStore.contentOrder?.groupName || PersonalizationNames.Default;
    };

    public trackBookingAlterationDrawerPageLoad = async (isOpen: boolean): Promise<void> => {
        const { bookingStore, layoutStore } = this.rootStore;
        const props = isOpen
            ? {
                  title: [BoardsAndRoomsEventCategory.BoardAndRoom, layoutStore.pageTitle].join(' - '),
                  category: PageLoadCategory.Book,
                  url: [layoutStore.sitePath, SitePath.BoardAndRoom].join(''),
                  currencyCode: bookingStore.selectedOffer?.currency?.code,
              }
            : undefined;

        await this.initializePageLoadObject(props);
        isOpen && this.addToDataLayer(this.pageLoadObject);
    };

    public trackSeatsPageLoad = async (direction: SeatMapFlightDirection): Promise<void> => {
        const { layoutStore, seatMapStore } = this.rootStore;
        const currencyCode = seatMapStore.currency;
        const isPostBookingFlow = layoutStore.isViewBookingPage;
        const isOutboundDirection = direction === SeatMapFlightDirection.Outbound;
        const title = `Seats ${isOutboundDirection ? 'Outbound' : 'Return'}`;
        const url = `/booking/seats-${isOutboundDirection ? 'outbound' : 'return'}`;
        const category = isPostBookingFlow ? PageLoadCategory.PostBookingAddSeats : PageLoadCategory.Book;

        await this.initializePageLoadObject({
            title: isPostBookingFlow ? [PageLoadCategory.PostBooking, title].join(':') : title,
            category,
            url: [layoutStore.sitePath, url, globalThis.location.search || ''].join(''),
            currencyCode,
        });

        this.addToDataLayer(this.pageLoadObject);
    };

    public trackHoldLuggagePopupLoad = async (): Promise<void> => {
        const { isViewBookingPage, sitePath } = this.rootStore.layoutStore;

        await this.initializePageLoadObject({
            title: 'Bags',
            category: isViewBookingPage ? PageLoadCategory.PostBookingAddBags : PageLoadCategory.Book,
            url: `${sitePath}/booking/bags${globalThis.location.search || ''}`,
        });

        this.addToDataLayer(this.pageLoadObject);
    };

    public trackExternalExtrasTileImpression = (tileTitle: string, tileIndex: number, destinationUrl: string): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.ExternalExtrasModule,
                eventAction: EventActions.Tile,
                eventLabel: `${EventLabels.Position}${tileIndex}: ${tileTitle}`,
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({
                destinationUrl,
            }),
        );
    };

    public trackUrgencyMessageTileImpression = (eventLabel: string): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.UrgencyMessage,
                eventAction: EventActions.SeatImpressions,
                eventLabel: eventLabel,
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
        );
    };

    public trackExternalExtrasTileClick = (
        tileTitle: string,
        tileIndex: number,
        tilePrice: string,
        destinationUrl: string,
    ): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.ExternalExtrasModule,
                eventAction: EventActions.TileClick,
                eventLabel: tileTitle,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                genericValue1: tileIndex.toString(),
                genericValue2: tilePrice,
                genericValue3: null,
                genericValue4: null,
                destinationUrl,
            }),
        );
    };

    public trackExternalExtrasClickViewExtras = (): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.ExternalExtrasModule,
                eventAction: EventActions.ModuleClick,
                eventLabel: EventLabels.ViewExtras,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({}),
        );
    };

    public trackExternalExtrasClickHide = (): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.ExternalExtrasModule,
                eventAction: EventActions.ModuleClick,
                eventLabel: EventLabels.Hide,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({}),
        );
    };

    public trackLateCheckoutChange = (eventType: EventTypes): void => {
        const { selectedOffer, lateRoomCheckout } = this.rootStore.bookingStore;
        const actionType = eventType === EventTypes.AddToBasket ? 'add' : 'remove';
        const baseHoliday = this.buildBaseHolidayProduct(selectedOffer, eventType);
        const product = this.buildLateCheckoutHolidayProduct(lateRoomCheckout, eventType, baseHoliday, {
            dimension173: lateRoomCheckout?.code,
        });

        this.addToDataLayer({
            event: eventType,
            ecommerce: {
                currencyCode: baseHoliday?.currencyCode,
                [actionType]: { product },
            },
        });
    };

    protected addBd4DimensionsToObject = (
        object: IPromoPageDetailObject | IPageLoadObject | IDetailHolidayProduct,
    ): void => {
        if (this.bd4SortTracking && this.rootStore.hotelsStore.status === DataStatus.Loaded) {
            object.dimension143 = this.bd4SortTracking.pToken;
            object.dimension144 = this.bd4SortTracking.apiUrl;
            object.dimension145 = this.bd4SortTracking.apiMessage ?? '';
            object.dimension146 = toJS(this.bd4SortTracking.tracking);
        }
    };

    protected addBookingInfoDimensionsToGlobalObject = (globalObject: IPageLoadObject): void => {
        const { booking } = this.rootStore.viewBookingStore;

        if (booking) {
            const { paymentInfo, bookingReference, hotel } = booking;

            globalObject.id = bookingReference;
            globalObject.revenue = paymentInfo.totalPrice;
            globalObject.dimension98 = paymentInfo.balanceDueAmount || 0;
            globalObject.dimension99 = getPercentageOfTotal(paymentInfo.balanceDueAmount, paymentInfo.totalPrice);
            globalObject.hotelId = hotel?.code;
        }
    };

    addBookingFlowPageDimension = async (eventType: EventTypes): Promise<IEcommerceObject> => {
        const { bookingStore, searchStore, layoutStore } = this.rootStore;
        const { isExtrasPage, isHotelDetailsBookPage } = layoutStore;
        let dimension101;
        let greenPromo: string | undefined;

        if (isExtrasPage) {
            dimension101 = await this.getAvailabilityStatus();
            greenPromo = this.buildGreenPromo();
        }

        await bookingStore.fetchOffer(undefined, isHotelDetailsBookPage);

        const { selectedOffer } = bookingStore;
        const { selectedOfferIndex } = searchStore;
        const products = this.buildProducts(selectedOffer, selectedOfferIndex, eventType);
        const eCommerce: TEnhancedEcommerce = { detail: { products } };

        let dimension89: string | null = null;

        if (isExtrasPage) {
            eCommerce.impressions = [];

            if (selectedOffer) {
                dimension89 = this.buildUrgencyMessagingDimensions(eventType, selectedOffer.accom.unit).dimension89;
            }
        }

        const dimension188 = this.getDimension188(eventType);

        return {
            event: eventType,
            dimension136: this.pageName,
            pageTitle: this.pageTitle,
            ecommerce: eCommerce,
            ...(dimension101 ? { dimension101 } : {}),
            ...(dimension89 ? { dimension89 } : {}),
            ...(dimension188 ? { dimension188 } : {}),
            ...(greenPromo ? { greenPromo } : {}),
        };
    };

    buildGreenPromo = (): string => {
        const { bookingStore } = this.rootStore;

        return `LCB:${bookingStore.extraLuggage.isLCBGreenPromoShown ? 'Y' : 'N'}|HB:${
            bookingStore.extraLuggage.isHBGreenPromoShown ? 'Y' : 'N'
        }`;
    };

    addBookingConfirmationDimensions = async (eventType: EventTypes): Promise<IEcommerceObject | null> => {
        const { isLoadingBookingConfirmationInfo, booking, extraLuggage, bookingInfoPayload } =
            this.rootStore.bookingStore;

        await when(() => isLoadingBookingConfirmationInfo === false);

        if (!booking) {
            return null;
        }

        let baseHoliday = this.buildBaseHolidayProduct(booking, eventType);

        if (!baseHoliday) {
            return null;
        }

        const { paymentInfo, priceBreakdown, seatSelection, lateRoomCheckout, bookingReference, airportParking } =
            booking;
        const { totalPrice, depositPrice, balanceDueAmount } = paymentInfo;
        const { accom, transport } = booking.package;
        const { rooms, isExt } = accom;
        const { routes } = transport;

        const shouldEmailBeEncoded = !!Number(getCookie(CookiesKeys.EjMarketingCookie));
        const email = getBookingEmail(booking.leadPassenger?.email);
        const encodedEmail = shouldEmailBeEncoded && email ? await encodeSHA256(email) : null;
        const [outboundInfo, inboundInfo] = routes;
        const isPartialPayment = balanceDueAmount > 0;
        const creditPaidAmount = getCreditPaidAmount(paymentInfo) ?? 0;
        const totalPaidAmount = getTotalPaidAmount(paymentInfo) ?? 0;
        const lateCheckoutPrice = priceBreakdown?.find(el => el.code === PriceBreakdownCode.LateCheckout)?.amount ?? 0;

        // replace the avail value in the booking with the value from the initial offer
        if (rooms.length) {
            rooms[0].avail = bookingInfoPayload?.avail ?? 0;
        }

        baseHoliday = {
            ...baseHoliday,
            revenue: totalPrice,
            metric3: creditPaidAmount,
            dimension66: creditPaidAmount
                ? creditPaidAmount < totalPaidAmount
                    ? 'Partial Credit'
                    : 'Credit'
                : 'Other',
            dimension67: isPartialPayment ? (totalPaidAmount === depositPrice ? 'Deposit' : 'Partial') : 'Full',
            dimension68: isPartialPayment ? getPercentageOfTotal(totalPaidAmount, totalPrice) : ONE_HUNDRED,
            dimension69: totalPaidAmount,
            ...this.buildUrgencyMessagingDimensions(EventTypes.Booking, rooms),
        };

        const bagsSelection = extraLuggage.getExtraLuggageProductsForTracking();
        const flights = this.buildFlightsProducts(outboundInfo, inboundInfo, baseHoliday);
        const seats = this.buildAllSeatsProducts(
            EventTypes.Booking,
            seatSelection || [],
            outboundInfo,
            inboundInfo,
            baseHoliday,
        );
        const bags = this.buildBagsBookingFlowProducts(routes, bagsSelection, baseHoliday, isExt);
        const lateRoomCheckoutProduct = this.buildLateCheckoutHolidayProduct(
            lateRoomCheckout,
            EventTypes.Purchase,
            baseHoliday,
            {
                id: `lateCheckout_${bookingReference}`,
                price: lateCheckoutPrice,
                quantity: 1,
            },
        );

        let products = [baseHoliday, ...flights, ...seats, ...bags, lateRoomCheckoutProduct].filter(
            Boolean,
        ) as TProduct[];

        const { LCBCount } = this.rootStore.flightsPassengersStore;

        if (LCBCount) {
            const cabinBags = this.buildLCBProducts(EventTypes.Booking, baseHoliday, LCBCount, false, {
                dimension173: bookingReference,
            });

            products = products.concat(cabinBags);
        }

        if (airportParking) {
            const parkingProduct = this.buildAirportParkingProduct(airportParking, eventType, baseHoliday);
            products = products.concat(parkingProduct);
        }

        const dimension188 = this.getDimension188(EventTypes.Booking);

        const paymentType = this.rootStore.bookingStore.bookingInfoPayload.paymentType;
        const cardType = this.rootStore.bookingStore.bookingInfoPayload.cardType;
        const paymentMethod: string = this.getPaymentMethod(paymentType, cardType);

        return {
            event: EventTypes.Booking,
            dimension136: this.pageName,
            ...(dimension188 ? { dimension188 } : {}),
            enhancedConversion: encodedEmail,
            pageTitle: this.pageTitle,
            flightReference: getFlightsReferences(routes || []).join('|') || 'Series',
            paymentMethod: paymentMethod,
            ecommerce: {
                purchase: {
                    actionField: {
                        event: EventTypes.Booking,
                        id: bookingReference,
                        timestamp: getTimestamp(),
                        revenue: totalPrice,
                        coupon: baseHoliday.coupon,
                        metric3: creditPaidAmount,
                    },
                    products,
                },
            },
        };
    };

    private readonly getPaymentMethod = (
        paymentType: OrderCheckoutPayment | undefined,
        cardType: string | undefined,
    ): string => (paymentType === OrderCheckoutPayment.Credit ? paymentType : `${paymentType} - ${cardType}`);

    private readonly addExtraDimensionsToGlobalObject = async (globalObject: IPageLoadObject): Promise<void> => {
        const { hotelsStore, layoutStore } = this.rootStore;

        if (layoutStore.isSearchResultsPage || layoutStore.isPromoPage) {
            await when(() => hotelsStore.status !== DataStatus.Loading && hotelsStore.status !== DataStatus.NotLoaded);
            this.addBd4DimensionsToObject(globalObject);

            return;
        }

        if (layoutStore.isViewBookingPage) {
            await when(() => !!this.rootStore.viewBookingStore.booking);

            this.addBookingInfoDimensionsToGlobalObject(globalObject);

            return;
        }

        if (layoutStore.isConfirmationPage) {
            await when(() => this.rootStore.bookingStore.isLoadingBookingConfirmationInfo === false);

            const { booking } = this.rootStore.bookingStore;

            if (booking?.hotel) {
                globalObject.hotelId = booking.hotel.code;
            }

            return;
        }

        if (layoutStore.isExtrasPage) {
            globalObject.dimension101 = await this.getAvailabilityStatus();

            return;
        }

        if (layoutStore.isShortlistPage) {
            // For now it's 1, but in the future users will be able to create more lists
            globalObject.dimension95 = 1;
        }
    };

    protected addPageAndTimestampDimensions = (eventType: EventTypes): void => {
        this.addToDataLayer({
            event: eventType,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
        });
    };

    protected addDestinationGuideDimensions = (): void => {
        const { layout, pageFields } = this.rootStore.layoutStore;
        const { country, region, resort } = getLocationHierarchy(layout) || {};

        this.addToDataLayer({
            event: EventTypes.DestinationGuide,
            dimension136: this.pageName,
            currencyCode: this.rootStore.marketStore.currency,
            dimension13: getTimestamp(),
            dimension22: pageFields?.PageCategory?.value || '',
            dimension23: country?.itemName ?? country?.name ?? '',
            dimension24: country?.code ?? '',
            dimension25: region?.itemName ?? region?.name ?? '',
            dimension26: region?.code ?? '',
            dimension27: resort?.itemName ?? resort?.name ?? '',
            dimension28: resort?.code ?? '',
        });
    };

    protected getAvailabilityStatus = async (): Promise<string> => {
        await when(() => this.rootStore.bookingStore.isValidatingPackage === false);

        const { isPackageValid, previousPrice, packageInfo } = this.rootStore.bookingStore;

        if (!isPackageValid) {
            return 'Not Available';
        }

        const newPrice = packageInfo ? packageInfo.paymentInfo.totalPrice : previousPrice;
        const diff = (newPrice ?? 0) - (previousPrice ?? 0);

        if (diff !== 0) {
            const sign = diff > 0 ? '+' : '';

            return `Price change: ${sign}${diff}`;
        }

        return 'OK';
    };

    buildPageName = (pageTitle: string, lang: string = this.pageLang): string => [pageTitle, lang].join('|');

    trackExcursionsAction = (
        excursions: IExcursion[],
        eventParams: { eventAction: EventActions; eventLabel: string },
        customParams: ICustomParams = {},
    ): void => {
        if (!excursions.length) {
            return;
        }

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Excursions,
                eventType: EventTypes.NonInteraction,
                eventValue: null,
                ...eventParams,
            },
            generateGenericValues({ destinationUrl: null, ...customParams }),
        );
    };

    trackHeroBannerImpression = (uniqueId: string, title: string, subtitle: string, position: number): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.HeroBannerImpression,
                eventCategory: EventCategories.Homepage,
                eventLabel: title,
                eventType: EventTypes.NonInteraction,
                eventValue: 'null',
                position,
            },
            {
                ...GENERIC_CUSTOM_PARAMS_EMPTY,
                genericValue1: subtitle,
                genericValue4: [friendlyId, selectionAttr].join('|'),
            },
        );

        logger.info(
            'Tracking hero banner impression: ' +
                JSON.stringify({
                    uniqueId,
                    title,
                    subtitle,
                    position,
                    friendlyId,
                    selectionAttr,
                    sitecoreAnalyticsCookie: getCookie(CookiesKeys.SitecoreAnalytics),
                    experiments: this.rootStore.engageStore.experiments,
                }),
        );
    };

    trackPromoBlocksImpression = (
        uniqueId: string,
        variant: PromoBlocksThemes | undefined,
        eventLabel: string,
        genericValue2: string,
    ): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Module,
                eventAction: EventActions.Impressions,
                eventLabel,
                eventType: EventTypes.NonInteraction,
                eventValue: 'null',
            },
            {
                genericValue1: variant ? `${GenericValue.Promo}:${variant}` : GenericValue.Promo,
                genericValue2, //Module Pill. Applicable for Big theme only
                genericValue3: 'null',
                genericValue4: [friendlyId, selectionAttr].join('|'),
                destinationUrl: null,
            },
        );
    };

    trackPromoBlockClick = (
        uniqueId: string,
        variant: PromoBlocksThemes | undefined,
        eventLabel: string,
        genericValue2: string,
        genericValue3: string,
        url: string,
    ): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Module,
                eventAction: EventActions.ImpressionClicked,
                eventLabel,
                eventType: EventTypes.Interaction,
                eventValue: 'null',
            },
            {
                genericValue1: variant ? `${GenericValue.Promo}:${variant}` : GenericValue.Promo,
                genericValue2, //Module Pill. Applicable for Big theme only
                genericValue3, //CTA text
                genericValue4: [friendlyId, selectionAttr].join('|'),
                destinationUrl: url,
            },
        );
    };

    trackFeaturedHotelsImpression = (uniqueId: string, hotels: IFeaturedHotelsWithPrice[]): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        const countries: (string | undefined)[] = [];
        const regions: (string | undefined)[] = [];
        const prices: (number | undefined)[] = [];

        const eventLabel = hotels
            .map(hotel => {
                countries.push(hotel?.Country);
                regions.push(hotel?.Region);
                prices.push(hotel?.livePrice?.pricePP);

                return hotel?.Name;
            })
            .join('|');

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.FeaturedHotels,
                eventCategory: EventCategories.Homepage,
                eventLabel,
                eventType: EventTypes.NonInteraction,
                eventValue: 'null',
            },
            {
                ...GENERIC_CUSTOM_PARAMS_EMPTY,
                genericValue1: countries.join('|'),
                genericValue2: regions.join('|'),
                genericValue3: prices.join('|'),
                genericValue4: [friendlyId, selectionAttr].join('|'),
            },
        );
    };

    trackPersonalizedClick = (
        event: EventTypes,
        uniqueId: string,
        location: string,
        name: string,
        destination: string,
        extraProps: { position?: string; price?: string; section?: string },
    ): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackHomepageAction(event, {
            location,
            name,
            position: '1',
            destination,
            friendlyID: friendlyId,
            selection_attribute: selectionAttr,
            ...extraProps,
        });
    };

    trackManageHolidayImpression = (
        uniqueId: string,
        eventLabel: string,
        ctaText: string,
        destinationUrl: string,
    ): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Module,
                eventAction: EventActions.Impressions,
                eventLabel,
                eventType: EventTypes.NonInteraction,
                eventValue: 'null',
            },
            {
                genericValue1: GenericValue.ManageHoliday,
                genericValue2: 'null',
                genericValue3: ctaText,
                genericValue4: [friendlyId, selectionAttr].join('|'),
                destinationUrl,
            },
        );
    };

    trackManageHolidayClick = (uniqueId: string, eventLabel: string, ctaText: string, destinationUrl: string): void => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Module,
                eventAction: EventActions.ImpressionClicked,
                eventLabel,
                eventType: EventTypes.Interaction,
                eventValue: 'null',
            },
            {
                genericValue1: GenericValue.ManageHoliday,
                genericValue2: 'null',
                genericValue3: ctaText,
                genericValue4: [friendlyId, selectionAttr].join('|'),
                destinationUrl,
            },
        );
    };

    trackSeatMapTabClick = (isOutbound: boolean, widgetData: ISelectedSeat[]): void => {
        const data = getSelectedSeatsFromWidgetData(widgetData, true);

        this.trackPostBookingSeatsUpdated(
            isOutbound ? EventTypes.PostBookingSeatOutBasket : EventTypes.PostBookingSeatInBasket,
            data,
        );
    };

    trackSeatMapTabSwitching = (
        actionMode: NavigationActionMode,
        widgetData: ISelectedSeat[] | undefined,
        totalPassengersNumber: number,
        hasSelectionChanged: boolean,
    ): void => {
        const { isViewBookingPage } = this.rootStore.layoutStore;

        if (isViewBookingPage && widgetData && hasSelectionChanged) {
            const isPartial = (length: Nullable<number>): boolean => !!length && length < totalPassengersNumber;
            const [outData, inData] = widgetData;

            switch (actionMode) {
                case NavigationActionMode.ContinueToReturn:
                    !isPartial(outData?.seats?.length) &&
                        this.trackPostBookingSeatsUpdated(EventTypes.PostBookingSeatOutBasket, widgetData);
                    break;
                case NavigationActionMode.ConfirmSeats:
                    !isPartial(inData?.seats?.length) &&
                        this.trackPostBookingSeatsUpdated(EventTypes.PostBookingSeatInBasket, widgetData);
                    break;
                default:
                    break;
            }
        }
    };

    addShortlistData = (eventType: EventTypes, products: IProduct[]): void => {
        this.addToDataLayer({
            event: eventType,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            products,
        });
    };

    public trackShortlistView = (products: IOffer[]): void => {
        const shortlistViewProducts = products.map(product => createShortlistViewProduct(product));
        this.addToDataLayer({
            event: EventTypes.ShortlistView,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            ecommerce: {
                detail: {
                    impressions: shortlistViewProducts,
                },
            },
        });
    };

    public trackShortlistEvent = (state: boolean, offers: IOffer[]): void =>
        this.addShortlistData(
            state ? EventTypes.ShortlistAdded : EventTypes.ShortlistRemoved,
            offers.map(offer => createProduct(offer)),
        );

    public trackHotelBrowseEcommerce = (): void => {
        const { layout, pageFields, isHotelDetailsBrowsePage } = this.rootStore.layoutStore;

        if (!isHotelDetailsBrowsePage || !layout) return;

        const { hotel, country, region, resort } = getLocationHierarchy(layout) || {};

        this.addToDataLayer({
            event: EventTypes.BrowseEcommerce,
            dimension136: this.buildPageName('Browse Hotel Details'),
            pageTitle: this.pageTitle,
            ecommerce: {
                detail: {
                    products: [
                        {
                            dimension108: EventTypes.BrowseEcommerce,
                            category: ProductCategories.BaseHoliday,
                            name: hotel?.name ?? '',
                            id: hotel?.code ?? '',
                            currencyCode: this.rootStore.marketStore.currency,
                            dimension13: getTimestamp(),
                            dimension23: country?.itemName ?? country?.name ?? '',
                            dimension25: region?.itemName ?? region?.name ?? '',
                            dimension27: resort?.itemName ?? resort?.name ?? '',
                            dimension57: Number.parseInt(pageFields?.StarRating?.value) || '',
                            dimension72: pageFields?.Price?.value ?? '',
                            dimension186: pageFields?.GiataCode?.value ?? '',
                        },
                    ],
                },
            },
        });
    };

    @action setBd4RecommenderTracking = (tracking: Nullable<IBd4Tracking>): void => {
        this.bd4RecommenderTracking = tracking || null;
    };

    @action setBd4RecommenderPlacementId = (placementId: Nullable<Bd4TravelPlacementId>): void => {
        this.bd4RecommenderPlacementId = placementId;
    };

    @action setBd4SortTracking = (tracking: Nullable<IBd4Tracking>): void => {
        this.bd4SortTracking = tracking || null;
    };

    /**
     * Force call Optimize event, that activates the AB Tests for Offer Cards on Search Results / Promo Pages.
     * Usually this event fires automatically after certain dataLayer events that update cards (e.g. 'search_filter_update', 'search_sort_by_update', .etc)
     * In cases if cards are re-rendered (e.g window resize) and we don't have special dataLayer event, that Optimize can use, need to force call this event
     */
    public forceOptimizeSRPEvent = (): void => this.addToDataLayer({ event: EventTypes.OptimizeSRP });

    public applyPromoCodeTrigger = (isValid: boolean): void => {
        const { totalPrice, priceBreakdown, promoCode } = this.rootStore.bookingStore;
        const discount = isValid ? getPromoCodeAmount(priceBreakdown) : 0;

        this.addToDataLayer({
            event: EventTypes.PromoCodeValidation,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            dimension63: promoCode.value?.toUpperCase() || '',
            dimension64: discount,
            dimension139: isValid ? 'Valid' : 'Invalid',
            dimension15: totalPrice,
        });
    };

    public trackSearchProductClick = (
        offer: IOffer,
        index: number,
        isRecommended: boolean = false,
        map: boolean = false,
    ): void => {
        const eventType = map ? EventTypes.ProductClickMap : EventTypes.ProductClick;

        const baseProduct = this.buildBaseHolidayProduct(offer, eventType, index);
        const products = baseProduct
            ? [
                  {
                      ...baseProduct,
                      ...this.buildUrgencyMessagingDimensions(eventType, offer.accom.unit),
                  },
              ]
            : [];

        const ecommerce: IEcommerceObject = {
            event: EventTypes.ProductClick,
            dimension136: this.pageName,
            pageTitle: this.pageTitle,
            ecommerce: {
                click: {
                    actionField: {
                        list: `${this.pageName}${isRecommended ? ' - Recommended' : ''}`,
                    },
                    products,
                },
            },
        };
        this.addToDataLayer(ecommerce);

        offer.isSponsored && this.trackPromoClick(offer, index);
    };

    public trackPromoClick = ({ accom, hotel }: IOffer, index: number): void => {
        const { page, take } = this.rootStore.searchStore;
        const accomId = accom?.id;
        const campaign = accomId
            ? this.bd4SortTracking?.tracking?.campaignInfo?.find(c => c.productId?.indexOf(accomId) !== -1)
            : null;
        const ecommerce = {
            event: EventTypes.PromoClick,
            dimension136: this.pageName,
            ecommerce: {
                promoClick: {
                    promotions: [
                        {
                            id: accomId || '',
                            name: hotel ? `Sponsored: ${hotel.name}` : '',
                            creative: campaign?.name || '',
                            position: getPosition(index || 0, page, take),
                        },
                    ],
                },
            },
        };

        this.addToDataLayer(ecommerce);
    };

    public trackAccountEvent = (eventType: EventTypes): void => this.addPageAndTimestampDimensions(eventType);

    public trackAccountIdentifiedEvent = (isAccountExists: boolean): void => {
        const event = isAccountExists ? EventTypes.AccountIdentified : EventTypes.AccountNotIdentified;
        this.addPageAndTimestampDimensions(event);
    };

    public trackRecommenderLoaded = async (offers: IOffer[], sidesOptions: ISlidesOptions): Promise<void> => {
        // bd4 event should be added only after "pageLoad" event in dataLayer (EJH-15102)
        await when(() => this.isPageLoadEventLoading === false);

        envAll.ENABLE_BD4_LOGGING && logger.info('Recommended is loaded');
        this.createRecommenderDisplayEvent(offers, sidesOptions);
    };

    public trackRecommenderNotLoaded = async (errorMessage?: string): Promise<void> => {
        // bd4 event should be added only after "pageLoad" event in dataLayer (EJH-15102)
        await when(() => this.isPageLoadEventLoading === false);

        envAll.ENABLE_BD4_LOGGING && logger.info(`Recommended is not loaded`);

        const recommender = this.buildBaseRecommenderEvent(EventTypes.RecommenderNotLoaded);
        recommender.dimension151 = errorMessage || this.bd4RecommenderTracking?.apiMessage;

        envAll.ENABLE_BD4_LOGGING && logger.info(`Recommended add to data layer: ${JSON.stringify(recommender)}`);

        this.addToDataLayer(recommender);
    };

    public trackRecommenderInteraction = (
        medium: RecommenderMedium,
        offer: IOffer,
        index: number,
        sidesOptions: ISlidesOptions,
    ): void => {
        this.trackRecommenderActiveOffer(EventTypes.RecommenderInteraction, offer, index, sidesOptions, {
            dimension154: medium,
        });
    };

    public trackRecommenderHotelClick = (
        offer: IOffer,
        index: number,
        sidesOptions: ISlidesOptions,
        isRecommenderGrid?: boolean,
    ): void => {
        this.trackRecommenderActiveOffer(
            EventTypes.RecommenderHotelClick,
            offer,
            index,
            sidesOptions,
            isRecommenderGrid ? { dimension148: 0 } : undefined,
        );
    };

    public trackRecommenderPagination = (offers: IOffer[], sidesOptions: ISlidesOptions): void => {
        this.trackRecommenderVisibleOffers(EventTypes.RecommenderPagination, offers, sidesOptions);
    };

    public trackHolidayTypes = (): void => {
        this.addToDataLayer({
            event: EventTypes.HolidayTypeCodes,
            eventParams: {
                location: this.pageName,
                typesCode: this.rootStore.layoutStore.holidayThemeTypes,
            },
        });
    };

    public trackHomepageAction = (event: EventTypes, eventParams: IHomepageEventParams): void => {
        if (this.rootStore.layoutStore.isHomePage) {
            this.addToDataLayer({
                event,
                eventParams,
            });
        }
    };

    public trackHolidayTypesHubEvents = (
        eventType:
            | EventTypes.CTAClick
            | EventTypes.ShowDeals
            | EventTypes.RegionDealsClick
            | EventTypes.CountryDealsClick
            | EventTypes.ShowSimilarDeals
            | EventTypes.SimilarDealsClick,
        eventParams: IHolidayTypesHubEventParams,
    ): void => {
        this.addToDataLayer({
            event: eventType,
            eventParams: {
                location: this.rootStore.layoutStore.layoutName,
                url: this.rootStore.layoutStore.fullUrl,
                ...eventParams,
            },
        });
    };

    public trackNavigationClick = (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ): void => {
        this.addToDataLayer({
            event: eventType,
            eventParams,
        });
    };

    public trackOtherRoutesClick = (eventType: EventTypes, actionType?: OtherRoutesActions): void => {
        this.addToDataLayer({
            event: eventType,
            ...(actionType && { otherRoutesAction: actionType }),
        });
    };

    public trackHelpCentreClick = (
        isOpenAction: boolean,
        location?: TrackHelpCentreClickLocation,
        helpCategory?: string,
        helpQuestion?: string,
    ): void => {
        if (!helpCategory || !helpQuestion || !location) {
            return;
        }

        this.addToDataLayer({
            event: EventTypes.HelpCentreClick,
            eventParams: {
                action: isOpenAction ? 'open' : 'close',
                location,
                helpCategory,
                helpQuestion,
            },
        });
    };

    public trackHelpWasUseful = (useful?: boolean, helpCategory?: string, helpQuestion?: string): void => {
        if (!helpCategory || !helpQuestion || useful === undefined) {
            return;
        }

        this.addToDataLayer({
            event: EventTypes.HelpWasUseful,
            eventParams: {
                useful: convertToYesNoString(useful),
                helpCategory,
                helpQuestion,
            },
        });
    };

    public trackBookingPrivacy = (isPrivate: boolean): void => {
        this.addToDataLayer({
            event: EventTypes.HolidayDataPrivacy,
            eventParams: {
                status: isPrivate ? 'Private' : 'Not Private',
            },
        });
    };

    public trackExtrasSpecialRequests = (specialRequests: Array<string> | undefined): void => {
        if (specialRequests?.length) {
            const { specialRequestsTypesByCode } = this.rootStore.hotelsStore;

            this.addToDataLayer({
                event: EventTypes.SpecialRequestExtras,
                eventParams: {
                    type: specialRequests
                        .reduce((res, el) => {
                            const code = specialRequestsTypesByCode[el];

                            if (!res.includes(code)) {
                                res.push(code);
                            }

                            return res;
                        }, [] as string[])
                        ?.join('|'),
                    numOfRequests: specialRequests.length,
                    reqsSelected: specialRequests.join('|'),
                },
            });
        }
    };

    public trackBookingSpecialRequests = (
        event: EventTypes,
        booking: IBookingInfo,
        oldSpecialRequests?: Array<IBookingSpecialRequest>,
    ): void => {
        const specialRequestsCodes = booking.specialRequests?.map(el => el.code);
        const specialRequestsCodesLength = specialRequestsCodes?.length ?? 0;
        const oldSpecialRequestsCodes = oldSpecialRequests?.map(el => el.code) || [];

        this.addToDataLayer({
            event,
            eventParams: {
                type: getSpecialRequestsGroupCodes(booking.specialRequests),
                bookingId: booking.bookingReference,
                numOfRequests: specialRequestsCodesLength,
                reqsSelected: specialRequestsCodes?.join('|') ?? '',

                ...(event === EventTypes.SpecialRequestPb && {
                    action: getSpecialRequestsAction(oldSpecialRequestsCodes, specialRequestsCodes),
                    prevNumOfRequests: oldSpecialRequestsCodes?.length || 0,
                    prevReqsSelected: oldSpecialRequestsCodes?.join('|') || '',
                }),
            },
        });
    };

    public trackPushNotification = (isOptIn: boolean): void =>
        this.addToDataLayer({ event: isOptIn ? EventTypes.PushOptIn : EventTypes.PushOptOut });

    public trackModuleClick = (eventParams: IModuleClickEventParams): void => {
        const moduleId = eventParams.moduleId.slice(MODULE_ID_INDEX);
        const destinationPath = purifyUrl(eventParams.destinationPath);

        this.addToDataLayer({
            event: EventTypes.ModuleClick,
            eventParams: { ...eventParams, moduleId, destinationPath },
        });
    };

    public errorTracking = (error: AxiosError<IApiErrorData>): void => {
        if (isAnalyticsDisabled() || !this.rootStore.layoutStore.layout?.sitecore?.route) {
            return;
        }

        const { response, message } = error;

        this.addToDataLayer({
            event: EventTypes.ErrorMessage,
            dimension13: getTimestamp(),
            dimension86: response?.status ?? message,
            dimension87: response?.data?.error ?? message,
            dimension88: response?.data?.code ?? '',
            dimension136: this.buildPageName(this.getPageTitle()),
        });
    };

    public trackValidation = (field: Nullable<string>, message: string): void => {
        this.addToDataLayer({
            event: EventTypes.ValidationMessage,
            dimension13: getTimestamp(),
            dimension93: field ?? '',
            dimension94: this.rootStore.layoutStore.getPhrase(message) || message,
            dimension136: this.pageName,
        });
    };

    public trackPromocodeError = (): void => {
        const { promocodeValidationErrors, promocodeErrorCode } = this.rootStore.bookingStore.promoCode;

        if (!promocodeValidationErrors?.length) return;

        let error;

        if (promocodeErrorCode === ApiErrors.PromocodeValidation) {
            error = [
                this.rootStore.layoutStore.getPhrase(SitecoreDictionary.HolidaysPromotionCriteriaErrorsMultipleErrors),
                promocodeValidationErrors.map(({ errorMessage }) => errorMessage).join(', '),
            ].join(' ');
        } else {
            const { rawErrorMessage, errorMessage } = promocodeValidationErrors[0];
            error = rawErrorMessage ?? errorMessage;
        }

        !!error && this.trackValidation('Promo Code', error);
    };

    protected buildBaseRecommenderEvent = (event: EventTypes, sidesOptions?: ISlidesOptions): IRecommenderEvent => {
        const recommender: IRecommenderEvent = {
            event,
            dimension13: getTimestamp(),
            dimension136: this.pageName,
            dimension147: this.bd4RecommenderPlacementId ?? '',
            dimension143: this.bd4RecommenderTracking?.pToken ?? '',
            dimension150: toJS(this.bd4RecommenderTracking?.recoInfo),
        };

        if (event === EventTypes.RecommenderNotLoaded || !sidesOptions) {
            return recommender;
        }

        if (event !== EventTypes.RecommenderHotelClick) {
            recommender.dimension148 = getSliderListOffset(sidesOptions.currentSlide, sidesOptions.slidesToSlide);
            recommender.dimension152 = getSliderListOffset(sidesOptions.previousSlide, sidesOptions.slidesToSlide);
        }

        recommender.dimension149 = sidesOptions.totalItems;
        recommender.dimension153 = sidesOptions.slidesToShow;

        return recommender;
    };

    protected trackRecommenderActiveOffer = (
        event: EventTypes,
        offer: IOffer,
        index: number,
        sidesOptions: ISlidesOptions,
        extraDimensions?: Partial<IRecommenderEvent>,
    ): void => {
        const baseRecoInfo = this.bd4RecommenderTracking?.recoInfo || { placementId: this.bd4RecommenderPlacementId };

        const recoInfo: any = {
            placementId: baseRecoInfo.placementId,
            modelId: baseRecoInfo.modelId,
            strategy: baseRecoInfo.strategy,
            position: getSliderListPosition(index, sidesOptions.currentSlide, sidesOptions.slidesToSlide),
        };

        if (offer.tracking?.campaignInfo?.length) {
            recoInfo.campaignInfo = toJS(offer.tracking.campaignInfo);
        }

        const recommender = {
            ...this.buildBaseRecommenderEvent(event, sidesOptions),
            id: offer.accom?.id,
            price: offer.pricePP,
            dimension15: offer.price,
            dimension155: getSliderListPosition(index, sidesOptions.currentSlide, sidesOptions.slidesToSlide),
            dimension150: recoInfo,
            ...extraDimensions,
        };

        if (offer.tracking?.campaignInfo?.length) {
            recommender.tracking = this.getCampaignInfo(offer.tracking.campaignInfo);
        }

        this.addToDataLayer(recommender);
    };

    private readonly createRecommenderDisplayEvent = (offers: IOffer[], sidesOptions: ISlidesOptions): void => {
        const baseEvent = this.buildBaseRecommenderEvent(EventTypes.RecommenderLoaded, sidesOptions);
        const firstIndex = baseEvent.dimension148!;
        const visibleOffers = (offers || []).slice(firstIndex, firstIndex + sidesOptions.slidesToShow);

        const displayEvent: IRecommenderEvent = {
            ...baseEvent,
            event: EventTypes.RecommenderLoaded,
            recommender: visibleOffers.map((offer, index) => {
                const baseOffer = {
                    id: offer.accom?.id || '',
                    price: offer.pricePP,
                    dimension15: offer.price,
                    position: firstIndex + index,
                };

                const campaignInfo = this.getCampaignInfo(offer.tracking?.campaignInfo);

                if (campaignInfo.campaignInfo) {
                    return { ...baseOffer, tracking: campaignInfo };
                }

                return baseOffer;
            }),
        };

        envAll.ENABLE_BD4_LOGGING && logger.info(`Recommender display event: ${JSON.stringify(displayEvent)}`);
        this.addToDataLayer(displayEvent);
    };

    protected trackRecommenderVisibleOffers = (
        event: EventTypes,
        offers: IOffer[],
        sidesOptions: ISlidesOptions,
    ): void => {
        const recommender = this.buildBaseRecommenderEvent(event, sidesOptions);
        const firstIndex = recommender.dimension148!;
        recommender.recommender = (offers || [])
            .slice(firstIndex, firstIndex + sidesOptions.slidesToShow)
            .map(offer => {
                const baseOffer = {
                    id: offer.accom?.id,
                    price: offer.pricePP,
                    dimension15: offer.price,
                };

                const campaignInfo = this.getCampaignInfo(offer.tracking?.campaignInfo);

                if (campaignInfo.campaignInfo) {
                    return { ...baseOffer, tracking: campaignInfo };
                }

                return baseOffer;
            });

        envAll.ENABLE_BD4_LOGGING && logger.info(`Recommended add to data layer: ${JSON.stringify(recommender)}`);
        this.addToDataLayer(recommender);
    };

    getFilterActionDimensions = (
        isSelectAction: boolean,
        filter?: IBaseFilterOption,
        quickFilterType?: TQuickFilterType,
    ): IFilterActionDimensions => ({
        dimension158: isSelectAction ? EventActions.Select : EventActions.Deselect,
        dimension159: this.getFilterCategoryTrackingName(filter?.groupCode, quickFilterType),
        dimension160: getFilterSelectionTrackingName(filter),
    });

    private readonly getQuickFilterCategoryTrackingName = (quickFilterType: TQuickFilterType): string => {
        const filterCategoryTrackingNameByGroupCode: Record<TQuickFilterType, string> = {
            [FilterGroupCodes.Recommended]: 'Recommended',
            [FilterGroupCodes.RecentlyUsed]: 'Recently Used',
        };

        return filterCategoryTrackingNameByGroupCode[quickFilterType];
    };

    getFilterCategoryTrackingName = (code?: string, quickFilterType?: TQuickFilterType): string => {
        if (quickFilterType) {
            return this.getQuickFilterCategoryTrackingName(quickFilterType);
        }

        if (!code) {
            return 'All';
        }

        // Static English labels for consistent filter update tracking across languages, taken from EN Sitecore
        const filterCategoryTrackingNameByGroupCode: Partial<Record<FilterGroupCodes, string>> = {
            [FilterGroupCodes.TripAdvisorRating]: 'Tripadvisor Rating',
            [FilterGroupCodes.StarRating]: 'Star Rating',
            [FilterGroupCodes.BoardType]: 'Board',
            [FilterGroupCodes.Facilities]: 'Facilities',
            [FilterGroupCodes.HotelTypes]: 'Holiday type',
            [FilterGroupCodes.Destination]: 'Destinations',
            [FilterGroupCodes.Flights]: 'Airport',
            [FilterGroupCodes.PriceRange]: 'Price',
            [FilterGroupCodes.PackageTheme]: 'Holiday type',
            [FilterGroupCodes.Duration]: 'Holiday duration',
            [FilterGroupCodes.Regions]: 'Destinations',
            [FilterGroupCodes.Topics]: 'Topics',
            [FilterGroupCodes.Date]: 'Date',
            [FilterGroupCodes.FlightTimes]: 'Flight Times',
            [FilterGroupCodes.Offers]: 'Offers',
            [FilterGroupCodes.FlightDuration]: 'Flight duration',
            [FilterGroupCodes.Weather]: 'Temperature',
        };

        if (Object.keys(filterCategoryTrackingNameByGroupCode).includes(code)) {
            return filterCategoryTrackingNameByGroupCode[code];
        }

        const originFilter = this.rootStore.searchFiltersStore.filters.find(filter => filter.code === code);

        const dictionary = getFilterTitle(originFilter ? originFilter.name : code);

        return dictionary ? this.rootStore.layoutStore.getPhrase(dictionary) : code;
    };

    private readonly getCampaignInfo = (campaignInfo?: string[]): { campaignInfo?: string[] } =>
        campaignInfo ? { campaignInfo: toJS(campaignInfo) } : {};

    trackTransferAndSportsEquipmentChange = (isTransferRemoveSE: boolean): void => {
        const { isEnoughTimeForAddSETransfer } = this.rootStore.bookingStore;
        const shortNoticeLabel = `Modal - Minus ${this.rootStore.layoutStore.SEAccommodationNoticePeriod} Days`;

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SportsEquipment,
                eventAction: isEnoughTimeForAddSETransfer ? EventActions.CannotAccommodateModal : shortNoticeLabel,
                eventLabel: EventLabels.Impression,
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({
                genericValue1: isTransferRemoveSE ? GenericValues.TransferRemoveSE : GenericValues.SERemoveTransfer,
                destinationUrl: null,
            }),
            undefined,
            undefined,
            { pageName: this.buildPageName(this.getPageTitle()) },
        );
    };

    trackBackToFlightsClick = async (backToFlightsUrl: string): Promise<void> => {
        const coreParamsOverride = {
            pageReferral: this.pageLoadObject?.pageReferral || null,
            referralPageName: this.pageLoadObject?.dimension10 || null,
            referralPageCategory: this.pageLoadObject?.dimension11 || null,
        };
        const customParams = generateGenericValues({
            destinationUrl: backToFlightsUrl,
        });
        await this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.AirlineInterstitialPage,
                eventCategory: EventCategories.HotelDetailsPage,
                eventLabel: EventLabels.Back,
                eventType: EventTypes.Interaction,
            },
            customParams,
            false,
            false,
            coreParamsOverride,
        );
    };

    trackUnavailablePopup = (): void => {
        const { adultsQuantity = 0, childrenQuantity = 0, infantsQuantity = 0 } = this.rootStore.searchStore.searchWho;
        const { from, to } = this.rootStore.searchStore.searchWhen;
        const { selectedOffer } = this.rootStore.bookingStore;
        const { type, theme, name } = selectedOffer?.hotel ?? {};
        const { isNotEnoughLCBForLuxBooking } = this.rootStore.bookingStore;

        const details = [name, theme?.name, type?.name].filter(Boolean).join(' | ');
        const routes = (selectedOffer?.transport?.routes ?? []).map(obj => obj.depName).join(' | ');
        const dates = [formatDateL10n(from, DATE_FORMATS.query), formatDateL10n(to, DATE_FORMATS.query)]
            .filter(Boolean)
            .join(' | ');
        const guests = getPassengerConfig(adultsQuantity, childrenQuantity, infantsQuantity);

        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.HolidayUnavailable,
                eventAction: isNotEnoughLCBForLuxBooking ? EventActions.PopupLux : EventActions.Popup,
                eventType: EventTypes.NonInteraction,
                eventLabel: isNotEnoughLCBForLuxBooking ? EventLabels.LCBFull : null,
            },
            {
                genericValue1: details,
                genericValue2: routes,
                genericValue3: dates,
                genericValue4: guests,
                destinationUrl: null,
            },
        );
    };

    trackCustomerFeedback = (name?: string, link?: ISitecoreField<ISitecoreLink>): void => {
        const { sitePath } = this.rootStore.layoutStore;

        this.trackEventWithParams(
            link ? EventTypes.FeefoFeedbackInteracted : EventTypes.FeefoFeedbackViewed,
            {
                name,
                cta: link?.value.text,
                destination: buildSitecoreLinkFullUrl(link, sitePath),
            },
            {},
            true,
        );
    };

    trackOpenBoardsPopup = (offer: IOfferWithoutAltBoards, eventLabel: string): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.SeeOptions,
                eventCategory: EventCategories.BoardOptions,
                eventLabel,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            {
                destinationUrl: this.pageTitle,
                genericValue1: offer.hotel?.name,
                genericValue2: offer.accom.unit[0]?.boardType?.title,
                genericValue3: null,
                genericValue4: null,
            },
        );
    };

    trackSelectAltBoard = (
        eventLabel: string,
        eventAction: string,
        customParams: ICustomParams,
        boardCode?: string,
    ): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction,
                eventCategory: EventCategories.BoardOptions,
                eventLabel,
                eventType: EventTypes.Interaction,
                eventValue: null,
            },
            customParams,
        );

        if (eventAction === EventActions.Select && boardCode) {
            const boardFilterOptions =
                this.rootStore.searchFiltersStore.filters.find(f => f.code === FilterGroupCodes.BoardType)?.options ||
                [];

            this.rootStore.engageStore.sendCustomEvent('BOARD_BASIS_CARD_SELECT', {
                boardBasis: resolveBoardBasis(boardCode, boardFilterOptions),
            });
        }
    };

    public trackEcoCertified = (event: EventTypes, action: string): void => {
        this.addToDataLayer({
            event,
            eventParams: {
                action,
            },
        });
    };

    buildSearchDetailObjectBase = (
        offers: IAlternativeOffer[],
        eventType: EventTypes,
        { dimension22, dimension25, dimension26 }: { dimension22: string; dimension25: string; dimension26: string },
    ): IDetailHolidayProduct => {
        const {
            searchFrom: { origins = [] },
            originsWithNames,
            searchTo: { selectedDestinations, isAnywhereSelected },
            searchWhen: { flexDays, isFlexible, to, from },
            searchWho: {
                roomsAllocation,
                roomsAllocationLength,
                isAutoAllocation,
                adultsQuantity,
                childrenQuantity,
                infantsQuantity,
            },
            page,
            take,
        } = this.rootStore.searchStore;

        const currencyCode = offers[0]?.currency?.code || this.rootStore.marketStore.currency;

        const searchDetailObject: IDetailHolidayProduct = {
            dimension108: eventType,
            currencyCode,
            dimension13: getTimestamp(),
            dimension18: getDepartureAirportsNames(origins, originsWithNames),
            dimension19: origins.join(ANALYTIC_SEPARATOR),
            dimension20: getOffersDestinationAirportsNames(offers),
            dimension21: getOffersDestinationAirportsCodes(offers),
            dimension22,
            dimension23: getDestinationNames(selectedDestinations, DestinationType.Country),
            dimension24: getDestinationCodes(selectedDestinations, DestinationType.Country),
            dimension25,
            dimension26,
            dimension27: getDestinationNames(selectedDestinations, DestinationType.Resort),
            dimension28: getDestinationCodes(selectedDestinations, DestinationType.Resort),
            dimension29: convertToYesNoString(origins.length > 1),
            dimension30: origins.length,
            dimension31: convertToYesNoString(selectedDestinations.length > 1),
            dimension32: selectedDestinations.length,
            dimension33: ProductDimensions.DateLevel,
            dimension34: getDepartureDateFlexibility(flexDays, isFlexible),
            dimension35: formatDateL10n(from, DATE_FORMATS.query),
            dimension36: formatDateL10n(from, DATE_FORMATS.yearMonthFormat),
            dimension37: getSeason(from),
            dimension40: from ? getDaysDifference(from, new Date()) : '',
            dimension41: ProductDimensions.DateLevel,
            dimension42: formatDateL10n(to, DATE_FORMATS.query),
            dimension43: formatDateL10n(to, DATE_FORMATS.yearMonthFormat),
            dimension44: getSeason(to),
            dimension47: to && from ? getDaysDifference(to, from) : '',
            dimension49: adultsQuantity + childrenQuantity,
            dimension50: getPassengerConfig(adultsQuantity, childrenQuantity, infantsQuantity),
            dimension51: adultsQuantity,
            dimension52: childrenQuantity,
            dimension53: infantsQuantity,
            dimension54: getNumberOfRooms(isAutoAllocation, roomsAllocationLength),
            dimension62: getFirstPositionOnPage(page, take),
            dimension79: getChildrenAge(roomsAllocation),
        };

        if (eventType === EventTypes.SearchFilterUpdate || eventType === EventTypes.PromoPageFilterUpdate) {
            this.addBd4DimensionsToObject(searchDetailObject);
        }

        if (eventType === EventTypes.OffersPriceViewChange) {
            searchDetailObject.dimension74 = this.rootStore.layoutStore.isOffersPriceViewTotal ? 'Total' : 'Per Person';
        } else {
            searchDetailObject.dimension61 = this.rootStore.hotelsStore.numberOfHotels;
            searchDetailObject.dimension75 = this.getSortValue();

            if (eventType !== EventTypes.FlightFiltersUpdate) {
                searchDetailObject.dimension162 = convertToYesNoString(isAnywhereSelected);
            }
        }

        return searchDetailObject;
    };

    protected abstract buildSearchDetailObject(
        offers: IAlternativeOffer[],
        eventType: EventTypes,
    ): IDetailHolidayProduct;

    protected buildEcommerceObjectOnPageLoad = async (): Promise<IEcommerceObject | null> => {
        const {
            isHotelDetailsBookPage,
            isSearchResultsPage,
            isExtrasPage,
            isGuestDetailsPage,
            isConfirmationPage,
            isPromoPage,
        } = this.rootStore.layoutStore;

        if (isHotelDetailsBookPage) {
            return this.addBookingFlowPageDimension(EventTypes.Ecommerce);
        }

        if (isSearchResultsPage) {
            return this.addSearchResultsDimensions(EventTypes.SearchCriteria);
        }

        if (isExtrasPage) {
            return this.addBookingFlowPageDimension(EventTypes.Extras);
        }

        if (isGuestDetailsPage) {
            return this.addBookingFlowPageDimension(EventTypes.Guest);
        }

        if (isConfirmationPage && shouldTrackPurchase()) {
            return this.addBookingConfirmationDimensions(EventTypes.Purchase);
        }

        if (isPromoPage) {
            return this.addSearchResultsDimensions(EventTypes.PromoPageDefaultFilters);
        }

        return null;
    };

    protected addSearchResultsDimensions = async (
        eventType: EventTypes,
        extraDetailDimensions?: IFilterActionDimensions,
        dimension108?: EventTypes,
    ): Promise<IEcommerceObject | null> => {
        const { layoutStore, hotelsStore, searchStore } = this.rootStore;
        const { isPromoPage, isSearchResultsPage } = layoutStore;

        if (!isPromoPage && !isSearchResultsPage) {
            return null;
        }

        await when(
            () =>
                hotelsStore.status !== DataStatus.Loading &&
                hotelsStore.status !== DataStatus.NotLoaded &&
                searchStore.searchTo.isLoadingDestinations === false,
        );

        if (hotelsStore.status === DataStatus.Error) {
            return null;
        }

        this.setPrices();

        const { offers } = hotelsStore;
        const detailsDimension108 = dimension108 ?? eventType;
        const impressionsDimension108 = dimension108 ?? EventTypes.ProductView;
        const detailObject = {
            ...(isSearchResultsPage
                ? this.buildSearchDetailObject(offers, eventType)
                : this.buildPromoPageDetailObject(offers, eventType)),
            ...extraDetailDimensions,
            dimension108: detailsDimension108,
        };

        const ecommerce = {
            event: eventType,
            dimension136: this.pageName,
            ecommerce: {
                detail: {
                    products: [detailObject],
                },
                impressions: offers.map((offer, index) => ({
                    ...this.buildBaseHolidayProduct(offer, impressionsDimension108, index),
                    ...this.buildUrgencyMessagingDimensions(eventType, offer.accom.unit),
                })),
            },
        } as any;

        if (eventType === EventTypes.SearchCriteria) {
            const prevSiteName = getSearchOriginPageTitle(layoutStore.prevTemplateId, layoutStore.prevLayoutName);
            ecommerce.onsite_search_origin = prevSiteName ? this.buildPageName(prevSiteName) : null;
        }

        return ecommerce;
    };

    public searchInteractionTrigger = async (
        searchResultsEvent: EventTypes,
        promoPageEvent: EventTypes,
        extraDetailDimensions?: IFilterActionDimensions,
    ): Promise<void> => {
        const { isSearchResultsPage } = this.rootStore.layoutStore;
        const eventType = isSearchResultsPage ? searchResultsEvent : promoPageEvent;
        const dimension108 =
            searchResultsEvent === EventTypes.SearchFilterUpdate && this.rootStore.queryParamsStore.isMap
                ? EventTypes.SearchFilterUpdateMap
                : undefined;

        const ecommerce = await this.addSearchResultsDimensions(eventType, extraDetailDimensions, dimension108);
        this.addToDataLayer(ecommerce);
        this.addToDataLayer({ event: EventTypes.Bd4tProductList });
    };

    public searchPaginationChangeTrigger = (): Promise<void> =>
        this.searchInteractionTrigger(EventTypes.SearchResultsPagination, EventTypes.PromoPagePagination);

    public trackSearchFiltersUpdate = async (
        isSelectAction: boolean,
        filter?: ITrackingFilterOption,
        quickFilterType?: TQuickFilterType,
    ): Promise<void> => {
        const extraDetailDimensions = this.getFilterActionDimensions(isSelectAction, filter, quickFilterType);

        if (isSelectAction && filter?.groupCode === FilterGroupCodes.BoardType && filter.code) {
            const boardFilterOptions =
                this.rootStore.searchFiltersStore.filters?.find(f => f.code === FilterGroupCodes.BoardType)?.options ||
                [];
            this.rootStore.engageStore.sendCustomEvent('BOARD_BASIS_FILTER', {
                boardBasis: resolveBoardBasis(filter.code, boardFilterOptions),
            });
        }

        await when(() => this.rootStore.hotelsStore.status === DataStatus.Loading);
        this.searchInteractionTrigger(
            EventTypes.SearchFilterUpdate,
            EventTypes.PromoPageFilterUpdate,
            extraDetailDimensions,
        );
    };

    public searchSortUpdateTrigger = (): Promise<void> =>
        this.searchInteractionTrigger(EventTypes.SearchSortUpdate, EventTypes.PromoPageSortUpdate);

    public searchEditTrigger = async (): Promise<void> => {
        const eventType = this.rootStore.layoutStore.isSearchResultsPage
            ? EventTypes.SearchCriteriaUpdate
            : EventTypes.PromoPageCriteriaUpdate;

        this.isPageLoadEventLoading = true;

        await this.initializePageLoadObject();
        this.addToDataLayer(this.pageLoadObject);

        const ecommerce = await this.addSearchResultsDimensions(eventType);

        // Should be called before adding ecommerce object to data layer
        await this.trackSearchCriteria(ecommerce?.ecommerce, EventTypes.SearchEdit);

        this.addToDataLayer(ecommerce);
        this.addToDataLayer({ event: EventTypes.Bd4tProductList });

        runInAction(() => (this.isPageLoadEventLoading = false));
    };

    trackSeatMapSitTogetherClick = (data: ISitTogetherClickedData): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SitTogetherCheckbox,
                eventAction: data.isChecked ? EventActions.Checked : EventActions.Unchecked,
                eventLabel: this.formatSeatMapSitTogetherEventLabel(data.flightDirection),
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({ destinationUrl: null }),
        );
    };

    trackSeatMapSitTogetherImpression = (data: ISitTogetherImpressionData): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.SitTogetherCheckbox,
                eventAction: `Impression: ${data.isAvailable ? EventActions.Available : EventActions.Unavailable}`,
                eventLabel: this.formatSeatMapSitTogetherEventLabel(data.flightDirection),
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({ destinationUrl: null }),
        );
    };

    private readonly formatSeatMapSitTogetherEventLabel = (flightDirection: SeatMapFlightDirection): string =>
        `Seats: ${flightDirection === SeatMapFlightDirection.Inbound ? 'Inbound' : 'Outbound'}`;

    isIEcommerceDetailObj = (data: TEnhancedEcommerce | undefined): data is IEcommerceDetail =>
        'detail' in (data || {});

    trackSearchCriteria = async (ecommerce: TEnhancedEcommerce | undefined, event: EventTypes): Promise<void> => {
        const { layoutStore, searchStore } = this.rootStore;
        const { isSearchResultsPage } = layoutStore;

        if (!isSearchResultsPage || !this.isIEcommerceDetailObj(ecommerce)) {
            return;
        }

        const isMonthSearch = searchStore.searchWhen.isMonthSearch;

        await when(() => searchStore.searchWhen.hasCheapestMonthLoaded);

        const product = ecommerce?.detail.products[0];
        const {
            currencyCode,
            dimension19,
            dimension34,
            dimension35,
            dimension37,
            dimension40,
            dimension42,
            dimension44,
            dimension47,
            dimension50,
            dimension54,
            dimension61,
            dimension62,
            dimension75,
            dimension162,
        } = product;

        const selectedCountries = new Set<string>();
        const holidaySearchSelections: Set<IHolidaySearchSelection> = new Set();

        for (const dest of searchStore.searchTo.selectedDestinations) {
            const country = getParentDestinationByCode(dest.code, searchStore.searchTo.countriesWithRegions);
            country && selectedCountries.add(country.code);

            const destinationSearchSelection = createToSearchSelectionItem(dest);
            holidaySearchSelections.add(destinationSearchSelection);
        }

        for (const code of searchStore.searchFrom.selectedOrigins) {
            const airport = searchStore.searchFrom.airports.get(code);
            const country = getCountryNameOfAirportByCode(code, searchStore.searchFrom.country);

            if (airport) {
                const airportSearchSelection = createFromSearchSelectionItem(airport, country);
                holidaySearchSelections.add(airportSearchSelection);
            }
        }

        const departureDate = `${dimension35}${
            searchStore.searchWhen.isCheapestMonthSelected ? ` | ${SearchPodGenericValues.CheapestMonth}` : ''
        }`;

        const data: ISearchCriteria = {
            event,
            holidaySearchSelections: Array.from(holidaySearchSelections),
            currencyCode,
            pageName: this.pageName,
            multiple_departure_airports_number: dimension19.length ? dimension19.split(ANALYTIC_SEPARATOR).length : 0,
            multiple_destinations_number: selectedCountries.size,
            departure_date_flexibility: isMonthSearch ? 'Month' : dimension34,
            departure_date: departureDate,
            departure_season: dimension37,
            days_to_departure: dimension40,
            return_date: dimension42,
            return_season: dimension44,
            number_of_nights: dimension47,
            pax_config: dimension50,
            rooms_number: dimension54,
            search_results_number: dimension61,
            pagination_first_page_results: dimension62,
            sort_by: dimension75,
            anywhere_selected: dimension162,
            pageReferral: this.pageLoadObject?.pageReferral || '',
        };

        this.addToDataLayer(data);
    };

    generateGenericValuesWithGuests = (customParams: ICustomParams = {}): ICustomParams => {
        const { adults, children, infants } = getGuestsAmount(this.rootStore.viewBookingStore.booking?.guests || []);

        return generateGenericValues({
            genericValue3: getPassengerConfig(adults, children, infants),
            genericValue4: this.bookingId,
            ...customParams,
        });
    };

    trackManageHubClick = (): Promise<void> => {
        const microAppManageHubPath = this.rootStore.routerStore.getMicroAppPage(SitePath.ManageHub);

        // To be sure the post request went to google server before redirect to another application happen
        // Redirect to another app cancels the request
        return new Promise(resolve => {
            const _fetch = globalThis.fetch;

            const timer = setTimeout(() => {
                globalThis.fetch = _fetch;
                resolve();
            }, SAFE_RESOLVE_TIMEOUT);

            globalThis.fetch = function (input, init, ...args): Promise<Response> {
                const isGtmUrl = typeof input === 'string' && input.includes('google-analytics.com/g/collect');

                return _fetch.apply(this, [input, init, ...args]).finally(() => {
                    if (isGtmUrl) {
                        globalThis.fetch = _fetch;
                        clearTimeout(timer);

                        resolve();
                    }
                });
            };

            this.trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.Holidays,
                    eventType: EventTypes.Interaction,
                    eventAction: EventActions.ViewBooking,
                    eventLabel: EventLabels.ManageHoliday,
                },
                this.generateGenericValuesWithGuests({
                    destinationUrl: microAppManageHubPath,
                }),
            );
        });
    };

    trackMapEvent = ({ action, label }: { action?: EventActions | string; label?: EventLabels | string }): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Map,
                eventAction: action,
                eventLabel: label,
                eventType: EventTypes.Interaction,
            },
            {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            },
        );
    };

    trackMapPointsOfInterestInteraction = (label: string): void => {
        this.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.Map,
                eventAction: EventActions.POI,
                eventLabel: label,
                eventType: EventTypes.Interaction,
            },
            {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: null,
                destinationUrl: null,
            },
        );
    };

    trackOptimizelyDecisionData = ({ userId, attributes, decisionInfo }: DecisionListenerPayload): void => {
        const { ruleKey, flagKey, enabled, variationKey, decisionEventDispatched } = decisionInfo as FlagDecisionInfo;

        if (!decisionEventDispatched) {
            return;
        }

        this.addToDataLayer({
            event: EventTypes.OptimizelyFlagDecision,
            userId,
            ruleKey,
            flagKey,
            variationKey,
            isEnabled: enabled,
            ...attributes,
        });
    };
}
