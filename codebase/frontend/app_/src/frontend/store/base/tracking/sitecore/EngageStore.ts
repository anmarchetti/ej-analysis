import { Engage, ICdpResponse, ICustomEventInput, init } from '@sitecore/engage';
import { ExtensionData } from '@sitecore/engage/types/lib/events';
import { action, computed, makeObservable, observable, toJS, when } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { envPublic } from 'code/env';
import settings from 'code/settings';
import { logger } from 'frontend/services/logging';
import sitecoreService from 'frontend/services/sitecore.service';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { deepClone } from 'frontend/utils/array.utils';
import { getCookie } from 'frontend/utils/cookies.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { generateUniqueId } from 'frontend/utils/generateUniqueId.utils';
import isBackend from 'frontend/utils/isBackend';
import { getProfileData } from 'frontend/utils/sitecorePersonalize.utils';
import { callOperationWithTimeout } from 'frontend/utils/timeoutController.utils';
import { getDepartureAirportsCodes, getDepartureDateFlexibility } from 'frontend/utils/tracking/tracking.utils';
import {
    getWebStorageItem,
    removeWebStorageItem,
    setWebStorageItem,
    updateWebStorageItem,
} from 'frontend/utils/webStorage.utils';
import { IBookingInfoPayload } from 'models/data/IBookingInfo';
import {
    IOrder,
    IOrderCheckoutEventData,
    IOrderItem,
    TEngageEventData,
    TSortParams,
} from 'models/data/ISitecorePersonalize';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { DataStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { QueryParamName } from 'models/enum/QueryParamName';
import { OUTBOUND_ROUTE_ID } from 'models/enum/RouteDirection';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductCategories, ProductIds, ProductNames } from 'models/enum/tracking/ProductCategories';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import {
    ISitecorePersonalizeExperiment,
    ISitecorePersonalizeExperimentBase,
} from 'models/sitecore/ISitecorePersonalizeExperiment';

import { CANCELLED_STATUS, IdentityRules, OrderCheckoutPayment, PURCHASED_STATUS, SitecoreChannel } from './constants';

export interface IEngageStoreInitialState {
    experiments: ISitecorePersonalizeExperiment[];
}

declare global {
    interface Window {
        engage: Engage | undefined;
    }
}

export interface ILogData {
    eventType: string;
    order: IOrder;
    pointOfSale: string;
    response: ICdpResponse | null | undefined;
    selectionAttr: string;
    bookingReference?: string;
}

interface ILogDataPayload {
    item: ISitecorePersonalizeExperiment;
    response: ICdpResponse | null | undefined;
}

interface IComponentWrapperInner {
    componentName: string;
    uid: string;
}

export interface IContentOrder {
    groupName: string;
    placeholders: {
        [PlaceholderNames.SorterWrapperInner]: IComponentWrapperInner[];
    };
    uid: string;
}

export class EngageStore implements ISssrStore<IEngageStoreInitialState> {
    @observable public experiments: ISitecorePersonalizeExperiment[] = [];
    @observable public engage: Engage | undefined;
    @observable public contentOrder: IContentOrder | null;
    @observable public sortParams: TSortParams = {};

    constructor(public rootStore: TRootStore) {
        makeObservable(this);

        this.initializeEngage();
    }

    @computed private get engageEventData(): TEngageEventData {
        const { trackingStore, marketStore, appStore } = this.rootStore;

        return {
            channel: appStore.isScreenExtraSmall ? SitecoreChannel.Mobile : SitecoreChannel.Desktop,
            currency: marketStore.currency,
            language: trackingStore.pageLang,
            page: trackingStore.getPageTitle(),
        };
    }

