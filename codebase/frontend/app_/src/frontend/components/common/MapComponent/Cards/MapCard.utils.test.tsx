import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { IHotel } from 'models/data/IHotel';
import { IOffer, IOfferWithHotelData } from 'models/data/IOffer';
import { IStop } from 'models/data/map/IItinerary';
import { IGeoPoint } from 'models/data/map/IMap';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import useMapCard, {
    addPriceToOptions,
    DEPOSIT_KEY,
    getButtonData,
    getContent,
    getOptions,
    PRICE_KEY,
    PRICE_PP_KEY,
    TOURIST_TAX_KEY,
} from './MapCard.utils';

import styles from './MapCard.module.scss';

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => (url ? `-/jssmedia/${url}` : '')),
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('MapCard.utils', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            queryParamStore: {
                buildHotelDetailsQuery: jest.fn().mockReturnValue('query=details'),
            },
            routerStore: {
                getMapCardLink: jest.fn().mockReturnValue('/spain/madrid/hotel?query=details'),
            },
            bookingStore: {
                onMapCardButtonClick: jest.fn(),
            },
            searchFiltersStore: {
                boardTypeFilters: 'AA',
            },
            hotelsStore: {
                fetchMapItem: jest.fn().mockResolvedValue({}),
            },
        });
    });

    describe('getOptions', () => {
        const getPhrase = jest.fn();
        const getFormattedNumber = jest.fn();
        const formatMoney = jest.fn();

        it('should return empty options when both offer and hotel are undefined', () => {
            const result = getOptions({
                offer: undefined,
                hotel: undefined,
                deposit: '',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: true,
            });

            expect(result).toEqual([]);
        });

        it('should include strapline in options when hotel has a strapline', () => {
            const result = getOptions({
                offer: undefined,
                hotel: { strapline: 'Luxury Hotel' } as IHotel,
                deposit: '',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: true,
            });

            expect(result).toEqual([{ content: 'Luxury Hotel', key: 0 }]);
        });

        it('should include closest facility distance when hotel has valid facility data', () => {
            const result = getOptions({
                offer: undefined,
                hotel: {
                    closestFacility: { distance: 5 },
                    theme: 'theme',
                } as unknown as IHotel,
                deposit: '',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: true,
            });

            expect(result).toHaveLength(1);
            expect(result[0].icon).toBeDefined();
        });

        it('should include room type when matching room code exists', () => {
            const result = getOptions({
                offer: { accom: { unit: [{ code: 'roomCode!' }] } } as IOfferWithHotelData,
                hotel: { roomTypes: [{ code: 'roomCode', title: 'Deluxe Room' }] } as IHotel,
                deposit: '',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: true,
            });

            expect(result).toEqual([{ content: 'Deluxe Room', icon: <SvgHotelBedFilled />, key: 2 }]);
        });

        it('should include key selling points when no room or board type exists', () => {
            const result = getOptions({
                offer: undefined,
                hotel: { ksp1: 'Free WiFi', ksp2: 'Ocean View' } as IHotel,
                deposit: '',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: true,
            });

            expect(result).toEqual([
                { content: 'Free WiFi', key: 4 },
                { content: 'Ocean View', key: 5 },
            ]);
        });

        it('should include price and deposit information when provided', () => {
            const result = getOptions({
                offer: {
                    price: 200,
                    pricePP: 100,
                    priceExcludingTouristTax: 200,
                    pricePPExcludingTouristTax: 100,
                    touristTaxPP: 4.01,
                    touristTax: 8.01,
                } as IOfferWithHotelData,
                hotel: {} as IHotel,
                deposit: '50',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: false,
            });

            expect(result).toHaveLength(4);
            expect(getPhrase).toHaveBeenCalled();
            expect(formatMoney).toHaveBeenCalled();
        });

        it('should NOT include price data when it is NOT provided', () => {
            const result = getOptions({
                offer: { pricePPExcludingTouristTax: 100, touristTaxPP: 4.01, touristTax: 8.01 } as IOfferWithHotelData,
                hotel: {} as IHotel,
                deposit: '50',
                getPhrase,
                getFormattedNumber,
                formatMoney,
                isPricePerPerson: false,
            });

            expect(result).toHaveLength(0);
        });
    });

    describe('addPriceToOptions', () => {
        it('should return options with deposit when deposit is provided', () => {
            const result = addPriceToOptions({
                deposit: '100',
                options: [],
                getPhrase: jest.fn().mockReturnValue('Deposit: CHF100'),
                formatMoney: jest.fn(),
                offer: { priceExcludingTouristTax: 200, pricePPExcludingTouristTax: 100 } as IOfferWithHotelData,
                isPricePerPerson: false,
            });

            expect(result).toContainEqual({
                content: 'Deposit: CHF100',
                contentClassName: styles.pill,
                key: DEPOSIT_KEY,
            });
        });

        it('should return options with price when price is provided', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn().mockReturnValue('£200'),
                offer: { priceExcludingTouristTax: 200 } as IOfferWithHotelData,
                isPricePerPerson: false,
            });

            expect(result).toContainEqual({
                content: '£200',
                itemClassName: styles.price,
                dataTid: 'map-card-price',
                key: PRICE_KEY,
            });
        });

        it('should return options with price per person when pricePP is provided and isPricePerPerson is true', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(k => k),
                formatMoney: jest.fn(),
                offer: { pricePPExcludingTouristTax: 100 } as IOfferWithHotelData,
                isPricePerPerson: true,
            });

            expect(result).toContainEqual({
                content: 'Globals.Labels.From Globals.PriceLabels.PerPerson',
                itemClassName: styles.pricePP,
                dataTid: 'map-card-price-pp',
                key: PRICE_PP_KEY,
            });
        });

        it('should return options with tourist tax when priceExcludingTouristTax is provided and isPricePerPerson is false', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn(),
                offer: {
                    ...mockedOffer,
                    priceExcludingTouristTax: 200,
                },
                isPricePerPerson: false,
            });

            expect(result).toContainEqual({
                content: expect.any(Object),
                itemClassName: styles.tax,
                dataTid: 'map-card-tourist-tax',
                key: TOURIST_TAX_KEY,
            });
        });

        it('should pass correct props to TouristTaxPriceLabel', () => {
            const offer = { ...mockedOffer, price: 300, pricePP: 150 };

            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn(),
                offer,
                isPricePerPerson: true,
            });

            expect(result).toContainEqual({
                content: expect.objectContaining({
                    props: expect.objectContaining({
                        touristTax: mockedOffer.touristTax,
                        taxesAndFees: mockedOffer.taxesAndFees,
                        children: expect.objectContaining({
                            props: expect.objectContaining({
                                isPricePP: true,
                                touristTax: mockedOffer.touristTax,
                                touristTaxPP: mockedOffer.touristTaxPP,
                                price: offer.price,
                                pricePP: offer.pricePP,
                            }),
                        }),
                    }),
                }),
                itemClassName: styles.tax,
                dataTid: 'map-card-tourist-tax',
                key: TOURIST_TAX_KEY,
            });
        });

        it('should NOT add deposit option when no deposit', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn(),
                offer: {} as IOfferWithHotelData,
                isPricePerPerson: false,
            });

            expect(result).not.toContainEqual(expect.objectContaining({ key: DEPOSIT_KEY }));
        });

        it('should NOT add prices when no priceExcludingTouristTax', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn(),
                offer: { priceExcludingTouristTax: 0 } as IOfferWithHotelData,
                isPricePerPerson: false,
            });

            expect(result).not.toContainEqual(expect.objectContaining({ key: PRICE_KEY }));
            expect(result).not.toContainEqual(expect.objectContaining({ key: PRICE_PP_KEY }));
        });

        it('should NOT add tourist tax option when no priceExcludingTouristTax', () => {
            const result = addPriceToOptions({
                deposit: undefined,
                options: [],
                getPhrase: jest.fn(),
                formatMoney: jest.fn(),
                offer: {} as IOfferWithHotelData,
                isPricePerPerson: false,
            });

            expect(result).not.toContainEqual(expect.objectContaining({ key: TOURIST_TAX_KEY }));
        });
    });

    describe('getContent', () => {
        it('should return empty content when both stop and hotel are undefined', () => {
            const result = getContent({
                stop: undefined,
                hotel: undefined,
                list: undefined,
                hidden: false,
                fallbackImage: 'fallback.jpg',
                getPhrase: jest.fn(),
            });

            expect(result).toEqual({});
        });

        it('should return stop content when stop is provided', () => {
            const result = getContent({
                stop: {
                    name: 'Stop Name',
                    description: 'Stop Description',
                    duration: '2',
                    subtitle: 'Duration...',
                    images: [{ medium: 'stop-image.jpg' }],
                } as IStop,
                hotel: undefined,
                list: undefined,
                hidden: false,
                fallbackImage: 'fallback.jpg',
                getPhrase: jest.fn(p => p),
            });

            expect(result).toEqual({
                name: 'Stop Name',
                description: 'Stop Description',
                duration: [
                    'Itineraries.Labels.DurationTooltipTextStart',
                    '2 Globals.Labels.Time.HoursPluralAbbr',
                    'Itineraries.Labels.DurationTooltipTextEnd',
                ],
                images: [{ medium: 'stop-image.jpg' }],
                fallbackImage: '-/jssmedia/fallback.jpg',
            });
        });

        it('should return hotel content when hotel is provided', () => {
            const result = getContent({
                stop: undefined,
                hotel: {
                    name: 'Hotel Name',
                    rating: 4.5,
                    numberOfReviews: 120,
                    starRating: '5',
                    images: [
                        {
                            medium: "example.com/133801_-_L'Elysee_Val_D'Europe/medium/133801_01.jpg",
                        },
                    ],
                } as IHotel,
                list: [{ content: 'Option 1', key: 1 }],
                hidden: true,
                fallbackImage: 'fallback.jpg',
                getPhrase: jest.fn(),
            });

            expect(result).toEqual({
                name: 'Hotel Name',
                rating: 4.5,
                numberOfReviews: 120,
                starRating: 5,
                list: [{ content: 'Option 1', key: 1 }],
                hidden: true,
                images: [{ medium: "example.com/133801_-_L'Elysee_Val_D'Europe/medium/133801_01.jpg" }],
                fallbackImage: '-/jssmedia/fallback.jpg',
            });
        });

        it('should return fallback for images when stop has no images', () => {
            const result = getContent({
                stop: {
                    name: 'Stop Name',
                    description: 'Stop Description',
                    duration: '2',
                    subtitle: 'Duration...',
                    images: undefined,
                } as unknown as IStop,
                hotel: undefined,
                list: undefined,
                hidden: false,
                fallbackImage: 'fallback.jpg',
                getPhrase: jest.fn(p => p),
            });

            expect(result).toEqual({
                name: 'Stop Name',
                description: 'Stop Description',
                duration: [
                    'Itineraries.Labels.DurationTooltipTextStart',
                    '2 Globals.Labels.Time.HoursPluralAbbr',
                    'Itineraries.Labels.DurationTooltipTextEnd',
                ],
                images: undefined,
                fallbackImage: '-/jssmedia/fallback.jpg',
            });
        });

        it('should handle empty fallbackImage parameter', () => {
            const result = getContent({
                stop: undefined,
                hotel: {
                    name: 'Hotel Name',
                    rating: 4.5,
                    numberOfReviews: 120,
                    starRating: '5',
                    images: [],
                } as unknown as IHotel,
                list: undefined,
                hidden: false,
                fallbackImage: '',
                getPhrase: jest.fn(),
            });

            expect(result.images).toEqual([]);
            expect(result.fallbackImage).toBe('');
        });
    });

    describe('useMapCard', () => {
        const setSelected = jest.fn();
        const hotel = { properties: { id: 'H123', price: 1000, pricePP: 500 } } as unknown as IGeoPoint;

        it('should fetch hotel-data when cache is empty', async () => {
            const cache = {
                has: jest.fn().mockReturnValue(false),
                set: jest.fn(),
            } as unknown as typeof Map.prototype;

            const { result } = renderHook(() => useMapCard({ hotel, setSelected, stop: undefined, cache }));

            expect(result.current.isLoading).toBe(true);

            expect(cache.has).toHaveBeenCalledWith('H123');

            jest.useFakeTimers();

            expect(mockStores.hotelsStore.fetchMapItem).toHaveBeenCalledWith('H123');

            jest.runAllTimers();

            await waitFor(() => expect(cache.set).toHaveBeenCalledWith('H123', {}));
        });

        it('should NOT fetch hotel-data when data is cached', () => {
            const cache = {
                has: jest.fn().mockReturnValue(true),
                get: jest.fn().mockReturnValue({}),
            } as unknown as typeof Map.prototype;

            const { result } = renderHook(() => useMapCard({ hotel, setSelected, stop: undefined, cache }));

            expect(cache.has).toHaveBeenCalledWith('H123');
            expect(cache.get).toHaveBeenCalledWith('H123');
            expect(result.current.isLoading).toBe(false);

            expect(mockStores.hotelsStore.fetchMapItem).not.toHaveBeenCalled();
        });

        it('should return correct link for destination page', async () => {
            const { result } = renderHook(() => useMapCard({ hotel, setSelected, stop: undefined, cache: new Map() }));

            expect(result.current.button!.link).toContain('hotel?query=details');
        });

        it('should call onMapCardButtonClick when clicked', async () => {
            const e = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                target: {
                    closest: jest.fn().mockReturnValue({
                        getAttribute: jest.fn().mockReturnValue('/spain/madrid/hotel?query=details'),
                    }),
                },
            };

            const cache = {
                has: jest.fn().mockReturnValue(true),
                get: jest.fn().mockReturnValue({}),
            } as unknown as typeof Map.prototype;

            const { result } = renderHook(() => useMapCard({ hotel, setSelected, stop: undefined, cache }));

            result.current.button!.onClick(e);

            expect(e.preventDefault).toHaveBeenCalled();
            expect(e.stopPropagation).toHaveBeenCalled();
            expect(mockStores.bookingStore.onMapCardButtonClick).toHaveBeenCalledWith({
                booking: false,
                url: '/spain/madrid/hotel?query=details',
                data: {},
            });
        });
    });

    describe('getButtonData', () => {
        it('should return undefined when ignore is true', () => {
            const result = getButtonData({
                ignore: true,
                getMapCardLink: jest.fn(),
                onClick: jest.fn(),
                data: {} as IOffer,
                booking: false,
                getPhrase: jest.fn(),
            });

            expect(result).toBeUndefined();
        });

        it('should return correct link and title for booking scenario', () => {
            const mockGetMapCardLink = jest.fn().mockReturnValue('/hotel/booking-link');
            const mockGetPhrase = jest.fn().mockReturnValue('Book Now');

            const result = getButtonData({
                ignore: false,
                getMapCardLink: mockGetMapCardLink,
                onClick: jest.fn(),
                data: {} as IOffer,
                booking: true,
                getPhrase: mockGetPhrase,
            });

            expect(result!.link).toBe('/hotel/booking-link');
            expect(result!.title).toBe('Book Now');
            expect(mockGetMapCardLink).toHaveBeenCalled();
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsBookNow);
        });

        it('should return correct link and title for non-booking scenario', () => {
            const mockGetMapCardLink = jest.fn().mockReturnValue('/hotel/view-link');
            const mockGetPhrase = jest.fn().mockReturnValue('View');

            const result = getButtonData({
                ignore: false,
                getMapCardLink: mockGetMapCardLink,
                onClick: jest.fn(),
                data: {} as IOffer,
                booking: false,
                getPhrase: mockGetPhrase,
            });

            expect(result!.link).toBe('/hotel/view-link');
            expect(result!.title).toBe('View');
            expect(mockGetMapCardLink).toHaveBeenCalled();
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsView);
        });

        it('should call onClick with correct parameters when button is clicked', () => {
            const mockOnClick = jest.fn();
            const mockEvent = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
            };

            const result = getButtonData({
                ignore: false,
                getMapCardLink: jest.fn().mockReturnValue('/hotel/link'),
                onClick: mockOnClick,
                data: {} as IOffer,
                booking: true,
                getPhrase: jest.fn(),
            });

            result!.onClick(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            expect(mockOnClick).toHaveBeenCalledWith({
                booking: true,
                url: '/hotel/link',
                data: {},
            });
        });
    });
});
