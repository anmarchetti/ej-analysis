import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { generateGenericValues, getTimestamp } from 'frontend/utils/tracking/tracking.utils';
import { hyphenateString } from 'frontend/utils/url.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { IBaseHolidayProduct } from 'models/data/tracking/IProduct';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';

const PARKING_LIST_PAGE_TITLE = 'Holiday External Extras Parking List';

export class AirportParkingTrackingStore {
    constructor(public rootStore: HolidaysRootStore) {}

    private readonly getExtrasPageUrl = (): string =>
        `${this.rootStore.layoutStore.sitePath}${SitePath.Extras}/${window.location.search}`;

    private readonly getAirportParkingVariant = (airportParking: IAirportParking): string => {
        if (!airportParking) return '';

        const {
            title,
            bookingDetails: { productCode, type },
        } = airportParking;

        return [title, productCode, type].join('|');
    };

    private readonly buildBaseDimensions = (
        titleWithDepartureAirport: string,
        extendedCustomParams: Record<string, string | null> = {},
        extendedEventParams: Record<string, string> = {},
    ): { customParams: ICustomParams; eventParams: { eventCategory: EventCategories; eventType: EventTypes } } => {
        const customParams = generateGenericValues({
            genericValue2: titleWithDepartureAirport,
            ...extendedCustomParams,
        });
        const eventParams = {
            eventCategory: EventCategories.ExternalExtras,
            eventType: EventTypes.Interaction,
            ...extendedEventParams,
        };

        return {
            customParams,
            eventParams,
        };
    };

    private readonly getDepartureAirportName = (): string => {
        const { bookingStore } = this.rootStore;

        return bookingStore.outboundFlight?.depName || '';
    };

    private readonly getAirportParkingUrl = (): string => {
        const { layoutStore } = this.rootStore;

        const departureAirportName = this.getDepartureAirportName();
        const url = `/booking/${hyphenateString(departureAirportName)}-external-extras-parking-list`;

        return [layoutStore.sitePath, url].join('');
    };

    public trackParkingListPageLoad = async (): Promise<void> => {
        const { trackingStore } = this.rootStore;

        await trackingStore.initializePageLoadObject({
            title: PARKING_LIST_PAGE_TITLE,
            category: PageLoadCategory.Book,
            url: this.getAirportParkingUrl(),
            pageReferral: this.getExtrasPageUrl(),
            pageReferralName: trackingStore.buildPageName(trackingStore.getPageTitle()),
        });

        trackingStore.addToDataLayer(trackingStore.getPageLoadObject());
    };

    public trackParkingModuleInExtrasPageImpression = (
        sectionTitle: string,
        titleWithDepartureAirport: string,
    ): void => {
        const { customParams, eventParams } = this.buildBaseDimensions(
            titleWithDepartureAirport,
            {
                destinationUrl: null,
            },
            {
                eventAction: EventActions.Impressions,
                eventLabel: sectionTitle,
                eventType: EventTypes.NonInteraction,
            },
        );

        this.rootStore.trackingStore.trackEventWithParams(EventTypes.GenericEvent, eventParams, customParams);
    };

