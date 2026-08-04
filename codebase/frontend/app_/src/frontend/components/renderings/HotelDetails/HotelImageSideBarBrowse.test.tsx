import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockTouristTax, mockTouristTaxErrorFields } from 'frontend/__mocks__/touristTax';
import { isHolidayStore } from 'frontend/store/holidays';
import * as utils from 'frontend/utils/livePrice.utils';
import { ILivePrice } from 'models/data/ILivePrice';

import HotelImageSideBarBrowseInjected, {
    HotelImageSideBarBrowse,
    IHotelImageSideBarBrowseProps,
} from './HotelImageSideBarBrowse';

const mockHotelImageCarouselSidebarComponent = jest.fn();

jest.mock('./components/HotelImageCarouselSidebar/HotelImageCarouselSidebar', () => ({ offer, duration }) => {
    mockHotelImageCarouselSidebarComponent(offer, duration);

    return <div data-tid='hotel-image-carousel-sidebar' />;
});

jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => true),
}));

const createProps = (): IHotelImageSideBarBrowseProps =>
    ({
        fields: {
            Name: { value: 'Name' },
            StarRating: { value: 4 },
            GiataCode: { value: '42124' },
            Code: { value: 'ES' },
            ClosestFacility: {
                fields: {
                    FacilityType: { value: 'FacilityType' },
                    Distance: { value: 100 },
                },
            },
            EcoFacility: {
                Name: 'Eco-certified',
                Tooltip: 'Holidays that are "Eco-certified" include hotels that meet our sustainability guidelines.',
            },
            StrapLine: { value: 'StrapLine' },
            KeySellingPoint1: { value: 'KeySellingPoint1' },
            KeySellingPoint2: { value: 'KeySellingPoint2' },
            HotelRating: { value: 4 },
            TotalNumberOfReviews: { value: 400 },
            GreatDeal: { value: false },
        },
        params: {
            reviewsAnchor: '',
        },
        isLoggedIn: false,
        layout: {
            sitecore: {
                context: {
                    accommodationCodes: ['accommodationCode'],
                },
            },
        },
        isEditMode: false,
        isTradePortal: false,
        rooms: [],
        getHotelShortlistId: jest.fn(),
        getSetting: jest.fn(p => p),
        prices: [],
    } as any);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps: IHotelImageSideBarBrowseProps;