    private readonly addOrderItems = (
        eventType: EventTypes,
        orderEvent: IOrderCheckoutEventData,
    ): IOrderCheckoutEventData => {
        const { booking } = this.rootStore.bookingStore;

        if (!booking) {
            return orderEvent;
        }

        const { trackingStore } = this.rootStore;
        const { referenceId, orderedAt, status, currencyCode } = orderEvent.order;
        const baseOrder = {
            orderedAt,
            status,
            currencyCode,
        };
        const [outboundInfo, inboundInfo] = booking.package.transport.routes;
        const baseHoliday = trackingStore.buildBaseHolidayProduct(booking, EventTypes.Purchase);

        if (!baseHoliday) {
            return orderEvent;
        }

        const { extraLuggage } = this.rootStore.bookingStore;
        const { seatSelection, lateRoomCheckout, airportParking } = booking;
        const bags = extraLuggage.getExtraLuggageProductsForTracking();
        const { LCBCount } = this.rootStore.flightsPassengersStore;

        let orderItems: IOrderItem[] = [
            {
                ...baseOrder,
                referenceId: [referenceId, generateUniqueId()].join('-'),
                type: ProductCategories.BaseHoliday,
                price: baseHoliday.price,
                name: baseHoliday.name,
                productId: baseHoliday.id,
                quantity: baseHoliday.quantity,
            },
            {
                ...baseOrder,
                referenceId: [referenceId, generateUniqueId()].join('-'),
                type: ProductCategories.FlightDeparture,
                price: 0,
                name: `${outboundInfo.depPt}-${outboundInfo.arrPt}`,
                productId: outboundInfo.fltNo,
                quantity: baseHoliday.quantity,
            },
            {
                ...baseOrder,
                referenceId: [referenceId, generateUniqueId()].join('-'),
                type: ProductCategories.FlightReturn,
                price: 0,
                name: `${inboundInfo.depPt}-${inboundInfo.arrPt}`,
                productId: inboundInfo.fltNo,
                quantity: baseHoliday.quantity,
            },
        ];

        if (seatSelection?.length) {
            orderItems = orderItems.concat(
                trackingStore
                    .buildAllSeatsProducts(eventType, seatSelection, outboundInfo, inboundInfo, baseHoliday)
                    .map(({ category, price, name, id, quantity }) => ({
                        ...baseOrder,
                        referenceId: [referenceId, generateUniqueId()].join('-'),
                        type: category,
                        price,
                        name,
                        productId: id,
                        quantity,
                    })),
            );
        }

        if (bags.length) {
            orderItems = orderItems.concat(
                bags.map(({ routeId, title, quantity, price }) => ({
                    ...baseOrder,
                    referenceId: [referenceId, generateUniqueId()].join('-'),
                    type: `${ProductCategories.Bags}: ${routeId === OUTBOUND_ROUTE_ID ? 'Outbound' : 'Inbound'}`,
                    price,
                    name: title,
                    productId: [title, baseHoliday.id].join('_'),
                    quantity,
                })),
            );
        }

        if (lateRoomCheckout) {
            orderItems.push({
                ...baseOrder,
                referenceId: [referenceId, generateUniqueId()].join('-'),
                type: ProductCategories.HotelExtras,
                price: lateRoomCheckout.price,
                name: lateRoomCheckout.name,
                productId: ProductIds.LateCheckout,
                quantity: 1,
            });
        }

        if (LCBCount) {
            orderItems.push(
                {
                    ...baseOrder,
                    referenceId: [referenceId, generateUniqueId()].join('-'),
                    type: ProductCategories.LCBOutbound,
                    price: extraLuggage.getLargeCabinBagsPriceByRoute(true) ?? 0,
                    name: ProductNames.LargeCabinBags,
                    productId: ProductIds.LargeCabinBagsSingle,
                    quantity: LCBCount,
                },
                {
                    ...baseOrder,
                    referenceId: [referenceId, generateUniqueId()].join('-'),
                    type: ProductCategories.LCBInbound,
                    price: extraLuggage.getLargeCabinBagsPriceByRoute(false) ?? 0,
                    name: ProductNames.LargeCabinBags,
                    productId: ProductIds.LargeCabinBagsSingle,
                    quantity: LCBCount,
                },
            );
        }

        if (airportParking) {
            orderItems.push({
                ...baseOrder,
                referenceId: [referenceId, generateUniqueId()].join('-'),
                type: ProductCategories.ExternalExtras,
                price: airportParking.bookingDetails.totalPrice,
                name: ProductNames.AirportParking,
                productId: ProductCategories.ExternalExtras,
                quantity: 1,
            });
        }

        return {
            ...orderEvent,
            order: {
                ...orderEvent.order,
                orderItems,
            },
        };
    };

