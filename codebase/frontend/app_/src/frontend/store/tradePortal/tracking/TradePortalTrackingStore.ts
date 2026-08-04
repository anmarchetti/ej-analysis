import { makeObservable, runInAction, when } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { formatDateL10n, getDaysDifferenceRoundedFloor } from 'frontend/utils/date.utils';
import isBackend from 'frontend/utils/isBackend';
import { getHotelContractType } from 'frontend/utils/offer.utils';
import { setTransactionTracked } from 'frontend/utils/paymentTransaction';
import { isAnalyticsDisabled } from 'frontend/utils/tracking/isAnalyticsDisabled';
import {
    getBoardsTypes,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationNames,
    getGuests,
    getRoomsTypesTitles,
    getRoutesDepartureDaysDifference,
    getSeason,
    getSeatCategory,
    getTimestamp,
} from 'frontend/utils/tracking/tracking.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { AmendmentType } from 'models/data/IBookingInfo';
import { IBaseFilterOption } from 'models/data/IFilters';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { IDetailHolidayProduct } from 'models/data/tracking/IProduct';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { GuestTypes } from 'models/enum/tracking/GuestTypes';
import { ProductDimensions } from 'models/enum/tracking/ProductCategories';

class TradePortalTrackingStore extends BaseTrackingStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);

        if (!isBackend()) {
            (window as any).errorTracking = this.errorTracking;
        }
    }

    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    protected override buildSearchDetailObject(
        offers: IAlternativeOffer[],
        eventType: EventTypes,
    ): IDetailHolidayProduct {
        const {
            searchTo: { selectedDestinations },
        } = this.rootStore.searchStore;

        const dimension22 = getDestinationLevels(selectedDestinations);
        const dimension25 = getDestinationNames(selectedDestinations, DestinationType.Region);
        const dimension26 = getDestinationCodes(selectedDestinations, DestinationType.Region);

        return this.buildSearchDetailObjectBase(offers, eventType, { dimension22, dimension25, dimension26 });
    }

    /**
     * Pageload tracking
     */

    public callTagManager = async (): Promise<void> => {
        if (isAnalyticsDisabled()) {
            return;
        }

        this.isPageLoadEventLoading = true;

        await this.initializePageLoadObject();
        const ecommerce = await this.buildEcommerceObjectOnPageLoad();

        // Should be called before adding ecommerce object to data layer
        await this.trackSearchCriteria(ecommerce?.ecommerce, EventTypes.Search);

        // Ecommerce event should be always before page load!
        this.addToDataLayer(ecommerce);
        this.addToDataLayer(this.pageLoadObject);

        const { layoutStore, bookingStore } = this.rootStore;

        if (layoutStore.isSearchResultsPage || layoutStore.isPromoPage) {
            this.addToDataLayer({ event: EventTypes.Bd4tProductList });
        }

        if (layoutStore.isConfirmationPage && ecommerce) {
            const { booking } = bookingStore;

            setTransactionTracked();

            if (booking?.specialRequests?.length) {
                this.trackBookingSpecialRequests(EventTypes.SpecialRequestPurchase, booking);
            }
        }

        if (layoutStore.isDestinationPage && !layoutStore.isHotelDetailsBrowsePage) {
            this.addDestinationGuideDimensions();
        }

        layoutStore.isHolidayTypePage && this.trackHolidayTypes();

        runInAction(() => (this.isPageLoadEventLoading = false));
    };

    /**
     * Search Results and Promo Pages interaction triggers
     * */

    /**
     * Hotel details page interaction
     */
    public holidayConfigChangeTrigger = (eventType: EventTypes, priceDiff: number, prevRoutes?: IRoute[]): void => {
        const offer = this.rootStore.bookingStore.selectedOffer as IOffer;

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

        const holidayConfig = {
            event: eventType,
            dimension136: this.pageName,
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
                            dimension18: outboundInfo.depItemName || outboundInfo.depName,
                            dimension19: outboundInfo.depPt,
                            dimension20: outboundInfo.arrItemName || outboundInfo.arrName,
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

    public expandPriceGraphTrigger = (): void => this.addPageAndTimestampDimensions(EventTypes.PriceGraphExpanded);

    public trackOffersPriceViewChange = async (): Promise<void> => {
        const { layoutStore, hotelsStore, searchStore } = this.rootStore;
        const { isPromoPage, isSearchResultsPage } = layoutStore;

        if (!isPromoPage && !isSearchResultsPage) return;

        await when(
            () =>
                hotelsStore.status !== DataStatus.Loading &&
                hotelsStore.status !== DataStatus.NotLoaded &&
                searchStore.searchTo.isLoadingDestinations === false,
        );

        if (hotelsStore.status === DataStatus.Error) return;

        this.setPrices();

        const { offers } = hotelsStore;
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
        const eventType = EventTypes.FlightFiltersUpdate;
        const offers = this.rootStore.alternativeFlightsStore.sortAndFilterFlights(
            this.rootStore.bookingStore.alternativeFlights,
        );
        const detailObject = this.buildSearchDetailObject(offers, eventType);
        const extraDetailDimensions = this.getFilterActionDimensions(isSelectAction, filter);

        this.addToDataLayer({
            event: eventType,
            dimension136: this.pageName,
            ecommerce: {
                detail: {
                    products: [{ ...detailObject, ...extraDetailDimensions }],
                },
            },
        });
    };

    public trackSuccessfulAmendment = (): void => {
        const amendmentType = this.rootStore.viewBookingStore.successfulAmendmentStatus;

        switch (amendmentType) {
            case AmendmentType.Seats:
                this.trackSeatsAmendment();
                break;
        }
    };
}

export default TradePortalTrackingStore;
