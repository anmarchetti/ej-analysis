import qs from 'qs';

import * as endpoints from 'code/endpoints';
import {
    cmsUrls,
    getWepApiUri,
    notificationsUrls,
    QS_CONFIG,
    shareUrls,
    tradePortalWebApiUrls,
    userManagementApiUrls,
    webApiUrls,
} from 'code/endpoints';
import { envPublic, getEnvAll } from 'code/env';
import { mockBoardType, mockBooking, mockTransfer } from 'frontend/__mocks__';
import { queryRoomMock } from 'frontend/__mocks__/room';
import { SitecoreChannel } from 'frontend/store/base/tracking/sitecore/constants';
import isBackend from 'frontend/utils/isBackend';
import * as urlUtils from 'frontend/utils/url.utils';
import { DestinationTypeBit } from 'models/enum/DestinationType';

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockedIsBacked = isBackend as jest.MockedFn<typeof isBackend>;

const rooms = [queryRoomMock];
const roomsString = '&room[0].adults=3&room[0].children=2&room[0].infants=1&room[0].roomCode=13HG5&childAges=5,7';
const mockSelectedSeats = [
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '2E',
            },
            {
                paxIndex: 2,
                seatNumber: '3F',
            },
        ],
        sectorId: '1',
    },
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '4D',
            },
            {
                paxIndex: 2,
                seatNumber: '5B',
            },
        ],
        sectorId: '2',
    },
];