    @computed private get orderCheckoutEventData(): IOrderCheckoutEventData {
        const { bookingInfoPayload } = this.rootStore.bookingStore;

        return {
            ...this.engageEventData,
            pointOfSale: envPublic.SITECORE_PERSONALIZE.pointOfSale,
            order: {
                date: bookingInfoPayload.date,
                referenceId: bookingInfoPayload.bookingReference,
                orderedAt: new Date().toISOString(),
                status: PURCHASED_STATUS,
                currencyCode: bookingInfoPayload.paymentInfo?.currency,
                price: bookingInfoPayload.paymentInfo?.totalPrice,
                paymentType: bookingInfoPayload.paymentType,
                cardType:
                    bookingInfoPayload.paymentType === OrderCheckoutPayment.Credit ? '' : bookingInfoPayload.cardType,
            },
        };
    }

    @computed private get browserId(): string {
        return (
            this.engage?.getBrowserId() ||
            getCookie([CookiesKeys.BrowserId, envPublic.SITECORE_PERSONALIZE.clientKey].join('_'))
        );
    }

    getLogData = (payload: ILogDataPayload): ILogData | null => {
        const { bookingStore, layoutStore } = this.rootStore;
        const { bookingInfoPayload } = bookingStore;
        const { getSetting } = layoutStore;
        const { response, item } = payload;

        if (!getSetting(SiteSettings.EnablePersonalizeOrderLogging)) {
            return null;
        }

        const {
            order: { cardType, paymentType, ...orderLog },
        } = this.orderCheckoutEventData;

        const bodyToLog: ILogData = deepClone({
            ...this.orderCheckoutEventData,
            order: orderLog,
            response,
            eventType: EventTypes.CustomEventPrefix.toUpperCase(),
            bookingReference: bookingInfoPayload.bookingReference,
            selectionAttr: item.selectionAttr,
        });

        return bodyToLog;
    };

    @action initializeEngage = async (): Promise<void> => {
        if (
            isBackend() ||
            getCookie(settings.Cookies.Personalization) !== '1' ||
            this.rootStore.layoutStore.isExperienceEditor ||
            (!this.rootStore.layoutStore.isTradePortal && this.rootStore.layoutStore.isCommitBookingPage)
        )
            return;

        const engage = await init({
            ...envPublic.SITECORE_PERSONALIZE,
            webPersonalization: !this.rootStore.layoutStore.isSearchResultsPage,
        });

        this.setEngage(engage);
    };

    @action private readonly setEngage = (engage: Engage): void => {
        this.engage = engage;
        globalThis.engage = engage;
    };

    @action callEngage = async (): Promise<void> => {
        if (!this.engage) await this.initializeEngage();

        await this.sendPageViewEvent();

        if (this.rootStore.layoutStore.isSearchResultsPage) {
            await this.sendSearchEvent();

            const engage = await init({
                ...envPublic.SITECORE_PERSONALIZE,
                webPersonalization: true,
            });

            this.setEngage(engage);
        }

        await this.sendPageViewEvent();

        globalThis.Engage?.triggerExperiences?.();
    };

    @action sendEvent = async (
        eventType: string,
        data: ICustomEventInput,
        extensionData?: ExtensionData,
    ): Promise<ICdpResponse | null | undefined> => {
        if (this.engage === undefined || this.rootStore.layoutStore.isTradePortal) return;

        const result = await callOperationWithTimeout(
            async () => this.engage?.event(eventType, data, extensionData),
            this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.PersonalizeTimeout),
            eventType,
            this.browserId,
        );