    public trackBuyNowCtaClick = (buttonLabel: string, titleWithDepartureAirport: string): void => {
        const { customParams, eventParams } = this.buildBaseDimensions(
            titleWithDepartureAirport,
            {
                destinationUrl: this.getAirportParkingUrl(),
            },
            {
                eventAction: EventActions.CTAClick,
                eventLabel: buttonLabel,
            },
        );

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            eventParams,
            customParams,
            true,
            true,
        );
    };

    public trackParkingListCtaClick = (buttonLabel: string, titleWithDepartureAirport: string): void => {
        const coreParamsOverride = {
            pageUrl: this.getAirportParkingUrl(),
            pageTitle: PARKING_LIST_PAGE_TITLE,
        };

        const { customParams, eventParams } = this.buildBaseDimensions(
            titleWithDepartureAirport,
            {
                genericValue1: GenericValue.Overlay,
                destinationUrl: this.getExtrasPageUrl(),
            },
            {
                eventAction: EventActions.CTAClick,
                eventLabel: buttonLabel,
            },
        );

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            eventParams,
            customParams,
            false,
            false,
            coreParamsOverride,
        );
    };

    public trackParkingListEcommerceDimensions = (airportParkings: IAirportParking[]): void => {
        const { buildBaseHolidayProduct, buildAirportParkingProduct, addToDataLayer, buildPageName } =
            this.rootStore.trackingStore;
        const { selectedOffer } = this.rootStore.bookingStore;

        const baseHoliday = buildBaseHolidayProduct(
            selectedOffer,
            EventTypes.ExternalExtrasList,
        ) as IBaseHolidayProduct;

        addToDataLayer({
            event: EventTypes.ExternalExtrasList,
            dimension136: buildPageName(PARKING_LIST_PAGE_TITLE),
            pageTitle: PARKING_LIST_PAGE_TITLE,
            ecommerce: {
                impressions: airportParkings.map(airportParking =>
                    buildAirportParkingProduct(airportParking, EventTypes.ExternalExtrasList, baseHoliday),
                ),
            },
        });
    };

    public trackParkingListError = (errorMessage: string): void => {
        const { trackingStore } = this.rootStore;

        const errorObject = {
            event: EventTypes.ErrorMessage,
            dimension13: getTimestamp(),
            dimension86: this.getDepartureAirportName(),
            dimension87: errorMessage,
            dimension136: trackingStore.buildPageName(PARKING_LIST_PAGE_TITLE),
        };

        trackingStore.addToDataLayer(errorObject);
    };

    public trackBookParkingCtaClick = (airportParking: IAirportParking): void => {
        const { trackingStore, marketStore, bookingStore } = this.rootStore;
        const { buildBaseHolidayProduct, buildAirportParkingProduct, addToDataLayer, buildPageName } = trackingStore;
        const { selectedOffer } = bookingStore;
        const baseHoliday = buildBaseHolidayProduct(selectedOffer, EventTypes.ExternalExtrasAdd) as IBaseHolidayProduct;

        addToDataLayer({
            event: EventTypes.ExternalExtrasAdd,
            dimension136: buildPageName(trackingStore.getPageTitle()),
            pageTitle: PARKING_LIST_PAGE_TITLE,
            ecommerce: {
                currency: marketStore.currency,
                add: {
                    products: [buildAirportParkingProduct(airportParking, EventTypes.ExternalExtrasAdd, baseHoliday)],
                },
            },
        });
    };

    public trackSelectedParkingRemoveButton = (airportParking: IAirportParking): void => {
        const { trackingStore, marketStore, bookingStore } = this.rootStore;
        const { buildBaseHolidayProduct, buildAirportParkingProduct, addToDataLayer, buildPageName } = trackingStore;
        const { selectedOffer } = bookingStore;
        const baseHoliday = buildBaseHolidayProduct(
            selectedOffer,
            EventTypes.ExternalExtrasRemove,
        ) as IBaseHolidayProduct;

        addToDataLayer({
            event: EventTypes.ExternalExtrasRemove,
            dimension136: buildPageName(trackingStore.getPageTitle()),
            ecommerce: {
                currency: marketStore.currency,
                remove: {
                    products: [
                        buildAirportParkingProduct(airportParking, EventTypes.ExternalExtrasRemove, baseHoliday),
                    ],
                },
            },
        });
    };

    public trackSelectedParkingEditButton = (buttonLabel: string, titleWithDepartureAirport: string): void => {
        const { trackingStore, airportParkingStore } = this.rootStore;

        if (!airportParkingStore.selectedAirportParking) return;

        const coreParamsOverride = {
            pageUrl: this.getExtrasPageUrl(),
            pageName: trackingStore.buildPageName(trackingStore.getPageTitle()),
            pageReferral: this.getAirportParkingUrl(),
        };

        const { customParams, eventParams } = this.buildBaseDimensions(
            titleWithDepartureAirport,
            {
                genericValue1: null,
                genericValue3: this.getAirportParkingVariant(airportParkingStore.selectedAirportParking),
                genericValue4: null,
                destinationUrl: this.getAirportParkingUrl(),
            },
            {
                eventAction: EventActions.CTAClick,
                eventLabel: buttonLabel,
            },
        );

        this.rootStore.trackingStore.trackEventWithParams(
            EventTypes.GenericEvent,
            eventParams,
            customParams,
            false,
            false,
            coreParamsOverride,
        );
    };

    public trackAirportParkingUpdatedInExtrasPage = async (): Promise<void> => {
        const { trackingStore } = this.rootStore;

        const bookingDimensionWithParking = await trackingStore.addBookingFlowPageDimension(
            EventTypes.ExternalExtrasUpdate,
        );

        trackingStore.addToDataLayer(bookingDimensionWithParking);
    };

    public trackExtrasPageLoadAfterSelectingParking = async (): Promise<void> => {
        const { trackingStore } = this.rootStore;

        await trackingStore.initializePageLoadObject({
            title: trackingStore.getPageTitle(),
            category: PageLoadCategory.Book,
            url: this.getExtrasPageUrl(),
            pageReferral: this.getAirportParkingUrl(),
        });

        trackingStore.addToDataLayer(trackingStore.getPageLoadObject());
    };
}
