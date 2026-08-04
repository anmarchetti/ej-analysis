import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { RouteDirection } from 'models/enum/RouteDirection';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import PageLoadCategory from 'models/enum/tracking/PageLoadCategory';
import { ProductCategories } from 'models/enum/tracking/ProductCategories';

import { AirportParkingTrackingStore } from './AirportParkingTrackingStore';

let mockRootStore;

jest.mock('frontend/utils/tracking/tracking.utils');

const airportParkings = [
    {
        title: 'Parking 1',
        bookingDetails: {
            productCode: 'P001',
            totalPrice: 30,
            type: 'meet_and_greet',
        },
    },
    {
        title: 'Parking 2',
        bookingDetails: {
            productCode: 'P002',
            totalPrice: 60,
            type: 'on-site',
        },
    },
];

describe('AirportParkingTrackingStore', () => {
    let airportParkingTrackingStore;

    beforeEach(() => {
        mockRootStore = createMockStores({
            trackingStore: {
                addToDataLayer: jest.fn(),
                buildCoreParamsObject: jest.fn(),
                getPageLoadObject: jest.fn(),
                initializePageLoadObject: jest.fn(),
                buildPageName: jest.fn().mockReturnValue('Holiday External|EN'),
                getPageTitle: jest.fn(),
                buildProducts: jest.fn(),
            },
            layoutStore: { sitePath: 'https://www.easyjet.com/en/holidays' },
            bookingStore: {
                outboundFlight: { direction: RouteDirection.Outbound, depName: 'TestDepartureAirport' },
                fetchOffer: jest.fn(),
                selectedOffer: mockedOffer,
            },
            airportParkingStore: {
                selectedAirportParking: airportParkings[0],
            },
            searchStore: {
                selectedOfferIndex: 1,
            },
        });

        airportParkingTrackingStore = new AirportParkingTrackingStore(mockRootStore);

        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    describe('getAirportParkingUrl', () => {
        it('should return the correct airport parking URL', () => {
            const result = airportParkingTrackingStore['getAirportParkingUrl']();

            expect(result).toBe(
                'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
            );
        });
    });

    describe('getExtrasPageUrl', () => {
        it('should return the correct extras page url', () => {
            const result = airportParkingTrackingStore['getExtrasPageUrl']();

            expect(result).toBe('https://www.easyjet.com/en/holidays/booking/');
        });
    });

    describe('getAirportParkingVariant', () => {
        it('should return the correct airport parking variant', () => {
            const result = airportParkingTrackingStore['getAirportParkingVariant'](airportParkings[0]);

            expect(result).toBe('Parking 1|P001|meet_and_greet');
        });

        it('should return an empty string when airport parking is null', () => {
            const result = airportParkingTrackingStore['getAirportParkingVariant'](null);

            expect(result).toBe('');
        });
    });

    describe('getDepartureAirportName', () => {
        it('should return the correct departure airport name', () => {
            const result = airportParkingTrackingStore['getDepartureAirportName']();

            expect(result).toBe('TestDepartureAirport');
        });
    });

    describe('buildBaseDimensions', () => {
        it('should return default custom and event params if no extras are passed', () => {
            const result = airportParkingTrackingStore.buildBaseDimensions('London Gatwick');

            expect(generateGenericValues).toHaveBeenCalledWith({
                genericValue2: 'London Gatwick',
            });

            expect(result).toEqual({
                customParams: expect.any(Object),
                eventParams: {
                    eventCategory: EventCategories.ExternalExtras,
                    eventType: EventTypes.Interaction,
                },
            });
        });

        it('should merge extended customparams correctly', () => {
            const extendedCustomParams = {
                customKey1: 'value1',
                customKey2: null,
            };

            airportParkingTrackingStore.buildBaseDimensions('London Gatwick', extendedCustomParams);

            expect(generateGenericValues).toHaveBeenCalledWith({
                genericValue2: 'London Gatwick',
                customKey1: 'value1',
                customKey2: null,
            });
        });

        it('should merge extended eventparams correctly', () => {
            const result = airportParkingTrackingStore.buildBaseDimensions(
                'LGW',
                {},
                { eventType: 'CustomType', customParam: 'X' },
            );

            expect(result.eventParams).toEqual({
                eventCategory: EventCategories.ExternalExtras,
                eventType: 'CustomType',
                customParam: 'X',
            });
        });
    });

    describe('trackParkingListPageLoad', () => {
        it('should initialize page load object and add to data layer', async () => {
            await airportParkingTrackingStore.trackParkingListPageLoad();

            expect(mockRootStore.trackingStore.initializePageLoadObject).toHaveBeenCalledWith({
                title: 'Holiday External Extras Parking List',
                category: PageLoadCategory.Book,
                url: 'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
                pageReferral: 'https://www.easyjet.com/en/holidays/booking/',
                pageReferralName: 'Holiday External|EN',
            });

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalled();
        });
    });

    describe('trackParkingModuleInExtrasPageImpression', () => {
        it('should track parking module impression on extras page', () => {
            const sectionTitle = 'Test Section Title';
            const formattedTitle = 'Test Formatted Title';

            airportParkingTrackingStore.trackParkingModuleInExtrasPageImpression(sectionTitle, formattedTitle);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtras,
                    eventAction: EventActions.Impressions,
                    eventLabel: sectionTitle,
                    eventType: EventTypes.NonInteraction,
                },
                expect.any(Object),
            );
        });
    });

    describe('trackParkingListCtaClick', () => {
        it('should track the pop up CTA click with correct data', () => {
            const buttonLabel = 'Back to extras';
            const formattedTitle = 'Test Formatted Title';

            airportParkingTrackingStore.trackParkingListCtaClick(buttonLabel, formattedTitle);

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtras,
                    eventAction: EventActions.CTAClick,
                    eventLabel: buttonLabel,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
                false,
                false,
                {
                    pageTitle: 'Holiday External Extras Parking List',
                    pageUrl:
                        'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
                },
            );
        });
    });

    describe('trackParkingListEcommerceDimensions', () => {
        it('should track ecommerce dimensions for parking list', () => {
            const mockedBaseHoliday = { coupon: 'coupon' };

            mockRootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            mockRootStore.trackingStore.buildAirportParkingProduct = jest.fn().mockReturnValue('mockedParkingProduct');
            airportParkingTrackingStore.trackParkingListEcommerceDimensions(airportParkings);

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ExternalExtrasList,
                dimension136: 'Holiday External|EN',
                pageTitle: 'Holiday External Extras Parking List',
                ecommerce: {
                    impressions: ['mockedParkingProduct', 'mockedParkingProduct'],
                },
            });
        });
    });

    describe('trackParkingListError', () => {
        it('should track parking list error', () => {
            const errorMessage = 'Test error message';

            airportParkingTrackingStore.trackParkingListError(errorMessage);

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ErrorMessage,
                dimension13: undefined, // Timestamp
                dimension86: 'TestDepartureAirport',
                dimension87: errorMessage,
                dimension136: 'Holiday External|EN',
            });
        });
    });

    describe('trackBookParkingCtaClick', () => {
        it('should track Book Parking CTA click with correct data', () => {
            const mockedBaseHoliday = { coupon: 'coupon' };
            const mockedParkingProduct = {
                brand: 'TestDepartureAirport',
                category: ProductCategories.ExternalExtras,
                dimension108: EventTypes.ExternalExtrasAdd,
                id: ProductCategories.ExternalExtras,
                name: 'Airport Parking',
                price: 60,
                quantity: 1,
                variant: 'Parking 2|P002|on-site',
            };

            mockRootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            mockRootStore.trackingStore.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedParkingProduct);
            airportParkingTrackingStore.trackParkingListEcommerceDimensions(airportParkings);

            airportParkingTrackingStore.trackBookParkingCtaClick(airportParkings[1]);

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ExternalExtrasAdd,
                dimension136: 'Holiday External|EN',
                pageTitle: 'Holiday External Extras Parking List',
                ecommerce: {
                    currency: undefined,
                    add: {
                        products: [mockedParkingProduct],
                    },
                },
            });
        });
    });

    describe('trackBuyNowCtaClick', () => {
        it('should track Buy now CTA click with correct data', () => {
            airportParkingTrackingStore.trackBuyNowCtaClick('Buy Now', 'Test Formatted Title');

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: 'CTA Click',
                    eventCategory: 'External Extras',
                    eventLabel: 'Buy Now',
                    eventType: 'interaction',
                },
                expect.any(Object),
                true,
                true,
            );
        });
    });

    describe('trackSelectedParkingRemoveButton', () => {
        it('should track Remove CTA click with correct data', () => {
            const mockedBaseHoliday = { coupon: 'coupon' };
            const mockedParkingProduct = {
                brand: 'TestDepartureAirport',
                category: ProductCategories.ExternalExtras,
                dimension108: EventTypes.ExternalExtrasRemove,
                id: ProductCategories.ExternalExtras,
                name: 'Airport Parking',
                price: 60,
                quantity: 1,
                variant: 'Parking 2|P002|on-site',
            };

            mockRootStore.trackingStore.buildBaseHolidayProduct = jest.fn().mockReturnValue(mockedBaseHoliday);
            mockRootStore.trackingStore.buildAirportParkingProduct = jest.fn().mockReturnValue(mockedParkingProduct);

            airportParkingTrackingStore.trackSelectedParkingRemoveButton(airportParkings[1]);

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.ExternalExtrasRemove,
                dimension136: 'Holiday External|EN',
                ecommerce: {
                    currency: undefined,
                    remove: {
                        products: [mockedParkingProduct],
                    },
                },
            });
        });
    });

    describe('trackSelectedParkingEditButton', () => {
        it('should NOT add to datalayer if there is no selectedAirportParking', () => {
            const buttonLabel = 'Edit';
            const formattedTitle = 'Test Formatted Title';
            mockRootStore.airportParkingStore.selectedAirportParking = null;

            airportParkingTrackingStore.trackSelectedParkingEditButton(buttonLabel, formattedTitle);

            expect(mockRootStore.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });

        it('should track Edit CTA click with correct data', () => {
            const buttonLabel = 'Edit';
            const formattedTitle = 'Test Formatted Title';

            airportParkingTrackingStore.trackSelectedParkingEditButton(buttonLabel, formattedTitle);

            expect(generateGenericValues).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: formattedTitle,
                genericValue3: 'Parking 1|P001|meet_and_greet',
                genericValue4: null,
                destinationUrl:
                    'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
            });

            expect(mockRootStore.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.ExternalExtras,
                    eventAction: EventActions.CTAClick,
                    eventLabel: buttonLabel,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
                false,
                false,
                {
                    pageName: 'Holiday External|EN',
                    pageReferral:
                        'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
                    pageUrl: 'https://www.easyjet.com/en/holidays/booking/',
                },
            );
        });
    });

    describe('trackAirportParkingUpdatedInExtrasPage', () => {
        it('should track external extras updae in extras page', async () => {
            const mockParkingDimensionResponse = {
                dimension136: 'Holiday External|EN',
                ecommerce: {
                    detail: {
                        products: [
                            {
                                brand: 'TestDepartureAirport',
                                category: 'External Extras',
                                dimension108: 'external_extras_update',
                                id: 'External Extras',
                                name: 'Airport Parking',
                                price: 30,
                                quantity: 1,
                                variant: 'Parking 1|P001|meet_and_greet',
                            },
                        ],
                    },
                    impressions: [],
                },
                event: EventTypes.ExternalExtrasUpdate,
                pageTitle: undefined,
            };
            mockRootStore.trackingStore.addBookingFlowPageDimension = jest
                .fn()
                .mockReturnValue(mockParkingDimensionResponse);

            await airportParkingTrackingStore.trackAirportParkingUpdatedInExtrasPage(airportParkings[0]);

            expect(mockRootStore.trackingStore.addBookingFlowPageDimension).toHaveBeenCalledWith(
                EventTypes.ExternalExtrasUpdate,
            );

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith(mockParkingDimensionResponse);
        });
    });

    describe('trackExtrasPageLoadAfterSelectingParking', () => {
        it('should initialize page load object and add to data layer', async () => {
            await airportParkingTrackingStore.trackExtrasPageLoadAfterSelectingParking();

            expect(mockRootStore.trackingStore.initializePageLoadObject).toHaveBeenCalledWith({
                title: undefined,
                category: PageLoadCategory.Book,
                url: 'https://www.easyjet.com/en/holidays/booking/',
                pageReferral:
                    'https://www.easyjet.com/en/holidays/booking/testdepartureairport-external-extras-parking-list',
            });

            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalled();
        });
    });
});