describe('<HotelImageSideBarBrowse />', () => {
    beforeEach(() => {
        mockProps = createProps();

        mockStores = createMockStores({
            userStore: {
                isLoggedIn: false,
            },
            layoutStore: {
                layout: {
                    sitecore: {
                        context: {},
                    },
                },
                isEditMode: false,
                isTradePortal: false,
                getSetting: jest.fn(p => p),
            },
            shortlistStore: {
                getHotelShortlistId: jest.fn(),
            },
        });
    });

    it('Should standart render', () => {
        render(<HotelImageSideBarBrowse {...mockProps} />);

        expect(screen.getByTestId('hotel-image-carousel-sidebar')).toBeInTheDocument();
    });

    it('Should empty render', () => {
        render(<HotelImageSideBarBrowse {...mockProps} fields={undefined} />);

        expect(screen.queryByTestId('hotel-image-carousel-sidebar')).not.toBeInTheDocument();
    });

    describe('getHotelShortlistId', () => {
        it('should return undefined when user is logged out and number of nights label is disabled', async () => {
            mockProps.getSetting = jest.fn(() => '');
            render(<HotelImageSideBarBrowse {...mockProps} />);

            await waitFor(() =>
                expect(mockHotelImageCarouselSidebarComponent).toHaveBeenCalledWith(
                    {
                        accom: { code: 'accommodationCode' },
                        extraLuggageInfo: undefined,
                        hotel: { code: 'ES', giataCode: '42124', name: 'Name', theme: null, type: null },
                        price: 0,
                        pricePP: 0,
                        priceExcludingTouristTax: 0,
                        pricePPExcludingTouristTax: 0,
                        shortlist: { id: undefined, type: 'hotel' },
                        touristTax: -1,
                        taxesAndFees: undefined,
                        touristTaxPP: -1,
                        transfers: undefined,
                    },
                    undefined,
                ),
            );
        });

        it('should return specific data where user is logged in and number of nights label is enabled', () => {
            jest.spyOn(utils, 'getDestinationLivePriceByCode').mockReturnValueOnce({
                searchCriteria: { duration: 7 },
            } as ILivePrice);
            const mockShortListId = 'test';
            mockStores.userStore.isLoggedIn = true;
            mockStores.shortlistStore.getHotelShortlistId.mockReturnValueOnce(mockShortListId);

            render(<HotelImageSideBarBrowseInjected {...mockProps} />);

            waitFor(() => expect(mockHotelImageCarouselSidebarComponent).toHaveBeenCalledWith(mockShortListId, 7));
        });

        it('should NOT be called when store is not Holidays', async () => {
            jest.mocked(isHolidayStore).mockReturnValueOnce(false);
            mockStores.userStore.isLoggedIn = true;

            render(<HotelImageSideBarBrowseInjected {...mockProps} />);

            expect(mockStores.shortlistStore.getHotelShortlistId).not.toHaveBeenCalled();
        });

        it('should NOT be called when a user is not logged in initially', async () => {
            render(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockProps.getHotelShortlistId).not.toHaveBeenCalled();
        });

        it('should NOT be called when a user logs out', () => {
            mockProps.isLoggedIn = true;

            const { rerender } = render(<HotelImageSideBarBrowse {...mockProps} />);

            mockProps.isLoggedIn = false;

            rerender(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockProps.getHotelShortlistId).toHaveBeenNthCalledWith(1, mockProps.fields!.GiataCode.value);
        });

        it('should be called with giataCode when a user logs in and hotel code is provided', () => {
            const { rerender } = render(<HotelImageSideBarBrowse {...mockProps} />);

            mockProps.isLoggedIn = true;

            rerender(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockProps.getHotelShortlistId).toHaveBeenNthCalledWith(1, mockProps.fields!.GiataCode.value);
        });

        it('should NOT be called when isEditMode is true', () => {
            mockProps.isLoggedIn = true;
            mockProps.isEditMode = true;

            const { rerender } = render(<HotelImageSideBarBrowse {...mockProps} />);

            rerender(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockProps.getHotelShortlistId).not.toHaveBeenCalled();
        });

        it('should NOT be called when hotelGiataCode is empty string', () => {
            mockProps.isLoggedIn = true;
            mockProps.fields!.GiataCode.value = '';

            const { rerender } = render(<HotelImageSideBarBrowse {...mockProps} />);

            rerender(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockProps.getHotelShortlistId).not.toHaveBeenCalled();
        });
    });

    describe('touristTax', () => {
        it('should pass valid tourist tax local values to HotelImageCarouselSidebar when livePrice is provided', () => {
            jest.spyOn(utils, 'getDestinationLivePriceByCode').mockReturnValueOnce({
                ...mockTouristTax,
                price: 300,
                pricePP: 150,
                searchCriteria: { duration: 5 },
            } as ILivePrice);

            render(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockHotelImageCarouselSidebarComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 300,
                    pricePP: 150,
                    priceExcludingTouristTax: mockTouristTax.priceExcludingTouristTax,
                    pricePPExcludingTouristTax: mockTouristTax.pricePPExcludingTouristTax,
                    touristTax: mockTouristTax.touristTax,
                    touristTaxPP: mockTouristTax.touristTaxPP,
                    taxesAndFees: mockTouristTax.taxesAndFees,
                }),
                5,
            );
        });

        it('should pass invalid tourist tax local values to HotelImageCarouselSidebar when livePrice is undefined', () => {
            render(<HotelImageSideBarBrowse {...mockProps} />);

            expect(mockHotelImageCarouselSidebarComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 0,
                    pricePP: 0,
                    priceExcludingTouristTax: 0,
                    pricePPExcludingTouristTax: 0,
                    ...mockTouristTaxErrorFields,
                }),
                undefined,
            );
        });
    });
});