        return result;
    };

    @action sendPageViewEvent = async (): Promise<void> => {
        await when(() => this.rootStore.trackingStore.pageLoadObject !== null);

        const pageloadObject = this.rootStore.trackingStore.pageLoadObject;
        const pageReferral = pageloadObject?.pageReferral?.split('?')[0];
        await this.sendEvent(EventTypes.View.toUpperCase(), {
            ...this.engageEventData,
            pageReferral,
            pageReferralCategory: pageloadObject?.dimension11,
            pageProfile: getProfileData(
                this.rootStore.layoutStore.pageProfile,
                this.rootStore.queryParamsStore.query[QueryParamName.Theme],
            ),
        });
    };

    sendIdentityEvent = async (): Promise<void> => {
        if (
            !this.engage ||
            this.rootStore.layoutStore.isTradePortal ||
            getWebStorageItem(WebStorageKeys.UserIdentificationStatus)
        ) {
            return;
        }

        const id = this.browserId;

        if (!id) {
            return;
        }

        setWebStorageItem(WebStorageKeys.UserIdentificationStatus, IdentityRules.BrowserId);

        await this.engage?.identity({
            ...this.engageEventData,
            pointOfSale: envPublic.SITECORE_PERSONALIZE.pointOfSale,
            identifiers: [
                {
                    id,
                    provider: IdentityRules.BrowserId,
                },
            ],
        });
    };

    ensureIdentified = async (): Promise<boolean> => {
        if (!this.engage || this.rootStore.layoutStore.isTradePortal) {
            return false;
        }

        const id = this.browserId;

        if (!id) {
            logger.warn('Sitecore Personalize Booking Confirmation: Cannot identify user - no browserId available');

            return false;
        }

        try {
            const response = await callOperationWithTimeout(
                async () =>
                    this.engage?.identity({
                        ...this.engageEventData,
                        pointOfSale: envPublic.SITECORE_PERSONALIZE.pointOfSale,
                        identifiers: [
                            {
                                id,
                                provider: IdentityRules.BrowserId,
                            },
                        ],
                    }),
                this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.PersonalizeTimeout),
                'IDENTITY',
                id,
            );

            if (response && response.status === 'OK') {
                setWebStorageItem(WebStorageKeys.UserIdentificationStatus, IdentityRules.BrowserId);

                return true;
            }

            logger.warn('Sitecore Personalize Booking Confirmation: Identity event did not return OK status', {
                response,
            });

            return false;
        } catch (error) {
            logger.error(error);

            return false;
        }
    };

    sendPersonalizeEventsAfterSuccessfulPayment = async (): Promise<void> => {
        if (!this.engage) {
            await this.initializeEngage();
        }

        await this.ensureIdentified();

        await this.sendExperimentEvents();
        await this.sendPersonalizeOrderData();
        await this.sendOrderCheckoutEvent();
    };

    sendMarketingEvent = async (): Promise<void> => {
        await this.sendEvent(EventTypes.MarketingChannel.toUpperCase(), {
            ...this.engageEventData,
            marketingChannel: this.rootStore.queryParamsStore.query[QueryParamName.UtmMedium],
            campaignName: this.rootStore.queryParamsStore.query[QueryParamName.UtmCampaign],
        });
    };

    sendOrderCheckoutEvent = async (): Promise<void> => {
        if (!this.engage) return;

        await when(() => this.rootStore.bookingStore.isLoadingBookingConfirmationInfo === false);

        await this.sendEvent(
            EventTypes.OrderCheckout.toUpperCase(),
            this.addOrderItems(EventTypes.OrderCheckout, this.orderCheckoutEventData) as unknown as ICustomEventInput,
        );

        const [clickers, impressions] = [
            getWebStorageItem(WebStorageKeys.EngageCustomEvents, true, sessionStorage),
            getWebStorageItem(WebStorageKeys.EngagePromocodeEvents, true, sessionStorage),
        ];

        if (clickers && !!Object.keys(clickers).length) {
            for (const eventType of Object.keys(clickers)) {
                await this.sendCustomEvent(EventTypes.SuccessfulConversation.toUpperCase(), { source: eventType });
            }

            removeWebStorageItem(WebStorageKeys.EngageCustomEvents, sessionStorage);
        }

        if (
            this.rootStore.bookingStore.bookingInfoPayload?.promoCode &&
            impressions &&
            !!Object.entries(impressions).length
        ) {
            for (const [eventType, promocode] of Object.entries(impressions)) {
                if (promocode === this.rootStore.bookingStore.bookingInfoPayload?.promoCode) {
                    await this.sendCustomEvent(EventTypes.SuccessfulPromoConversation.toUpperCase(), {
                        source: eventType,
                        promocode,
                    });
                }
            }

            removeWebStorageItem(WebStorageKeys.EngagePromocodeEvents, sessionStorage);
        }

        setWebStorageItem(WebStorageKeys.IsOrderCheckoutSent, true, sessionStorage);
        this.setExperimentsIntoStorage(null);
    };

    sendOrderCancelEvent = async (bookingPayload: IBookingInfoPayload): Promise<void> => {
        await this.sendEvent(EventTypes.OrderCancel.toUpperCase(), {
            ...this.engageEventData,
            pointOfSale: envPublic.SITECORE_PERSONALIZE.pointOfSale,
            order: {
                orderedAt: bookingPayload.date,
                referenceId: bookingPayload.bookingReference,
                status: CANCELLED_STATUS,
                currencyCode: bookingPayload.paymentInfo?.currency,
                price: bookingPayload.paymentInfo?.totalPrice,
            },
        });
    };

    sendPromoCodeEvent = async (promoCode?: string): Promise<void> => {
        if (!promoCode) return;

        await this.sendEvent(EventTypes.AtcomPromoCode.toUpperCase(), {
            ...this.engageEventData,
            promoCode,
        });
    };

    sendCustomEvent = async (eventType: string, extraData?: Record<string, unknown>): Promise<void> => {
        await this.sendEvent(EventTypes.CustomEventPrefix + eventType, {
            ...this.engageEventData,
            ...extraData,
        });
    };

    sendImpressionEvent = async (campaignId: string, uniqueId: string, source: string): Promise<void> => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};
        const eventType = [source, EventTypes.View, friendlyId].join('_').toUpperCase();
        this.sendCustomEvent(eventType, { campaignId, selectionAttr });
    };

    sendClickEvent = async (campaignId: string, uniqueId: string, source: string, code: string): Promise<void> => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};
        const eventType = [source, EventTypes.Click, friendlyId].join('_').toUpperCase();
        this.sendCustomEvent(eventType, { campaignId, selectionAttr });
        updateWebStorageItem(
            WebStorageKeys.EngagePromocodeEvents,
            { [EventTypes.CustomEventPrefix + eventType]: code },
            sessionStorage,
        );
    };

    saveHeroBannerClickEvent = async (uniqueId: string, source: string): Promise<void> => {
        const { friendlyId = 'Default', selectionAttr = 'Default' } =
            this.rootStore.engageStore.experimentsByUniqueId[uniqueId] || {};
        const eventType = [source, friendlyId].join('_').toUpperCase();

        this.sendCustomEvent(eventType, { selectionAttr });
        updateWebStorageItem(
            WebStorageKeys.EngageCustomEvents,
            { [EventTypes.CustomEventPrefix + eventType]: true },
            sessionStorage,
        );
    };

    @action sendSearchEvent = async (): Promise<void> => {
        if (this.engage === undefined) return;

        const { hotelsStore, searchStore } = this.rootStore;

        await when(
            () =>
                hotelsStore.status !== DataStatus.Loading &&
                hotelsStore.status !== DataStatus.NotLoaded &&
                searchStore.searchTo.isLoadingDestinations === false &&
                searchStore.searchTo.selectedDestinations.length > 0,
        );

        await this.sendEvent(EventTypes.SearchCriteria.toUpperCase(), {
            ...this.engageEventData,
            fromAirports: getDepartureAirportsCodes(searchStore.searchFrom.origins || [], searchStore.originsWithNames),
            destinations: searchStore.searchTo.selectedDestinations.map(({ code, name }) => ({ code, name })),
            departureDate: formatDateL10n(searchStore.searchWhen.from, DATE_FORMATS.query),
            returnDate: formatDateL10n(searchStore.searchWhen.to, DATE_FORMATS.query),
            flexibility: getDepartureDateFlexibility(
                searchStore.searchWhen.flexDays,
                searchStore.searchWhen.isFlexible,
            ),
            numberOfNights: searchStore.searchWhen.selectedNumberOfNights,
            pax: {
                adults: searchStore.searchWho.adultsQuantity,
                children: searchStore.searchWho.childrenQuantity,
                infants: searchStore.searchWho.infantsQuantity,
                childrenAges: searchStore.searchWho.childrenAges,
            },
        });
    };

    @action setExperiments = (experiments: ISitecorePersonalizeExperiment[]): void => {
        this.experiments = experiments;
    };

    @action clearContentOrder = (): void => {
        this.contentOrder = null;
    };

    @action setEngageParams = (params: TSortParams): void => {
        this.sortParams = params;
    };

    @action getOrderingFromPromoCode = async (promoCode: string): Promise<void> => {
        const { bookingStore, layoutStore, appStore } = this.rootStore;
        const { isExtrasPage, isHotelDetailsBookPage, getSettingAsBoolean } = layoutStore;

        await this.initializeEngage();

        if (this.engage === undefined) {
            this.clearContentOrder();

            return;
        }

        const isReorderingDisabled = getSettingAsBoolean(SiteSettings.DisableReordering);

        if (
            (!isExtrasPage && !isHotelDetailsBookPage) ||
            !this.sortParams.EnableOrdering ||
            !this.sortParams.FriendlyId ||
            isReorderingDisabled
        ) {
            this.clearContentOrder();

            return;
        }

        const params: {
            promoCode: string;
            deviceType?: string;
            paxMix?: { adults: number; children: number; infants: number };
        } = {
            promoCode,
        };

        if (isExtrasPage) {
            params.paxMix = {
                adults: bookingStore.adultsQuantity,
                children: bookingStore.childrenQuantity,
                infants: bookingStore.infantsQuantity,
            };
        } else {
            params.deviceType = appStore.deviceType;
        }

        const result = await callOperationWithTimeout(
            async () =>
                this.engage?.personalize({
                    ...this.engageEventData,
                    friendlyId: this.sortParams.FriendlyId ?? '',
                    params,
                }),
            this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.PersonalizeTimeout),
            EventTypes.OrderPersonalize,
            this.browserId,
            this.sortParams.FriendlyId,
        );

        this.contentOrder = result as IContentOrder;
    };

    @computed get experimentsByUniqueId(): { [key: string]: ISitecorePersonalizeExperimentBase } {
        return this.experiments.reduce((prev, exp) => {
            const { uniqueId, ...restExp } = exp;
            prev[uniqueId] = restExp;

            return prev;
        }, {});
    }

    get isOrderCheckoutSent(): boolean {
        return !!getWebStorageItem(WebStorageKeys.IsOrderCheckoutSent, true, sessionStorage);
    }

    deserialize(initialState?: IEngageStoreInitialState): void {
        this.experiments = initialState?.experiments || [];
    }

    serialize(): IEngageStoreInitialState {
        return {
            experiments: toJS(this.experiments),
        };
    }

    getExperimentsFromStorage = (): ISitecorePersonalizeExperiment[] =>
        getWebStorageItem(WebStorageKeys.ExperimentsPrefix + this.rootStore.layoutStore.lang, true, sessionStorage) ||
        [];

    setExperimentsIntoStorage = (data: ISitecorePersonalizeExperiment[] | null): void => {
        setWebStorageItem(WebStorageKeys.ExperimentsPrefix + this.rootStore.layoutStore.lang, data, sessionStorage);
    };

    syncExperiments = (): void => {
        const baseExperiments = this.getExperimentsFromStorage();
        let mergedExperiments = this.experiments;

        if (baseExperiments.length) {
            mergedExperiments = [
                ...[...baseExperiments, ...this.experiments]
                    .reduce(
                        (acc, next) => acc.set(next.friendlyId, { ...acc.get(next.friendlyId), ...next }),
                        new Map(),
                    )
                    .values(),
            ];
        }

        this.setExperimentsIntoStorage(mergedExperiments);
    };

    sendExperimentEvents = async (): Promise<void> => {
        if (!this.engage) {
            return;
        }

        const experiments = this.getExperimentsFromStorage();

        if (experiments.length) {
            const {
                order: { price, ...restOrder },
                ...eventData
            } = this.orderCheckoutEventData;

            for (const item of experiments) {
                const response = await this.sendEvent(
                    EventTypes.CustomEventPrefix + item.friendlyId || '',
                    {
                        ...eventData,
                        attributeId: item.selectionAttr,
                        price,
                    },
                    restOrder as unknown as ExtensionData,
                );

                const logData = this.getLogData({ response, item });

                if (logData) {
                    await logger.info(
                        `${this.rootStore.layoutStore.pageName.toUpperCase()}: parse payload${JSON.stringify(logData)}`,
                    );
                }
            }
        }
    };

    sendPersonalizeOrderData = async (): Promise<void> => {
        const { getSettingAsBoolean } = this.rootStore.layoutStore;

        if (!this.engage || !getSettingAsBoolean(SiteSettings.EnablePersonalizationOrderTracking)) {
            return;
        }

        const experiences = this.getExperimentsFromStorage();

        logger.info(`EngageStore sendPersonalizeOrderData experiences: ${JSON.stringify(experiences)}`);

        if (!experiences.length) {
            await sitecoreService.sendPersonalizeOrderData({
                ...this.orderCheckoutEventData.order,
                experiences: {},
            });

            return;
        }

        const expObject = experiences.reduce((acc, { friendlyId, selectionAttr }) => {
            if (friendlyId && selectionAttr) {
                acc[friendlyId] = selectionAttr;
            }

            return acc;
        }, {});

        logger.info(`EngageStore sendPersonalizeOrderData NOT empty expObject: ${JSON.stringify(expObject)}`);

        await sitecoreService.sendPersonalizeOrderData({
            ...this.orderCheckoutEventData.order,
            experiences: expObject,
        });
    };
}

export default EngageStore;