describe('endpoints', () => {
    describe('cmsUrls', () => {
        it('should placeholderLayout return correct url', () => {
            const cmsUrlPlaceholder = cmsUrls.placeholdersLayout('', ['test'], 'en');
            expect(cmsUrlPlaceholder).toBe(`${envPublic.CMS_LAYOUT}/placeholder?item=&lang=en&placeholderName[0]=test`);
        });

        it('should media return group', () => {
            const spy = jest.spyOn(cmsUrls, 'media');
            const cmsUrlMedia = cmsUrls.media(
                '/holidays/cms/media/-/media/project/holidays/default/view-booking/fallback-image.ashx',
            );

            expect(spy).toHaveBeenCalled();
            expect(cmsUrlMedia).toBe(
                `${envPublic.CMS_MEDIA}/-/media/project/holidays/default/view-booking/fallback-image.ashx`,
            );
        });

        it('should media return path', () => {
            const spy = jest.spyOn(cmsUrls, 'media');
            const cmsUrlMedia = cmsUrls.media('path');

            expect(spy).toHaveBeenCalled();
            expect(cmsUrlMedia).toBe('path');
        });

        it('should return correct url when itemDetails called', () => {
            const itemDetails = cmsUrls.itemDetails('abc', 'test');
            expect(itemDetails).toBe(`/sitecore/api/ssc/item/abc?sc_lang=en&fields=test`);
        });

        it('should return correct url when itemChildren called', () => {
            const itemChildren = cmsUrls.itemChildren('abc', 'test', true);
            expect(itemChildren).toBe(
                `/sitecore/api/ssc/item/abc/children?sc_lang=en&fields=test&includeStandardTemplateFields=true`,
            );
        });

        it('should return correct url when createItem called', () => {
            const createItem = cmsUrls.createItem('abc', 'en');
            expect(createItem).toBe(`/sitecore/api/ssc/item/bc?sc_lang=en`);
        });

        it('should return correct url when deleteItem called', () => {
            const deleteItem = cmsUrls.deleteItem('abc', 'en');
            expect(deleteItem).toBe(`/sitecore/api/ssc/item/abc?sc_lang=en`);
        });

        it('should return correct url when getVirtualFacilityGroupIdByFacilityId called', () => {
            const VirtualFacilityUrl = cmsUrls.getVirtualFacilityGroupIdByFacilityId('abc', 'en');
            expect(VirtualFacilityUrl).toBe(
                `/api/ReferenceData/GetVirtualFacilityGroupIdByFacilityId?sc_lang=en&id=abc`,
            );
        });
    });

    describe('getWepApiUri', () => {
        it('should return backend response', () => {
            mockedIsBacked.mockReturnValueOnce(true);
            expect(getWepApiUri()).toBe(`${getEnvAll().ORIGINAL_WEBAPI_URL}/v1.0`);
        });

        it('should return frontend response', () => {
            mockedIsBacked.mockReturnValueOnce(false);
            expect(getWepApiUri()).toBe(`${envPublic.WEBAPI_URL}/v1.0`);
        });
    });

    describe('boolToString', () => {
        it('should return true', () => {
            const spy = jest.spyOn(endpoints, 'boolToString');
            const boolToString = endpoints.boolToString(true);

            expect(spy).toHaveBeenCalled();
            expect(boolToString).toBe('true');
        });

        it('should return false', () => {
            const spy = jest.spyOn(endpoints, 'boolToString');
            const boolToString = endpoints.boolToString(false);

            expect(spy).toHaveBeenCalled();
            expect(boolToString).toBe('false');
        });
    });

    describe('webApiUrls', () => {
        describe('search', () => {
            it('should return required url for search', () => {
                expect(
                    webApiUrls.search({
                        startDate: 'sdate',
                        flexibleDays: 0,
                        duration: ['7'],
                        dep: 'dep',
                        geog: 'geog',
                        autoAllocation: false,
                        rooms,
                        flightDurationFrom: 60,
                        flightDurationTo: 360,
                    }),
                ).toBe(
                    'http://test/api/v1.0/search/packages?' +
                        qs.stringify(
                            {
                                startDate: 'sdate',
                                flexibleDays: 0,
                                duration: ['7'],
                                flightDurationFrom: 60,
                                flightDurationTo: 360,
                                departure: 'dep',
                                geography: 'geog',
                                automaticAllocation: false,
                            },
                            QS_CONFIG,
                        ) +
                        roomsString +
                        '&distressedFlightsOnly=false' +
                        '&originalGeography=geog',
                );
            });

            it('should return required url for search on promo page', () => {
                expect(
                    webApiUrls.search({
                        startDate: 'sdate',
                        flexibleDays: 0,
                        duration: ['7'],
                        dep: 'dep',
                        geog: 'geog',
                        autoAllocation: false,
                        rooms,
                        flightDurationFrom: 60,
                        flightDurationTo: 360,
                        isPromoPage: true,
                    }),
                ).toBe(
                    'http://test/api/v1.0/search/packages?' +
                        qs.stringify(
                            {
                                startDate: 'sdate',
                                flexibleDays: 0,
                                duration: ['7'],
                                flightDurationFrom: 60,
                                flightDurationTo: 360,
                                departure: 'dep',
                                automaticAllocation: false,
                            },
                            QS_CONFIG,
                        ) +
                        roomsString +
                        '&distressedFlightsOnly=false&isPromo=true&originalGeography=geog',
                );
            });

            it('should return required url for search on promo page with destination', () => {
                expect(
                    webApiUrls.search({
                        startDate: 'sdate',
                        flexibleDays: 0,
                        duration: ['7'],
                        dep: 'dep',
                        geog: 'geog',
                        destination: 'editorGeographyQuery',
                        autoAllocation: false,
                        rooms,
                        flightDurationFrom: 60,
                        flightDurationTo: 360,
                        isPromoPage: true,
                    }),
                ).toBe(
                    'http://test/api/v1.0/search/packages?' +
                        qs.stringify(
                            {
                                startDate: 'sdate',
                                flexibleDays: 0,
                                duration: ['7'],
                                flightDurationFrom: 60,
                                flightDurationTo: 360,
                                departure: 'dep',
                                geography: 'editorGeographyQuery',
                                automaticAllocation: false,
                            },
                            QS_CONFIG,
                        ) +
                        roomsString +
                        '&distressedFlightsOnly=false&isPromo=true&originalGeography=geog',
                );
            });

            it('should return required url for full search', () => {
                expect(
                    webApiUrls.search({
                        startDate: 'sdate',
                        flexibleDays: 3,
                        duration: ['7'],
                        dep: 'dep',
                        geog: 'geog',
                        autoAllocation: true,
                        rooms,
                        take: 1,
                        page: 1,
                        orderBy: 'orderBy',
                        orderDirection: 'orderDirection',
                        boardType: 'boardType',
                        facilities: 'facilities',
                        flights: 'flights',
                        starRating: 'starRating',
                        tripAdvisorRating: 'tripAdvisorRating',
                        initialThemes: 'initialThemes',
                        themes: 'themes',
                        accomCodes: 'accomCodes',
                        polygon: 'polyQuery',
                        endDate: 'edate',
                        offers: 'offers1,offers2',
                        initialPricePPFrom: 50,
                        initialPricePPTo: 250,
                        initialTotalPriceFrom: 200,
                        initialTotalPriceTo: 400,
                        priceFrom: 100,
                        priceTo: 200,
                        isPricePP: false,
                        searchType: 'normal',
                        distressedFlightsOnly: true,
                        minDisc: undefined,
                        maxDisc: undefined,
                        minDiscP: undefined,
                        maxDiscP: undefined,
                        discountOnly: undefined,
                        placementId: 'placementId',
                        isPromoPage: false,
                        promoPageId: 'promoPageId',
                        inboundTimeSlots: 'inboundTimeSlots',
                        outboundTimeSlots: 'outboundTimeSlots',
                        destinations: null,
                        hotelTypes: 'hotelTypes',
                        flightDurationFrom: 60,
                        flightDurationTo: 360,
                        inboundFlightNumber: 'EZY0001',
                        outboundFlightNumber: 'EZY0002',
                        deviceType: SitecoreChannel.Desktop,
                    }),
                ).toBe(
                    'http://test/api/v1.0/search/packages?' +
                        qs.stringify(
                            {
                                startDate: 'sdate',
                                flexibleDays: 3,
                                duration: ['7'],
                                take: 1,
                                page: 1,
                                orderBy: 'orderBy',
                                orderDirection: 'orderDirection',
                                boardType: 'boardType',
                                facilities: 'facilities',
                                flights: 'flights',
                                starRating: 'starRating',
                                tripAdvisorRating: 'tripAdvisorRating',
                                initialThemes: 'initialThemes',
                                themes: 'themes',
                                polygon: 'polyQuery',
                                endDate: 'edate',
                                offers: 'offers1,offers2',
                                initialPricePPFrom: 50,
                                initialPricePPTo: 250,
                                initialTotalPriceFrom: 200,
                                initialTotalPriceTo: 400,
                                searchType: 'normal',
                                placementId: 'placementId',
                                promoPageId: 'promoPageId',
                                inboundTimeSlots: 'inboundTimeSlots',
                                outboundTimeSlots: 'outboundTimeSlots',
                                destinations: null,
                                hotelTypes: 'hotelTypes',
                                flightDurationFrom: 60,
                                flightDurationTo: 360,
                                inboundFlightNumber: 'EZY0001',
                                outboundFlightNumber: 'EZY0002',
                                departure: 'dep',
                                geography: 'geog',
                                automaticAllocation: true,
                            },
                            QS_CONFIG,
                        ) +
                        roomsString +
                        '&' +
                        qs.stringify(
                            {
                                accomCodes: 'accomCodes',
                                PriceFrom: 100,
                                PriceTo: 200,
                                IsPricePP: false,
                                distressedFlightsOnly: true,
                            },
                            QS_CONFIG,
                        ) +
                        '&originalGeography=geog&DeviceType=WEB',
                );
            });
        });

        describe('searchSummary', () => {
            const baseParams = {
                startDate: '2024-07-01',
                flexibleDays: 3,
                departure: 'LGW,LTN',
                departureAirport: 'LGW,LTN',
                duration: [5],
                geography: 'IT,ITSO|ITLC|ITLG|ITML|ITMI|ITNA|ITPI|ITPU|ITRO|ITSA|ITSI|ITTU|ITTS|ITVE|ITVR',
                rooms,
            };

            const params = {
                ...baseParams,
                starRating: '5',
                accomCodes: 'accom-codes',
                flightDurationFrom: 120,
                flightDurationTo: 300,
                PriceFrom: 100,
                PriceTo: 1000,
                boardType: 'board-type',
                facilities: 'facilites',
                offers: 'offers',
                hotelTypes: 'hotel-types',
                outboundTimeSlots: 'outbound',
                inboundTimeSlots: 'inbound',
            };

            it('should be called with base params', () => {
                const spy = jest.spyOn(webApiUrls, 'searchSummary');

                const url = webApiUrls.searchSummary(baseParams);

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/packages-summary?' +
                        roomsString.slice(1) +
                        '&' +
                        qs.stringify({ ...baseParams, rooms: undefined }, QS_CONFIG),
                );
            });

            it('should be called with all params', () => {
                const spy = jest.spyOn(webApiUrls, 'searchSummary');

                const url = webApiUrls.searchSummary(params);

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/packages-summary?' +
                        roomsString.slice(1) +
                        '&' +
                        qs.stringify({ ...baseParams, ...params, rooms: undefined }, QS_CONFIG),
                );
            });
        });

        describe('searchMap', () => {
            const baseParams = {
                startDate: '2024-07-04',
                flexibleDays: 3,
                duration: [5],
                departure: 'LGW,LTN',
                departureAirport: 'LGW,LTN',
                geography: 'IT,ITSO|ITLC|ITLG|ITML|ITMI|ITNA|ITPI|ITPU|ITRO|ITSA|ITSI|ITTU|ITTS|ITVE|ITVR',
                polygon:
                    '38.03811514298362,14.028888976287837|38.03811514298362,14.003011023712153|38.029664613277674,14.003011023712153|38.029664613277674,14.028888976287837',
                rooms,
            };

            const params = {
                ...baseParams,
                starRating: '5',
                accomCodes: 'accom-codes',
                flightDurationFrom: 120,
                flightDurationTo: 300,
                PriceFrom: 100,
                PriceTo: 1000,
                boardType: 'board-type',
                facilities: 'facilites',
                offers: 'offers',
                hotelTypes: 'hotel-types',
                outboundTimeSlots: 'outbound',
                inboundTimeSlots: 'inbound',
            };

            it('should be called with base params', () => {
                const spy = jest.spyOn(webApiUrls, 'searchMap');

                const url = webApiUrls.searchMap(baseParams);

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/packages-map?' +
                        roomsString.slice(1) +
                        '&' +
                        qs.stringify({ ...baseParams, rooms: undefined }, QS_CONFIG),
                );
            });

            it('should be called with all params', () => {
                const spy = jest.spyOn(webApiUrls, 'searchMap');

                const url = webApiUrls.searchMap(params);

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/packages-map?' +
                        roomsString.slice(1) +
                        '&' +
                        qs.stringify({ ...baseParams, ...params, rooms: undefined }, QS_CONFIG),
                );
            });
        });

        describe('searchDestinations ', () => {
            it('should return searchDestinations', () => {
                const spy = jest.spyOn(webApiUrls, 'searchDestinations');
                const searchDestinations = webApiUrls.searchDestinations('query', 'from', 'startDate', 'endDate', 0);

                expect(spy).toHaveBeenCalled();
                expect(searchDestinations).toBe(
                    'http://test/api/v1.0/destinations/search?query=query&from=from&startDate=startDate&endDate=endDate&flexibleDays=0',
                );
            });

            it('should encode searchDestinations query', () => {
                const spy = jest.spyOn(webApiUrls, 'searchDestinations');
                const searchDestinations = webApiUrls.searchDestinations(
                    'param=1&param=2',
                    'from',
                    'startDate',
                    'endDate',
                    0,
                );

                expect(spy).toHaveBeenCalled();
                expect(searchDestinations).toBe(
                    'http://test/api/v1.0/destinations/search?query=param%3D1%26param%3D2&from=from&startDate=startDate&endDate=endDate&flexibleDays=0',
                );
            });

            it('should be called with all parameters', () => {
                const spy = jest.spyOn(webApiUrls, 'searchDestinations');
                const searchDestinations = webApiUrls.searchDestinations(
                    'param=1&param=2',
                    'from',
                    'startDate',
                    'endDate',
                    0,
                    7,
                );

                expect(spy).toHaveBeenCalled();
                expect(searchDestinations).toBe(
                    'http://test/api/v1.0/destinations/search?query=param%3D1%26param%3D2&from=from&startDate=startDate&endDate=endDate&flexibleDays=0&duration=7',
                );
            });
        });

        it('should return searchDestinations by query and types', () => {
            const searchDestinations = webApiUrls.searchDestinationsByQueryAndTypes('query', [
                DestinationTypeBit.Country,
            ]);
            expect(searchDestinations).toBe('http://test/api/v1.0/destinations?query=query&destination=1');
        });

        describe('searchHotel', () => {
            it('should return required searchHotel', () => {
                const spy = jest.spyOn(webApiUrls, 'searchHotel');
                const url = webApiUrls.searchHotel(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    [{ childrenAges: [1] } as any],
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/hotel/offers?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep&room[0].adults=0&room[0].children=0' +
                        '&room[0].infants=0&childAges=1&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId',
                );
            });

            it('should return full searchHotel', () => {
                const spy = jest.spyOn(webApiUrls, 'searchHotel');
                const searchHotel = webApiUrls.searchHotel(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    [{ childrenAges: [1] } as any],
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    'boardType',
                    'transferCode',
                    'geog',
                    true,
                    true,
                    [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
                    mockSelectedSeats,
                    { LUG: 2, LUS: 2 },
                    { LUG: 1, LUS: 1 },
                    'lux',
                    500,
                    '1|2|3',
                    '4|5|6',
                );

                expect(spy).toHaveBeenCalled();
                expect(searchHotel).toBe(
                    'http://test/api/v1.0/hotel/offers?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep&room[0].adults=0&room[0].children=0' +
                        '&room[0].infants=0&childAges=1&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId' +
                        '&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&boardType=boardType' +
                        '&transfer=transferCode&geography=geog&isExt=true&lateRoomCheckout=true&seats[0]=2E|3F&seats[1]=4D|5B&lug[0]=LUG-2|LUS-2&lug[1]=LUG-1|LUS-1&lcbOut=1|2|3&lcbIn=4|5|6&hotelTypes=lux&searchPrice=500',
                );
            });

            it('should include ecp in url when provided', () => {
                const spy = jest.spyOn(webApiUrls, 'searchHotel');
                const url = webApiUrls.searchHotel(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    [{ childrenAges: [1] } as any],
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'fph',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/hotel/offers?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep&room[0].adults=0&room[0].children=0' +
                        '&room[0].infants=0&childAges=1&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId&ecp=fph',
                );
            });

            it('should return correct url with seats booked only for one leg', () => {
                const spy = jest.spyOn(webApiUrls, 'searchHotel');
                const selectedSeats = mockSelectedSeats;
                selectedSeats[1].seats = [];
                const searchHotel = webApiUrls.searchHotel(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    [{ childrenAges: [1] } as any],
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    'boardType',
                    'transferCode',
                    'geog',
                    true,
                    true,
                    [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
                    selectedSeats,
                    { LUG: 2, LUS: 2 },
                    { LUG: 1, LUS: 1 },
                    'lux',
                );

                expect(spy).toHaveBeenCalled();
                expect(searchHotel).toBe(
                    'http://test/api/v1.0/hotel/offers?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep&room[0].adults=0&room[0].children=0' +
                        '&room[0].infants=0&childAges=1&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId' +
                        '&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&boardType=boardType' +
                        '&transfer=transferCode&geography=geog&isExt=true&lateRoomCheckout=true&seats[0]=2E|3F&seats[1]=&lug[0]=LUG-2|LUS-2&lug[1]=LUG-1|LUS-1&hotelTypes=lux',
                );
            });
        });

        describe('searchOffersAlterations', () => {
            const spy = jest.spyOn(webApiUrls, 'searchOffersAlterations');

            it('should return required searchOffersAlterations', () => {
                const url = webApiUrls.searchOffersAlterations(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    rooms,
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    'boardType',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/offers-alterations?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId&boardType=boardType',
                );
            });

            it('should return full searchOffersAlterations', () => {
                const searchHotel = webApiUrls.searchOffersAlterations(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    rooms,
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    'boardType',
                    false,
                    [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }],
                    'transferCode',
                );

                expect(spy).toHaveBeenCalled();
                expect(searchHotel).toBe(
                    'http://test/api/v1.0/search/offers-alterations?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId' +
                        '&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&boardType=boardType&transfer=transferCode',
                );
            });

            it('should include ecp in url when provided', () => {
                const url = webApiUrls.searchOffersAlterations(
                    'sdate',
                    0,
                    'stay',
                    'dep',
                    rooms,
                    'accommodationId',
                    'outboundRouteId',
                    'inboundRouteId',
                    'packageId',
                    'boardType',
                    undefined,
                    undefined,
                    undefined,
                    'fph',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/offers-alterations?' +
                        'startDate=sdate&flexibleDays=0&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId' +
                        '&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&packageId=packageId&boardType=boardType&ecp=fph',
                );
            });
        });

        it('should return getAllDestinations', () => {
            const spy = jest.spyOn(webApiUrls, 'getAllDestinations');
            const getAllDestinations = webApiUrls.getAllDestinations();

            expect(spy).toHaveBeenCalled();
            expect(getAllDestinations).toBe('http://test/api/v1.0/destinations/countries');
        });

        it('should return getAvailableDestinations', () => {
            const spy = jest.spyOn(webApiUrls, 'getAvailableDestinations');
            const getAvailableDestinations = webApiUrls.getAvailableDestinations('from', 'startDate', 'endDate', 0, 7);

            expect(spy).toHaveBeenCalled();
            expect(getAvailableDestinations).toBe(
                'http://test/api/v1.0/availability/to?from=from&startDate=startDate&endDate=endDate&flexibleDays=0&duration=7',
            );
        });

        describe('getAvailableDates', () => {
            it('should be called with NOT all params ', () => {
                const spy = jest.spyOn(webApiUrls, 'getAvailableDates');
                const getAvailableDates = webApiUrls.getAvailableDates('from', 'to', 'startDate', 'endDate');

                expect(spy).toHaveBeenCalled();
                expect(getAvailableDates).toBe(
                    'http://test/api/v1.0/availability/dates?from=from&to=to&startDate=startDate&endDate=endDate',
                );
            });

            it('should be called with all params ', () => {
                const spy = jest.spyOn(webApiUrls, 'getAvailableDates');
                const getAvailableDates = webApiUrls.getAvailableDates(
                    'from',
                    'to',
                    'startDate',
                    'endDate',
                    '123456',
                    'selectedFromDate',
                );

                expect(spy).toHaveBeenCalled();
                expect(getAvailableDates).toBe(
                    'http://test/api/v1.0/availability/dates?from=from&startDate=startDate&endDate=endDate&promoPageId=123456&selectedFromDate=selectedFromDate',
                );
            });
        });

        describe('getAvailableOrigins', () => {
            const spy = jest.spyOn(webApiUrls, 'getAvailableOrigins');

            it('should be called with NOT all parameters', () => {
                const getAvailableOrigins = webApiUrls.getAvailableOrigins('to', 'startDate', 'endDate', 0);

                expect(spy).toHaveBeenCalled();
                expect(getAvailableOrigins).toBe(
                    'http://test/api/v1.0/availability/from?to=to&startDate=startDate&endDate=endDate&flexibleDays=0',
                );
            });

            it('should be called with all parameters', () => {
                const getAvailableOrigins = webApiUrls.getAvailableOrigins(
                    'to',
                    'startDate',
                    'endDate',
                    0,
                    '123456',
                    7,
                );

                expect(spy).toHaveBeenCalled();
                expect(getAvailableOrigins).toBe(
                    'http://test/api/v1.0/availability/from?startDate=startDate&endDate=endDate&flexibleDays=0&promoPageId=123456&duration=7',
                );
            });
        });

        it('should return getDestinationByDotComCodes', () => {
            const spy = jest.spyOn(webApiUrls, 'getDestinationByDotComCodes');
            const getDestinationByDotComCodes = webApiUrls.getDestinationByDotComCodes('query');

            expect(spy).toHaveBeenCalled();
            expect(getDestinationByDotComCodes).toBe('http://test/api/v1.0/destinations/map?query=query');
        });

        it('should return getDestinationLocationImage', () => {
            const spy = jest.spyOn(webApiUrls, 'getDestinationLocationImage');
            const getDestinationLocationImage = webApiUrls.getDestinationLocationImage('locationCode');

            expect(spy).toHaveBeenCalled();
            expect(getDestinationLocationImage).toBe('http://test/api/v1.0/destinations/locationCode/image');
        });

        it('should return hotelInfo', () => {
            const spy = jest.spyOn(webApiUrls, 'hotelInfo');
            const hotelInfo = webApiUrls.hotelInfo('hotelCode');

            expect(spy).toHaveBeenCalled();
            expect(hotelInfo).toBe('http://test/api/v1.0/content/hotels/hotelCode?board=&room=');
        });

        it('should return viewBooking', () => {
            const spy = jest.spyOn(webApiUrls, 'viewBooking');
            const viewBooking = webApiUrls.viewBooking();

            expect(spy).toHaveBeenCalled();
            expect(viewBooking).toBe('http://test/api/v1.0/booking/retrieve');
        });

        it('should return pdfBooking', () => {
            const spy = jest.spyOn(webApiUrls, 'pdfBooking');
            const pdfBooking = webApiUrls.pdfBooking();

            expect(spy).toHaveBeenCalled();
            expect(pdfBooking).toBe('http://test/api/v1.0/booking/confirmation');
        });

        it('should return reviews', () => {
            const spy = jest.spyOn(webApiUrls, 'getReviews');
            const hotelId = 123;
            const getReviews = webApiUrls.getReviews(hotelId);

            expect(spy).toHaveBeenCalled();
            expect(getReviews).toBe(`http://test/api/v1.0/hotel/reviews/${hotelId}`);
        });

        describe('getFeefoReviews', () => {
            const spy = jest.spyOn(webApiUrls, 'getFeefoReviews');
            const count = 123;
            const rating = ['4', '5'];

            it('should return only required params', () => {
                const getFeefoReviews = webApiUrls.getFeefoReviews(count, rating);

                expect(spy).toHaveBeenCalled();
                expect(getFeefoReviews).toBe(
                    `http://test/api/v1.0/reviews?count=${count}&rating[0]=${rating[0]}&rating[1]=${rating[1]}`,
                );
            });

            it('should return all params', () => {
                const getFeefoReviews = webApiUrls.getFeefoReviews(
                    count,
                    rating,
                    'createdDateTime',
                    'updatedDateTime',
                    'sort',
                    'createdSince',
                    'tagDate',
                    'tagCategory',
                    'tagDestinationCountry',
                    'tagDestinationRegion',
                    'tagResort',
                    'tagNumberOfPassengers',
                    'tagPackageType',
                );

                expect(spy).toHaveBeenCalled();
                expect(getFeefoReviews).toBe(
                    `http://test/api/v1.0/reviews?count=${count}&rating[0]=${rating[0]}&rating[1]=${rating[1]}` +
                        `&createdDateTime=createdDateTime&updatedDateTime=updatedDateTime&sort=sort&createdSince=createdSince` +
                        `&tagDate=tagDate&tagCategory=tagCategory&tagDestinationCountry=tagDestinationCountry` +
                        `&tagDestinationRegion=tagDestinationRegion&tagResort=tagResort&tagNumberOfPassengers=tagNumberOfPassengers&tagPackageType=tagPackageType`,
                );
            });
        });

        it('should return fetchSeatMap', () => {
            const fetchSeatMap = webApiUrls.fetchSeatMap('airport1', 'airport2', 'departureDate', '123', true, 'PROMO');
            expect(fetchSeatMap).toBe(
                `${getWepApiUri()}/seats?DepAirportCode=airport1&ArrAirportCode=airport2&DepartureDate=departureDate&FlightNumber=123&IsOutboundFlight=true&Promo=PROMO`,
            );
        });

        it('should return validatePackage', () => {
            expect(webApiUrls.validatePackage()).toBe(`${getWepApiUri()}/booking/validate-package`);
        });

        it('should return validatePromoCode', () => {
            expect(webApiUrls.validatePromoCode()).toBe(`${getWepApiUri()}/booking/validate-promo-code`);
        });

        it('should return resetPassword', () => {
            const { resetPassword } = webApiUrls.session;
            expect(resetPassword('test@test.com')).toBe(`${getWepApiUri()}/account/reset-password?email=test@test.com`);
        });

        it('should return verifyEmail', () => {
            const { verifyEmail } = webApiUrls.session;
            expect(verifyEmail('test@test.com')).toBe(`${getWepApiUri()}/account/exists?email=test@test.com`);
        });

        it('should return getDestinationsAvailability', () => {
            const destinationsAvailability = webApiUrls.getDestinationsAvailability('London');
            expect(destinationsAvailability).toBe(`${getWepApiUri()}/availability/exists?to=London`);
        });

        it('should return simpleBookingSearch', () => {
            const simpleBookingSearch = webApiUrls.simpleBookingSearch('abc123');
            expect(simpleBookingSearch).toBe(
                `${getWepApiUri()}/trade-portal/booking/search/simple/?bookingReference=abc123`,
            );
        });

        it('should return bookingByToken', () => {
            const bookingByToken = webApiUrls.bookingByToken('token');
            expect(bookingByToken).toBe(`${getWepApiUri()}/booking/token`);
        });

        it('should return facilities', () => {
            const facilities = webApiUrls.facilities();
            expect(facilities).toBe(`${getWepApiUri()}/content/filter-facilities`);
        });

        it('should return loadResortInfo', () => {
            const loadResortInfo = webApiUrls.loadResortInfo('code123');
            expect(loadResortInfo).toBe(`${getWepApiUri()}/hotel/resort-info?code=code123`);
        });

        it('should return loadHotelHighlightsInfo', () => {
            const loadHighlightsInfo = webApiUrls.loadHotelHighlightsInfo('code123');
            expect(loadHighlightsInfo).toBe(`${getWepApiUri()}/hotel/highlights-info?code=code123`);
        });

        it('should return featuredFacilities', () => {
            const featuredFacilities = webApiUrls.featuredFacilities('code123');
            expect(featuredFacilities).toBe(`${getWepApiUri()}/hotel/featured-facilities?code=code123`);
        });

        describe('getPriceGraphDates', () => {
            it('should return getPriceGraphDates without isCheapestRoom parameter', () => {
                const graphDatesUrl = webApiUrls.getPriceGraphDates(
                    'startDate',
                    'initialDate',
                    3,
                    7,
                    'departure',
                    [{ childrenAges: [1] } as any],
                    'abc123',
                    'board',
                    [
                        { start: '456', end: '123' },
                        { start: '098', end: '789' },
                    ],
                    [],
                );
                expect(graphDatesUrl).toBe(
                    'http://test/api/v1.0/search/price-graph?startDate=startDate&initialDate=initialDate&flexibleDays=3&duration=7' +
                        '&departure=departure&room[0].adults=0&room[0].children=0&room[0].infants=0' +
                        '&childAges=1&accommodationIds=abc123&boardType=board&outboundDepartureTime[0].start=456&outboundDepartureTime[0].end=123' +
                        '&outboundDepartureTime[1].start=098&outboundDepartureTime[1].end=789',
                );
            });

            it('should return getPriceGraphDates', () => {
                const graphDatesUrl = webApiUrls.getPriceGraphDates(
                    'startDate',
                    'initialDate',
                    3,
                    7,
                    'departure',
                    [{ childrenAges: [1] } as any],
                    'abc123',
                    'board',
                    [
                        { start: '456', end: '123' },
                        { start: '098', end: '789' },
                    ],
                    [],
                    true,
                );
                expect(graphDatesUrl).toBe(
                    'http://test/api/v1.0/search/price-graph?startDate=startDate&initialDate=initialDate&flexibleDays=3&duration=7' +
                        '&departure=departure&room[0].adults=0&room[0].children=0&room[0].infants=0' +
                        '&childAges=1&accommodationIds=abc123&boardType=board&outboundDepartureTime[0].start=456&outboundDepartureTime[0].end=123' +
                        '&outboundDepartureTime[1].start=098&outboundDepartureTime[1].end=789&isCheapestRoom=true',
                );
            });
        });

        it('should return getPricesForCompareCalendar', () => {
            const compareCalendar = webApiUrls.getPricesForCompareCalendar(
                'startDate',
                'start',
                'end',
                3,
                7,
                'departure',
                [{ childrenAges: [1] } as any],
                'abc123,code2,code3',
                'board',
                [
                    { start: '456', end: '123' },
                    { start: '098', end: '789' },
                ],
                [],
                false,
            );
            expect(compareCalendar).toBe(
                'http://test/api/v1.0/search/price-graph/month?startDate=startDate&start=start&end=end&flexibleDays=3&duration=7' +
                    '&departure=departure&room[0].adults=0&room[0].children=0&room[0].infants=0&childAges=1' +
                    '&accommodationIds=abc123,code2,code3&boardType=board&outboundDepartureTime[0].start=456&outboundDepartureTime[0].end=123' +
                    '&outboundDepartureTime[1].start=098&outboundDepartureTime[1].end=789&isCheapestRoom=false',
            );
        });

        it('should return cancellationSummary endpoint', () => {
            const cancellationSummary = webApiUrls.cancellationSummary();
            expect(cancellationSummary).toBe('http://test/api/v1.0/booking/cancellation/summary/customer');
        });

        it('should return cancel booking endpoint', () => {
            const cancelBooking = webApiUrls.cancelBooking();
            expect(cancelBooking).toBe('http://test/api/v1.0/booking/cancellation/customer');
        });

        describe('recommended', () => {
            const mockPlacementId = 'mockPlacementId';
            const mockPageName = 'mockPageName';

            it('should return recommended with all params passed', () => {
                const recommended = webApiUrls.recommended(
                    'sdate',
                    3,
                    ['stay'],
                    'dep',
                    'geog',
                    false,
                    [{ childrenAges: [1] } as any],
                    mockPageName,
                    'offers',
                    true,
                    mockPlacementId,
                    'accomCodes',
                    'endDate',
                    true,
                    'promoPageId',
                    ['destinations1', 'destinations2'],
                );
                expect(recommended).toBe(
                    'http://test/api/v1.0/search/recommended?startDate=sdate&endDate=endDate&flexibleDays=3&duration[0]=stay&departure=dep&geography=geog' +
                        '&automaticAllocation=false&room[0].adults=0&room[0].children=0&room[0].infants=0&childAges=1&offers=offers&searchType=normal' +
                        `&distressedFlightsOnly=true&placementId=${mockPlacementId}&pageType=${mockPageName}&isPromo=true&promopageId=promoPageId` +
                        '&destinations[0]=destinations1&destinations[1]=destinations2',
                );
            });

            it('should return recommended with only required params', () => {
                const recommended = webApiUrls.recommended('sdate', 3, ['stay'], 'dep', 'geog', false, [
                    { childrenAges: [1] } as any,
                ]);
                expect(recommended).toBe(
                    'http://test/api/v1.0/search/recommended?startDate=sdate&flexibleDays=3&duration[0]=stay&departure=dep&geography=geog' +
                        '&automaticAllocation=false&room[0].adults=0&room[0].children=0&room[0].infants=0&childAges=1&searchType=normal' +
                        `&distressedFlightsOnly=false`,
                );
            });

            it('should return recommendedBrowse with all params passed', () => {
                const recommendedBrowse = webApiUrls.recommendedBrowse(
                    ['country:country'],
                    true,
                    mockPlacementId,
                    mockPageName,
                    'accomCodes',
                    3,
                );
                expect(recommendedBrowse).toBe(
                    `http://test/api/v1.0/search/recommended?destinations[0]=country:country&IsDestinationSearch=true&placementId=${mockPlacementId}&pageType=${mockPageName}&accomCodes=accomCodes&requestedAmountOfHotels=3`,
                );
            });

            it('should return recommendedBrowse with only required params', () => {
                const recommendedBrowse = webApiUrls.recommendedBrowse(['country:country'], true, mockPlacementId);
                expect(recommendedBrowse).toBe(
                    `http://test/api/v1.0/search/recommended?destinations[0]=country:country&IsDestinationSearch=true&placementId=${mockPlacementId}`,
                );
            });

            it('should return recommendedGeneric with all params passed', () => {
                const recommendedGeneric = webApiUrls.recommendedGeneric(
                    mockPlacementId,
                    mockPageName,
                    false,
                    true,
                    'hotelThemeTypes',
                );
                expect(recommendedGeneric).toBe(
                    `http://test/api/v1.0/search/recommended?placementId=${mockPlacementId}&pageType=${mockPageName}&isDestinationSearch=false&isLivePrice=true&hotelThemeTypes=hotelThemeTypes`,
                );
            });

            it('should return recommendedGeneric with only required params', () => {
                const recommendedGeneric = webApiUrls.recommendedGeneric(mockPlacementId);
                expect(recommendedGeneric).toBe(
                    `http://test/api/v1.0/search/recommended?placementId=${mockPlacementId}&isDestinationSearch=true&isLivePrice=false`,
                );
            });
        });

        it('should return getShortlistOffers', () => {
            const getShortlistOffers = webApiUrls.getShortlistOffers(123, 1);
            expect(getShortlistOffers).toBe(`${getWepApiUri()}/shortlist?take=123&page=1`);
        });

        it('should return deleteShortlistedItems', () => {
            const deleteShortlistedItems = webApiUrls.deleteShortlistedItems(['123', '456']);
            expect(deleteShortlistedItems).toBe(`${getWepApiUri()}/shortlist/delete?ids[0]=123&ids[1]=456`);
        });

        it('should return getHotelShortlistStatus', () => {
            const getHotelShortlistStatus = webApiUrls.getHotelShortlistStatus('abc123');
            expect(getHotelShortlistStatus).toBe(`${getWepApiUri()}/shortlist/hotelStatus/abc123`);
        });

        it('should return getLivePrice', () => {
            const getLivePrice = webApiUrls.getLivePrice('abc123');
            expect(getLivePrice).toBe(`${getWepApiUri()}/price?key=abc123&round=true&promo=false`);
        });

        it('should return geRequestedPrice', () => {
            const geRequestedPrice = webApiUrls.geRequestedPrice('abc123');
            expect(geRequestedPrice).toBe(`${getWepApiUri()}/requested-price?key=abc123&round=true`);
        });

        describe('destinationsByCodes', () => {
            it('should return destinationsByCodes without params', () => {
                const destinationsByCodes = webApiUrls.destinationsByCodes();
                expect(destinationsByCodes).toBe(`${getWepApiUri()}/destinations/search?`);
            });

            it('should return destinationsByCodes with params', () => {
                const destinationsByCodes = webApiUrls.destinationsByCodes(true);
                expect(destinationsByCodes).toBe(`${getWepApiUri()}/destinations/search?includeRelatedItems=true`);
            });
        });

        describe('excursionsForDestination', () => {
            it('should return excursionsForDestination with ONLY required params', () => {
                const excursionsForDestination = webApiUrls.excursionsForDestination('destination', 'code');
                expect(excursionsForDestination).toBe(
                    `${getWepApiUri()}/excursions?destinationCode=destination&marketCode=code`,
                );
            });

            it('should return excursionsForDestination with all params', () => {
                const excursionsForDestination = webApiUrls.excursionsForDestination(
                    'destinationCode',
                    'marketCode',
                    'startDate',
                    'endDate',
                );
                expect(excursionsForDestination).toBe(
                    `${getWepApiUri()}/excursions?destinationCode=destinationCode&startDate=startDate&endDate=endDate&marketCode=marketCode`,
                );
            });
        });

        it('should return userVoucherCode', () => {
            expect(webApiUrls.userVoucherCode('campaign-id')).toBe(
                `${getWepApiUri()}/voucher/single-use-promo-code?campaignId=campaign-id`,
            );
        });

        it('should return validateVoucherCode', () => {
            expect(webApiUrls.validateVoucherCode('code')).toBe(`${getWepApiUri()}/voucher/validate?voucherCode=code`);
        });

        it('should return redeemVoucher', () => {
            expect(webApiUrls.redeemVoucher('code')).toBe(`${getWepApiUri()}/voucher/redeem?voucherCode=code`);
        });

        it('should return getAmendAlternativeFlights', () => {
            const getAmendAlternativeFlights = webApiUrls.getAmendAlternativeFlights('20230805');
            expect(getAmendAlternativeFlights).toBe(
                `${getWepApiUri()}/amend/alternative-flights?bookingReference=20230805`,
            );
        });

        it('should return weather', () => {
            const weather = webApiUrls.weather('code');
            expect(weather).toBe(`${getWepApiUri()}/weather/region?code=code`);
        });
    });

    describe('userManagementApiUrls', () => {
        const spy = jest.spyOn(userManagementApiUrls, 'currentUser');

        it('should return required url to get current agent user info', () => {
            const url = userManagementApiUrls.currentUser();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/user-management-api/v1/users/current');
        });
    });

    describe('tradePortalWebApiUrls', () => {
        describe('session', () => {
            it('should return required url to login', () => {
                const spy = jest.spyOn(tradePortalWebApiUrls.session, 'login');
                const url = tradePortalWebApiUrls.session.login();

                expect(spy).toHaveBeenCalled();
                expect(url).toBe('http://test/api/v1.0/trade-portal/account/login');
            });

            it('should return required url to logout', () => {
                const spy = jest.spyOn(tradePortalWebApiUrls.session, 'logout');
                const url = tradePortalWebApiUrls.session.logout();

                expect(spy).toHaveBeenCalled();
                expect(url).toBe('http://test/api/v1.0/trade-portal/account/logout');
            });

            it('should return required url to status', () => {
                const spy = jest.spyOn(tradePortalWebApiUrls.session, 'status');
                const url = tradePortalWebApiUrls.session.status();

                expect(spy).toHaveBeenCalled();
                expect(url).toBe('http://test/api/v1.0/trade-portal/account/status');
            });
        });
    });

    describe('notificationsUrls', () => {
        it('should return required url to subscribe', () => {
            const spy = jest.spyOn(notificationsUrls, 'subscribe');
            const url = notificationsUrls.subscribe();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/notification/subscribe');
        });

        it('should return required url to unsubscribe', () => {
            const spy = jest.spyOn(notificationsUrls, 'unsubscribe');
            const url = notificationsUrls.unsubscribe();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/notification/unsubscribe');
        });

        it('should return required url to trackHotelData', () => {
            const spy = jest.spyOn(notificationsUrls, 'trackHotelData');
            const url = notificationsUrls.trackHotelData();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/cms-api/tracking/hotel-data');
        });

        it('should return required url to trackUserSearch', () => {
            const spy = jest.spyOn(notificationsUrls, 'trackUserSearch');
            const url = notificationsUrls.trackUserSearch();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/cms-api/tracking/user-search');
        });

        it('should return required url to triggerPatternCard', () => {
            const spy = jest.spyOn(notificationsUrls, 'triggerPatternCard');
            const url = notificationsUrls.triggerPatternCard();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/cms-api/HotelTheme/TriggerPatternCard');
        });
    });

    describe('shareUrls', () => {
        it('should return Facebook url', () => {
            const facebook = shareUrls.facebook(getWepApiUri());
            expect(facebook).toBe(
                `https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Ftest%2Fapi%2Fv1.0&display=page`,
            );
        });

        it('should return Twitter url', () => {
            const twitter = shareUrls.twitter('Test', getWepApiUri());
            expect(twitter).toBe(`https://twitter.com/share?url=http%3A%2F%2Ftest%2Fapi%2Fv1.0&title=Test`);
        });

        it('should return Email url', () => {
            const email = shareUrls.email('Test', getWepApiUri());
            expect(email).toBe(`mailto:?subject=Test&body=http%3A%2F%2Ftest%2Fapi%2Fv1.0`);
        });

        it('should return Sms url', () => {
            const sms = shareUrls.sms('body');
            expect(sms).toBe(`sms:?&body=body`);
        });

        it('should return WhatsApp url', () => {
            const whatsapp = shareUrls.whatsapp('body');
            expect(whatsapp).toBe(`https://wa.me/?text=body`);
        });

        it('should return hotukdeals url', () => {
            const hotukdeals = shareUrls.hotukdeals('title', getWepApiUri(), 50);
            expect(hotukdeals).toBe(
                `https://hotukdeals.com/social/share?title=title&url=http%3A%2F%2Ftest%2Fapi%2Fv1.0&style=vertical&v=2&price=50`,
            );
        });

        describe('searchAlternativeFlights', () => {
            const spy = jest.spyOn(webApiUrls, 'searchAlternativeFlights');

            it('should be called with NOT all params', () => {
                const url = webApiUrls.searchAlternativeFlights('sdate', 2, 'stay', 'dep', rooms, 'accommodationId');

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/alternative-flights?startDate=sdate&flexibleDays=2&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId',
                );
            });

            it('should be called with all params', () => {
                const url = webApiUrls.searchAlternativeFlights(
                    'sdate',
                    2,
                    'stay',
                    'dep',
                    rooms,
                    'accommodationId',
                    'boardType',
                    'outboundRouteId',
                    'inboundRouteId',
                    'transfer',
                    true,
                    'originalAirport',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/alternative-flights?startDate=sdate&flexibleDays=2&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId&boardType=boardType&outboundRouteId=outboundRouteId&inboundRouteId=inboundRouteId&transfer=transfer&withHotels=true&originalAirport=originalAirport',
                );
            });

            it('should include ecp in url when provided', () => {
                const url = webApiUrls.searchAlternativeFlights(
                    'sdate',
                    2,
                    'stay',
                    'dep',
                    rooms,
                    'accommodationId',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'fph',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/search/alternative-flights?startDate=sdate&flexibleDays=2&duration=stay&departure=dep' +
                        roomsString +
                        '&accommodationId=accommodationId&ecp=fph',
                );
            });
        });

        describe('amendDatesAvailability', () => {
            const spy = jest.spyOn(webApiUrls, 'amendDatesAvailability');

            it('should return required params', () => {
                const url = webApiUrls.amendDatesAvailability(
                    'accommodationId',
                    'departure',
                    'duration',
                    'endDate',
                    'startDate',
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/amend/amend-date/info?accommodationId=accommodationId&departure=departure&duration=duration&endDate=endDate&startDate=startDate',
                );
            });

            it('should return all params', () => {
                const url = webApiUrls.amendDatesAvailability(
                    'accommodationId',
                    'departure',
                    'duration',
                    'endDate',
                    'startDate',
                    rooms,
                );

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/amend/amend-date/info?accommodationId=accommodationId&departure=departure&duration=duration' +
                        '&endDate=endDate&startDate=startDate' +
                        roomsString,
                );
            });
        });

        describe('amendDatesBooking', () => {
            const buildRoomsParamsSpy = jest.spyOn(urlUtils, 'buildRoomsParams');

            it('should return correct url', () => {
                const spy = jest.spyOn(webApiUrls, 'amendDatesBooking');
                const rooms = [{ adults: 2, children: 2, infants: 1, roomCode: 'roomCode', childrenAges: [10, 9] }];

                const url = webApiUrls.amendDatesBooking({
                    accomId: 'accomId',
                    boardType: mockBoardType.code,
                    bookingRef: mockBooking.bookingReference,
                    duration: 13,
                    inboundDepTime: 'date1',
                    outboundDepTime: 'date2',
                    rooms,
                    selectedDate: '2023-10-12',
                    transferCode: mockTransfer.code,
                });

                expect(spy).toHaveBeenCalled();
                expect(buildRoomsParamsSpy).toHaveBeenCalledWith(rooms, true);
                expect(url).toBe(
                    'http://test/api/v1.0/amend/amend-dates/summary?accomId=accomId&boardType=HB&bookingRef=bookingReference&duration=13&inboundDepTime=date1&outboundDepTime=date2&room[0].adults=2&room[0].children=2&room[0].infants=1&room[0].roomCode=roomCode&selectedDate=2023-10-12&transferCode=TRANSFER_CODE&childAges=10%2C9',
                );
            });
        });

        describe('getQuizResult', () => {
            it('should return correct url', () => {
                const spy = jest.spyOn(webApiUrls, 'getQuizResult');

                const url = webApiUrls.getQuizResult();

                expect(spy).toHaveBeenCalled();
                expect(url).toBe('http://test/api/v1.0/holiday-inspiration/recommended');
            });
        });

        describe('validHolidayInspirationAnswers', () => {
            it('should return correct url', () => {
                const spy = jest.spyOn(webApiUrls, 'validHolidayInspirationAnswers');

                const url = webApiUrls.validHolidayInspirationAnswers({
                    departure: 'departure',
                    weather: 'weather',
                });

                expect(spy).toHaveBeenCalled();
                expect(url).toBe(
                    'http://test/api/v1.0/holiday-inspiration/validate-answers?departure=departure&weather=weather',
                );
            });
        });
    });

    describe('Apple Pay', () => {
        it('should return correct url for validateMerchant', () => {
            const spy = jest.spyOn(webApiUrls, 'validateMerchant');

            const url = webApiUrls.validateMerchant();

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/api/v1.0/payment/apple-pay/session');
        });
    });

    describe('hotelPointsOfInterest', () => {
        it('should return correct url for hotelPointsOfInterest', () => {
            const spy = jest.spyOn(webApiUrls, 'hotelPointsOfInterest');

            const url = webApiUrls.hotelPointsOfInterest({
                resortId: 'id',
                lon: 10,
                lat: 20,
                categories: 'cat1,cat2',
                airport: 'test',
                theme: 'B',
            });

            expect(spy).toHaveBeenCalledWith({
                resortId: 'id',
                lon: 10,
                lat: 20,
                categories: 'cat1,cat2',
                airport: 'test',
                theme: 'B',
            });

            expect(url).toBe(
                'http://test/api/v1.0/resort/getpois?resortId=id&lon=10&lat=20&categories=cat1%2Ccat2&airport=test&theme=B',
            );
        });
    });

    describe('getAvailableMonths', () => {
        it('should return correct url', () => {
            const spy = jest.spyOn(webApiUrls, 'getAvailableMonths');

            const url = webApiUrls.getAvailableMonths(7, 'LLL', 'TTT');

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/api/v1.0/availability/months?duration=7&from=LLL&to=TTT');
        });
    });

    describe('getCheapestMonths', () => {
        it('should return correct url', () => {
            const url = webApiUrls.getCheapestMonths('LGW', 'MAA');

            expect(url).toBe('http://test/api/v1.0/search/cheapest-month?airports=LGW&destinations=MAA');
        });
    });

    describe('assistedTravel', () => {
        it('should return correct url', () => {
            const spy = jest.spyOn(webApiUrls, 'assistedTravel');
            const url = webApiUrls.assistedTravel('112233');

            expect(spy).toHaveBeenCalled();
            expect(url).toBe('http://test/api/v1.0/booking/112233/assisted-travel');
        });
    });
});
