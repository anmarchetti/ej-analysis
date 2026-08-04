import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { getCreditPaidAmount } from 'frontend/utils/payment.utls';
import { getCategoryLabel, getTimestamp } from 'frontend/utils/tracking/tracking.utils';
import { getSearchDetailObject, getSearchDetailsForBooking } from 'frontend/utils/tracking/trackingList.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IRoomVariant } from 'models/data/bookingAmendment/AmendRoomAndBoard';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { IAmendHotelTrackingPayload } from 'models/data/tracking/AmendPayload';
import { IEcommerceDetailsObject } from 'models/data/tracking/IEcommerceObject';
import {
    IAmendPaymentTrackingPayload,
    IAmendTransferProduct,
    IBaseHolidayProduct,
    IFeesProduct,
    ISecondaryHolidayProduct,
    TProduct,
} from 'models/data/tracking/IProduct';
import { ISearchDependenciesData } from 'models/data/tracking/ISearch';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import { OrderBy, RecommendedOrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import { ProductCategories } from 'models/enum/tracking/ProductCategories';

export class TrackingHotelChangeStore {
    // Store them here to get for confirmation event
    trackingSecondaryProducts: Record<'transfer' | 'roomAndBoard', Nullable<ISecondaryHolidayProduct>> = {
        roomAndBoard: null,
        transfer: null,
    };

    initialOfferData: Nullable<IAmendHotelTrackingPayload> = null;

    constructor(public rootStore: HolidaysRootStore) {}

    getAmendHotelSortDimension = (selectedSortingOption: AlternativeHotelsSortingOptions): string =>
        [OrderBy, OrderDirection]
            .map(type => {
                const regExp = new RegExp(Object.values(type).join('|'), 'i');
                const matchString = selectedSortingOption.match(regExp)?.[0] || '';

                return `${matchString.charAt(0).toLowerCase()}${matchString.slice(1)}`;
            })
            .join(': ');

    readonly updateInitialDataFromHotelOffer = (amendHotel: IAmendHotelOffer): void => {
        this.initialOfferData = {
            // amendmentChargesInfo have no any info about fee
            // Need to follow initial offer chosen
            amendmentPaymentInfo: {
                amendmentCharges: amendHotel.amendmentChargesInfo.fullAmendmentCharges,
                amendmentChargesWithoutFees: amendHotel.amendmentChargesInfo.fullAmendmentCharges,
                feesPerPersons: [],
                packagePriceWithFees: amendHotel.amendmentChargesInfo.offerPrice,
                packagePriceWithoutFees: amendHotel.amendmentChargesInfo.offerPrice,
                totalFeesAmount: 0,
            },
            transfers: amendHotel.transfers,
            unit: amendHotel.accom.unit,
        };
    };

    initializeFromPaymentPayload = (payload: Nullable<IAmendPaymentTrackingPayload>): void => {
        this.initialOfferData = payload?.initialData;
        this.trackingSecondaryProducts = {
            transfer: payload?.secondaryProducts?.transfer,
            roomAndBoard: payload?.secondaryProducts?.roomAndBoard,
        };
    };

    private readonly pushHotelChangeEvent = (
        additionalCustomParams: Record<string, Nullable<string | number>>,
        additionalEventParams: Record<string, Nullable<string | number>>,
    ): void => {
        const {
            viewBookingStore: { booking },
        } = this.rootStore;

        if (!booking) return;

        const coreParams = this.rootStore.trackingStore.buildCoreParamsObject();
        const customParams = this.rootStore.trackingStore.generateGenericValuesWithGuests({
            genericValue1: null,
            genericValue2: null,
            genericValue4: booking.bookingReference,
            destinationUrl: `${this.rootStore.layoutStore.sitePath}${SitePath.AmendHotel}`,
            ...additionalCustomParams,
        });
        const eventParams = {
            eventCategory: EventCategories.Holidays,
            eventAction: EventLabels.ChangeHotel,
            eventType: EventTypes.Interaction,
            ...additionalEventParams,
        };

        this.rootStore.trackingStore.addToDataLayer({
            event: EventTypes.GenericEvent,
            coreParams,
            customParams,
            eventParams,
        });
    };

    private readonly buildRoomVariantFromHotelOffer = (hotelPackage: IAmendHotelOffer): IRoomVariant => {
        const amendmentCharges = hotelPackage.amendmentChargesInfo?.amendmentCharges || 0;

        return {
            amendmentCharges,
            amendmentPaymentInfo: {
                ...hotelPackage.amendmentPaymentInfo,
                amendmentCharges,
            },
            boardType: hotelPackage.accom.unit[0].boardType.code,
            bookingPrice: hotelPackage.amendmentPaymentInfo.packagePriceWithoutFees,
            fullAmendmentCharges: hotelPackage.amendmentChargesInfo.fullAmendmentCharges,
            offerPrice: hotelPackage.amendmentChargesInfo.offerPrice,
            offerPricePp: hotelPackage.amendmentChargesInfo.offerPpPrice,
            promoCodeBreakDown: hotelPackage.amendmentChargesInfo.promoCodeBreakDown,
            roomType: hotelPackage.accom.unit[0].roomType.code,
            seatsPrice: hotelPackage.amendmentChargesInfo?.seatsPrice,
            units: hotelPackage.accom.unit,
        };
    };

    private readonly getOfferFromAmendHotelOffer = (
        amendHotelOffer: IAmendHotelOffer,
        booking: IBookingInfo,
    ): IOfferWithoutAltBoards => ({
        extraLuggageInfo: amendHotelOffer.extraLuggageInfo,
        date: amendHotelOffer.accom.date,
        hasDistressedFlights: false,
        id: `${amendHotelOffer.accom.code}_PB`,
        price: amendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        // PricePP - the overall price, cause quantity will be 1
        pricePP: amendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        stay: amendHotelOffer.accom.stay,
        transport: booking.package.transport,
        transfers: amendHotelOffer.transfers,
        hotel: amendHotelOffer.hotel,
        accom: amendHotelOffer.accom,
        // Price of the full amendment charges for package, not just the charges of the option
        totalPrice: amendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        touristTax: 0,
        touristTaxPP: 0,
        hasDiscountedBoardUpgrade: false,
        priceExcludingTouristTax: amendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        pricePPExcludingTouristTax: amendHotelOffer.amendmentPaymentInfo.amendmentCharges,
    });

    private readonly getOfferFromAmendHotelListItem = (
        amendHotelOffer: IAmendHotelOffer,
        booking: IBookingInfo,
    ): IOfferWithoutAltBoards =>
        this.getOfferFromAmendHotelOffer(
            {
                ...amendHotelOffer,
                amendmentPaymentInfo: {
                    ...amendHotelOffer.amendmentPaymentInfo,
                    amendmentCharges: amendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
                },
            },
            booking,
        );

    getAmendHotelProduct = (amendHotelOffer: IAmendHotelOffer): Nullable<IBaseHolidayProduct> => {
        const { booking } = this.rootStore.viewBookingStore;

        if (!booking) return null;

        const { amendmentCharges, productPrice, metric6 } = this.rootStore.trackingStore.getPrices(
            amendHotelOffer.amendmentPaymentInfo,
        );

        const offer = this.getOfferFromAmendHotelOffer(amendHotelOffer, booking);

        return this.rootStore.trackingStore.buildBaseHolidayProduct(offer, EventTypes.PostBookingChangeHotelUpdate, 0, {
            category: this.getChangeHotelCategory(amendmentCharges),
            price: productPrice,
            metric6,
            quantity: 1,
            dimension15: amendmentCharges,
            id: `${amendHotelOffer.accom.code}_PB`,
            name: `${amendHotelOffer.hotel.name}_PB`,
        });
    };

    updateRoomAndBoardSecondaryProduct = (
        newlySelectedHotelOffer: IAmendHotelOffer,
        roomAndBoardProduct: Nullable<IBaseHolidayProduct>,
    ): void => {
        const {
            trackingStore: {
                roomAndBoard: { getRoomAndBoardType, getRoomAndBoardsSuffixAndName },
            },
        } = this.rootStore;

        if (!this.initialOfferData?.unit || !roomAndBoardProduct) return;

        const initialType = getRoomAndBoardType(this.initialOfferData.unit);
        const newType = getRoomAndBoardType(newlySelectedHotelOffer.accom.unit);

        // Name to compare initial and new packages
        const { name } = getRoomAndBoardsSuffixAndName(this.initialOfferData.unit, newlySelectedHotelOffer.accom.unit);

        this.trackingSecondaryProducts.roomAndBoard =
            initialType === newType
                ? null
                : this.getSecondaryProduct({
                      ...roomAndBoardProduct,
                      ...this.getSecondaryProductPriceMeta('roomAndBoard'),
                      name,
                  });
    };

    updateTransferSecondaryProduct = (
        selectedTransfer: ITransferWithAmendmentCharges,
        transferProduct: Nullable<IAmendTransferProduct>,
    ): void => {
        const {
            amendHotelStore: { newlySelectedHotelOffer },
        } = this.rootStore;

        if (!this.initialOfferData?.transfers || !transferProduct || !newlySelectedHotelOffer) return;

        const areTransfersEquals = this.initialOfferData.transfers[0].type === selectedTransfer.transfer.type;

        this.trackingSecondaryProducts.transfer = areTransfersEquals
            ? null
            : this.getSecondaryProduct({
                  ...transferProduct,
                  ...this.getSecondaryProductPriceMeta('transfer'),
              });
    };

    getSecondaryProductPriceMeta = (
        secondaryProductType: keyof typeof this.trackingSecondaryProducts,
    ): {
        category: string;
        price: number;
    } => {
        const {
            amendHotelStore: { newlySelectedHotelOffer },
        } = this.rootStore;

        if (!newlySelectedHotelOffer || !this.initialOfferData)
            return {
                price: 0,
                category: '',
            };

        const { amendmentCharges: currentPrice } = newlySelectedHotelOffer.amendmentPaymentInfo;
        const { amendmentCharges: hotelPrice } = this.initialOfferData.amendmentPaymentInfo;

        const anotherProductType: keyof typeof this.trackingSecondaryProducts =
            secondaryProductType === 'transfer' ? 'roomAndBoard' : 'transfer';
        const anotherProductPrice = this.trackingSecondaryProducts[anotherProductType]?.price || 0;

        const priceDifference = +(currentPrice - hotelPrice - anotherProductPrice).toFixed(2);

        const label =
            secondaryProductType === 'transfer' ? ProductCategories.Transfers : ProductCategories.RoomAndBoard;

        return {
            price: priceDifference,
            category: getCategoryLabel(label, priceDifference),
        };
    };

    private readonly getSecondaryProduct = (
        baseProduct: Nullable<(Omit<IBaseHolidayProduct, 'category'> & { category: string }) | IAmendTransferProduct>,
    ): Nullable<ISecondaryHolidayProduct> => {
        if (!baseProduct) return null;

        const { productPrice, metric6 } = this.rootStore.trackingStore.getPrices({
            amendmentCharges: baseProduct.price,
        });

        return {
            category: baseProduct.category,
            name: baseProduct.name,
            id: baseProduct.id || '',
            quantity: 1,
            price: productPrice,
            metric6,
            currencyCode: baseProduct.currencyCode,
        };
    };

    get pageNameLabel(): string {
        return `Post Booking: ${this.rootStore.trackingStore.pageName}`;
    }

    private readonly getEcommerceEvent = (
        eventType: EventTypes,
        changePrice: number,
        products: Nullable<TProduct | ISecondaryHolidayProduct>[],
    ): IEcommerceDetailsObject | null => {
        const {
            viewBookingStore: { booking },
            trackingStore: { getPrices },
            marketStore: { currency },
        } = this.rootStore;

        if (!booking) return null;

        const { metric6 } = getPrices({
            amendmentCharges: changePrice,
        });

        return {
            event: eventType,
            dimension136: this.pageNameLabel,
            dimension173: booking?.bookingReference,
            metric6,
            ecommerce: {
                currencyCode: booking?.currency?.code || currency,
                detail: {
                    actionField: {
                        list: this.pageNameLabel,
                    },
                    products,
                },
            },
        };
    };

    getHotelChangeProducts = (
        newlySelectedHotelOffer: IAmendHotelOffer,
    ): Nullable<TProduct | ISecondaryHolidayProduct | IFeesProduct>[] => {
        if (!this.initialOfferData) return [];

        const { roomAndBoard: roomAndBoardProduct, transfer: transferProduct } = this.trackingSecondaryProducts;

        const hotelOfferWithInitialPrices = {
            ...newlySelectedHotelOffer,
            amendmentPaymentInfo: this.initialOfferData.amendmentPaymentInfo,
        };
        const products: Nullable<IBaseHolidayProduct | ISecondaryHolidayProduct | IFeesProduct>[] = [];

        const changeHotelProduct = this.getAmendHotelProduct(hotelOfferWithInitialPrices);

        const prices = this.rootStore.trackingStore.getPrices(newlySelectedHotelOffer.amendmentPaymentInfo, true);

        if (changeHotelProduct) {
            products.push({
                ...changeHotelProduct,
                dimension15: newlySelectedHotelOffer.amendmentPaymentInfo.amendmentCharges,
            });
        }

        if (roomAndBoardProduct) {
            products.push(roomAndBoardProduct);
        }

        if (transferProduct) {
            products.push(transferProduct);
        }

        if (prices.fees) {
            products.push(this.rootStore.trackingStore.buildFeesAnalyticProduct(prices.fees));
        }

        return products;
    };

    getChangeHotelCategory = (price: number): string => getCategoryLabel(ProductCategories.ChangeHotel, price);

    clickOnManageButton = (): void => {
        this.pushHotelChangeEvent({}, { eventLabel: EventLabels.ManageHoliday, eventAction: EventActions.ViewBooking });
    };

    clickOnChangeHotelButton = (booking: IBookingInfo): void => {
        this.pushHotelChangeEvent(
            { genericValue1: GenericValue.PopUp, genericValue2: booking.hotel?.name || null },
            { eventLabel: EventLabels.ChangeHotel, eventAction: EventActions.ViewBooking },
        );
    };

    noAlternativeHotelsTracking = (): void => {
        this.rootStore.trackingStore.trackCustomError(EventLabels.ChangeHotel, 'No alt hotel for these dates');
    };

    validationErrorHotelTracking = (): void => {
        this.rootStore.trackingStore.trackCustomError(EventLabels.ChangeHotel, 'No Longer available');
    };

    clickOnTransferChange = (): void => {
        this.pushHotelChangeEvent({ destinationUrl: '' }, { eventLabel: EventLabels.EditYourTransfer });
    };

    clickOnRoomAndBoardChange = (): void => {
        this.pushHotelChangeEvent({ destinationUrl: '' }, { eventLabel: EventLabels.EditYourRoomAndBoard });
    };

    clickOnTransferConfirm = (selectedTransfer: ITransferWithAmendmentCharges): void => {
        const {
            trackingStore: { buildAmendTransferProduct },
            viewBookingStore: { booking },
            amendHotelStore: { newlySelectedHotelOffer },
        } = this.rootStore;

        if (!booking || !newlySelectedHotelOffer) return;

        const { amendmentCharges } = newlySelectedHotelOffer.amendmentChargesInfo;
        const newOffer = this.getOfferFromAmendHotelOffer(newlySelectedHotelOffer, booking);
        const transferProduct = buildAmendTransferProduct(newOffer, EventTypes.AmendTransferSelect, {
            ...selectedTransfer,
            amendmentCharges,
        });

        if (!transferProduct) return;

        transferProduct.dimension15 = newOffer.totalPrice || 0;

        // Update secondary product with price of the option, but not price of the package
        this.updateTransferSecondaryProduct(selectedTransfer, transferProduct);

        const data = this.getEcommerceEvent(
            EventTypes.AmendTransferUpdate,
            newlySelectedHotelOffer.amendmentChargesInfo.amendmentCharges,
            [transferProduct],
        );

        this.rootStore.trackingStore.addToDataLayer(data);
    };

    clickOnRoomAndBoardConfirm = (
        prevSelectedHotelOffer: IAmendHotelOffer,
        newlySelectedHotelOffer: IAmendHotelOffer,
    ): void => {
        const {
            viewBookingStore: { booking },
            trackingStore: {
                roomAndBoard: { buildAmendRoomAndBoardProduct },
            },
        } = this.rootStore;

        if (!booking) return;

        // Need to get difference,
        // cause variants could be chosen multiple times within popup with re-fetched list
        const priceDifference =
            newlySelectedHotelOffer.amendmentPaymentInfo.amendmentCharges -
            prevSelectedHotelOffer.amendmentPaymentInfo.amendmentCharges;

        const newRoomVariant = this.buildRoomVariantFromHotelOffer(newlySelectedHotelOffer);
        const prevRoomVariant = this.buildRoomVariantFromHotelOffer(prevSelectedHotelOffer);
        const offer = this.getOfferFromAmendHotelOffer(newlySelectedHotelOffer, booking);

        const roomAndBoardProduct = buildAmendRoomAndBoardProduct(
            EventTypes.PostBookingChangeBoardUpdate,
            offer,
            prevRoomVariant,
            {
                ...newRoomVariant,
                amendmentCharges: priceDifference,
                amendmentPaymentInfo: {
                    ...newRoomVariant.amendmentPaymentInfo,
                    amendmentCharges: priceDifference,
                },
            },
        );

        if (!roomAndBoardProduct) return;

        const areTransfersEquals =
            newlySelectedHotelOffer.transfers[0].type === prevSelectedHotelOffer.transfers[0].type;

        // New RBC package can come with shuttle bus transfer
        if (!areTransfersEquals) {
            this.trackingSecondaryProducts.transfer = null;
        }

        this.updateRoomAndBoardSecondaryProduct(newlySelectedHotelOffer, roomAndBoardProduct);

        const data = this.getEcommerceEvent(
            EventTypes.PostBookingChangeBoardUpdate,
            newlySelectedHotelOffer.amendmentChargesInfo.amendmentCharges,
            [roomAndBoardProduct],
        );

        this.rootStore.trackingStore.addToDataLayer(data);
    };

    trackHotelConfirm = (): void => {
        const {
            amendHotelStore: { newlySelectedHotelOffer },
        } = this.rootStore;

        if (!newlySelectedHotelOffer || !this.initialOfferData) return;

        const products: Nullable<TProduct | ISecondaryHolidayProduct>[] =
            this.getHotelChangeProducts(newlySelectedHotelOffer);

        const data = this.getEcommerceEvent(
            EventTypes.PostBookingChangeHotelUpdate,
            newlySelectedHotelOffer.amendmentPaymentInfo.amendmentCharges,
            products,
        );

        this.rootStore.trackingStore.addToDataLayer(data);
    };

    trackSuccessFullAmendment = (): void => {
        const {
            viewBookingStore: { viewBookingPayload, booking },
            trackingStore: { buildPageName, getPrices },
        } = this.rootStore;

        if (
            !viewBookingPayload?.amendPaymentPayload?.trackingData?.initialData ||
            !viewBookingPayload?.amendPaymentPayload?.amendHotelOffer ||
            !booking
        ) {
            return;
        }

        const {
            trackingData,
            amendHotelOffer: { amendmentPaymentInfo, amendmentChargesInfo },
        } = viewBookingPayload.amendPaymentPayload;

        this.initializeFromPaymentPayload(trackingData);

        if (!this.initialOfferData?.amendmentPaymentInfo) return;

        const products: Nullable<Partial<TProduct>>[] = this.getHotelChangeProducts(
            viewBookingPayload.amendPaymentPayload.amendHotelOffer,
        );

        const prices = getPrices(amendmentPaymentInfo, true);

        const dimension66 = this.rootStore.viewBookingStore.dimension66;
        const paymentMethod = this.rootStore.viewBookingStore.paymentMethod;

        const data = {
            event: EventTypes.PostBookingConfirmationBasket,
            dimension136: buildPageName(`Post Booking: Change Hotel Confirmation`),
            dimension173: booking?.bookingReference,
            metric6: prices.metric6,
            ecommerce: {
                purchase: {
                    actionField: {
                        event: EventTypes.PostBookingConfirmationBasket,
                        id: `${booking?.bookingReference}_${Date.now()}_PB_HC`,
                        timestamp: getTimestamp(),
                        revenue: prices.revenue,
                        coupon: amendmentChargesInfo.promoCodeBreakDown?.promoCode,
                        metric3: getCreditPaidAmount(booking.paymentInfo) ?? 0,
                        action: 'purchase',
                    },
                    products,
                },
            },
            dimension66: dimension66 ?? '',
            paymentMethod: paymentMethod ?? '',
        };

        this.rootStore.trackingStore.addToDataLayer(data);
    };

    clearStore = (): void => {
        this.initialOfferData = null;
        this.trackingSecondaryProducts.transfer = null;
        this.trackingSecondaryProducts.roomAndBoard = null;
    };

    firePriceJumpPopupEvent = (priceDelta: number, interaction: string, eventType: EventTypes): void => {
        this.pushHotelChangeEvent(
            {
                genericValue1: priceDelta,
                genericValue2: interaction,
                destinationUrl: '',
            },
            {
                eventLabel: EventLabels.PriceChange,
                eventType,
            },
        );
    };

    priceJumpPopupAppearEvent = (priceDelta: number): void => {
        this.firePriceJumpPopupEvent(priceDelta, 'Pop Up Module', EventTypes.NonInteraction);
    };

    priceJumpPopupInteractionEvent = (priceDelta: number, isAccepted?: boolean): void => {
        this.firePriceJumpPopupEvent(priceDelta, isAccepted ? 'Accept' : 'No Thanks', EventTypes.Interaction);
    };

    trackSortHotelList = (altHotelOffers: IAmendHotelOffer[]): void => {
        this.fireHotelListImpressionEvent(altHotelOffers, EventTypes.SearchSortUpdate);
    };

    trackHotelListImpressionEvent = (altHotelOffers: IAmendHotelOffer[]): void => {
        // Because initialize of the "page load event" can happen after this event fire and page's name hasn't changed
        setTimeout(() => {
            this.fireHotelListImpressionEvent(altHotelOffers, EventTypes.SearchChangeHotel, RecommendedOrderBy.Bd4);
        });
    };

    fireHotelListImpressionEvent = (
        altHotelOffers: IAmendHotelOffer[],
        eventType: EventTypes,
        sortDimension?: RecommendedOrderBy,
    ): void => {
        const {
            viewBookingStore: { booking },
            trackingStore: { buildBaseHolidayProduct, buildUrgencyMessagingDimensions, addToDataLayer, getPrices },
            amendHotelStore: { selectedSortingOption, pageNumber },
            marketStore: { currency },
        } = this.rootStore;

        if (!booking || !altHotelOffers.length) return;

        const offers = altHotelOffers.map(hotelOffer => this.getOfferFromAmendHotelListItem(hotelOffer, booking));
        const { outbound: outboundTransport } = getRouteByDirection(booking.package.transport.routes);

        const searchDependencies: ISearchDependenciesData = getSearchDetailsForBooking(
            booking.package.transport.routes,
            booking.guests,
            booking.package.accom.rooms[0],
            pageNumber,
            currency,
        );

        const detailObject = {
            ...getSearchDetailObject(offers, eventType, searchDependencies),
            dimension75: sortDimension || this.getAmendHotelSortDimension(selectedSortingOption),
            dimension18: outboundTransport?.depName,
        };

        const hotelImpressions = offers.map((offer, index) => {
            const { metric6, productPrice } = getPrices({
                amendmentCharges: offer.price,
            });

            return {
                ...buildBaseHolidayProduct(offer, eventType, index),
                ...buildUrgencyMessagingDimensions(eventType, offer.accom.unit),
                list: this.pageNameLabel,
                quantity: 1, // Amendment always with quantity 1
                price: productPrice,
                metric6,
                dimension75: detailObject.dimension75,
            };
        });

        const ecommerce = {
            event: eventType,
            dimension136: this.pageNameLabel,
            onsite_search_origin: this.pageNameLabel,
            ecommerce: {
                detail: {
                    products: [detailObject],
                },
                impressions: hotelImpressions,
            },
        };

        addToDataLayer(ecommerce);
    };

    clickLoadMoreAmendHotelList = (): void => {
        this.pushHotelChangeEvent(
            {},
            {
                eventLabel: EventLabels.LoadMore,
            },
        );
    };

    trackLoadMoreAmendHotelList = (altHotelOffers: IAmendHotelOffer[]): void => {
        this.fireHotelListImpressionEvent(altHotelOffers, EventTypes.ChangeHotelLoadMore, RecommendedOrderBy.Bd4);
    };

    clickBookHotel = (hotelOffer: IAmendHotelOffer): void => {
        const {
            layoutStore: { sitePath },
        } = this.rootStore;

        this.pushHotelChangeEvent(
            {
                genericValue2: hotelOffer.hotel.name,
                destinationUrl: sitePath + SitePath.AmendHotelSummary,
            },
            {
                eventLabel: EventLabels.BookHotel,
            },
        );
    };

    clickViewBookingFromAmendHotel = (hotelOffer: IAmendHotelOffer, hotelLink: string): void => {
        const {
            layoutStore: { sitePath },
        } = this.rootStore;

        this.pushHotelChangeEvent(
            {
                genericValue2: hotelOffer.hotel.name,
                destinationUrl: sitePath + hotelLink.split('?')[0],
            },
            {
                eventLabel: EventLabels.ViewHotelDetails,
            },
        );
    };
}
