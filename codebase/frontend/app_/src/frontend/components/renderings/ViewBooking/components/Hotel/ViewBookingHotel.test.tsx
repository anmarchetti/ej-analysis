import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockIntersectionObserver } from 'frontend/__mocks__';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { GenderType } from 'models/enum/GenderType';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ViewBookingHotel } from './ViewBookingHotel';

const createProps = () => ({
    booking: {
        guests: [
            { firstName: 'Guest-1', type: GuestType.Adult, sex: GenderType.Female },
            { firstName: 'Guest-2', type: GuestType.Adult },
            { firstName: 'Guest-3', type: GuestType.Child },
            { firstName: 'Guest-4', type: GuestType.Infant },
        ],
        promoCollections: [],
        package: {
            accom: {
                startDate: '2021-01-01',
                endDate: '2021-01-07',
                hotel: {
                    name: 'HotelName',
                    starRating: '3',
                    rating: 4,
                    numberOfReviews: 100,
                    images: [{ large: 'image' }],
                    facilities: [{ name: 'Facility' }],
                    fullHotelAddress: {
                        street: '123 Main Street',
                        postalCode: 'E1 6AN',
                    },
                },
                rooms: [
                    {
                        code: 'DB01',
                        board: 'HB',
                        boardType: { code: 'HB', title: 'Half Board', iconUrl: 'iconUrl' },
                    },
                ],
            },
        },
        hotel: {
            country: { code: 'ES', name: 'Spain' },
            location: { code: 'ESCB', name: 'Costa Blanca' },
            resort: { code: 'ESCBBE', name: 'Benidorm' },
            ecoFacility: { name: 'EcoFacility', tooltip: 'EcoFacilityTooltip' },
        },
    },
    fallbackImage: 'fallbackImage',
    isPrintPreview: false,
    rendering: {},
});

mockIntersectionObserver();

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/offer.utils', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/utils/offer.utils'),
    containsLuxuryPromoCode: jest.fn(),
}));

const mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockHotelRatingProps = jest.fn();
jest.mock('frontend/components/common/Hotel/HotelRating/HotelRating', () => ({
    __esModule: true,
    default: props => {
        mockHotelRatingProps(props);

        return <div data-tid='hotel-rating' />;
    },
}));

const mockFacilities = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelFacilities/components/Facilities', () => ({
    __esModule: true,
    default: props => {
        mockFacilities(props);

        return <div data-tid='view-booking-hotel-facilities' />;
    },
}));

const hotelGalleryTid = 'view-booking-hotel-gallery';
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotelGallery', () => ({
    __esModule: true,
    default: () => <div data-tid={hotelGalleryTid} />,
}));

const mockPassengers = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingPassengers', () => ({
    __esModule: true,
    default: props => {
        mockPassengers(props);

        return <div data-tid='view-booking-hotel-passengers' />;
    },
}));

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return (
            <div data-tid='placeholder'>
                {children}
                <button>onClose</button>
            </div>
        );
    },
}));

describe('<ViewBookingHotel />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                filterFacilitiesByDesignVariant: jest.fn(items => items),
                isTradePortal: false,
            },
            trackingStore: {
                trackEventWithParams: jest.fn(),
            },
            queryParamStore: {
                buildRedirectUrlQuery: jest.fn(),
            },
        });
    });

    it('Should render full hotel info', () => {
        render(<ViewBookingHotel {...props} />);

        expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesHolidaySummary)).toBeInTheDocument();
        expect(screen.getByText('HotelName')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-location-links')).toBeInTheDocument();
        expect(screen.getByTestId(hotelGalleryTid)).toBeInTheDocument();
        expect(mockFacilities).toHaveBeenCalledWith({
            facilityGroups: [{ name: 'Facility' }],
            isShowEcoFacilityPlaceholder: true,
            rendering: {},
            shouldShowTitle: true,
            titleDictionaryKey: SitecoreDictionary.BookingSummaryTitlesFacilitiesTitle,
            isPrintPreview: false,
        });
        expect(screen.getByTestId('guests-label')).toBeInTheDocument();
        expect(screen.getByTestId('dates-label')).toBeInTheDocument();
        expect(screen.getByTestId('board-label')).toBeInTheDocument();

        expect(screen.getByTestId('hotel-rating')).toBeInTheDocument();
        expect(mockHotelRatingProps).toHaveBeenCalledWith(
            expect.objectContaining({
                booking: props.booking,
            }),
        );
    });

    it('should render people block on trade portal', () => {
        mockStores.layoutStore.isTradePortal = true;
        render(<ViewBookingHotel {...props} />);

        expect(mockPassengers).toHaveBeenCalledWith({
            adultsCount: 2,
            adultsCountLabel: '2 Globals.Labels.Adults',
            childrenCount: 1,
            childrenCountLabel: '1 Globals.Labels.Child',
            infantsCount: 1,
            infantsCountLabel: '1 Globals.Labels.Infant',
            mainGuestSex: GenderType.Female,
        });
    });

    it('Should NOT render gallery if no images', () => {
        props.booking.package.accom.hotel.images = [];
        render(<ViewBookingHotel {...props} />);

        expect(screen.queryByTestId(hotelGalleryTid)).not.toBeInTheDocument();
    });

    it('Should NOT render board details', () => {
        props.booking.package.accom.rooms = [];
        render(<ViewBookingHotel {...props} />);

        expect(screen.queryByTestId('board-label')).not.toBeInTheDocument();
    });

    it('Should NOT render dates details', () => {
        props.booking.package.accom.startDate = null;
        render(<ViewBookingHotel {...props} />);

        expect(screen.queryByTestId('dates-label')).not.toBeInTheDocument();
    });

    describe('Address', () => {
        it('Should render address when street and postalCode are present', () => {
            render(<ViewBookingHotel {...props} />);

            expect(screen.getByTestId('address-label')).toHaveTextContent('123 Main Street, E1 6AN');
        });

        it('Should NOT render address when street is missing', () => {
            props.booking.package.accom.hotel.fullHotelAddress = { postalCode: 'E1 6AN' };
            render(<ViewBookingHotel {...props} />);

            expect(screen.queryByTestId('address-label')).not.toBeInTheDocument();
        });

        it('Should NOT render address when postalCode is missing', () => {
            props.booking.package.accom.hotel.fullHotelAddress = { street: '123 Main Street' };
            render(<ViewBookingHotel {...props} />);

            expect(screen.queryByTestId('address-label')).not.toBeInTheDocument();
        });

        it('Should NOT render address when fullHotelAddress is undefined', () => {
            props.booking.package.accom.hotel.fullHotelAddress = undefined;
            render(<ViewBookingHotel {...props} />);

            expect(screen.queryByTestId('address-label')).not.toBeInTheDocument();
        });
    });

    it('Should return singular label form if 1 guest', () => {
        props.booking.guests = [{ firstName: 'SingleGuest', type: GuestType.Adult }];
        render(<ViewBookingHotel {...props} />);

        expect(screen.getByText(SitecoreDictionary.BookingSummaryLabelsPersonTravelling)).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.BookingSummaryLabelsPeopleTravelling)).not.toBeInTheDocument();
    });

    it('Should return plural label form for guests', () => {
        props.booking.guests = [
            { firstName: 'Guest1', type: GuestType.Adult },
            { firstName: 'Guest2', type: GuestType.Adult },
        ];
        render(<ViewBookingHotel {...props} />);

        expect(screen.queryByText(SitecoreDictionary.BookingSummaryLabelsPersonTravelling)).not.toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.BookingSummaryLabelsPeopleTravelling)).toBeInTheDocument();
    });

    describe('isLuxuryPackage', () => {
        it('should render the luxury features column and placeholder when flag is TRUE', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

            const { container } = render(<ViewBookingHotel {...props} />);

            const wrapper = container.querySelector('.bookingDetailsHotel');

            expect(wrapper).toHaveClass('bookingDetailsHotelLuxury');
            expect(container.querySelector('.hotelCardFeatures')).toBeInTheDocument();
            expect(mockPlaceholderComponent).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'listed-items', isMultiColumn: true }),
            );

            const mainCard = container.querySelector('.view-booking-hotel__main');

            expect(mainCard).not.toHaveClass('hotelCardMainFullWidth');
        });

        it('should render the correct title text for luxury features', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

            render(<ViewBookingHotel {...props} />);

            const titleElement = screen.getByTestId('luxury-features-title-text');
            expect(titleElement).toBeInTheDocument();
            expect(titleElement).toHaveTextContent(SitecoreDictionary.LuxuryLabelsThisHolidayIncludesStandard);
        });

        it('should hide the luxury column and use full‑width layout when flag is FALSE', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

            const { container } = render(<ViewBookingHotel {...props} />);

            const wrapper = container.querySelector('.bookingDetailsHotel');

            expect(wrapper).not.toHaveClass('bookingDetailsHotelLuxury');
            expect(container.querySelector('.hotelCardFeatures')).not.toBeInTheDocument();
            expect(mockPlaceholderComponent).not.toHaveBeenCalledWith(
                expect.objectContaining({ name: 'listed-items' }),
            );

            const mainCard = container.querySelector('.view-booking-hotel__main');

            expect(mainCard).toHaveClass('hotelCardMainFullWidth');
        });

        it('should render the button and when luxury package is TRUE', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

            render(<ViewBookingHotel {...props} />);

            const navBtn = screen.getByRole('button', {
                name: SitecoreDictionary.LuxuryLabelsViewAllHolidayDetails,
            });

            expect(navBtn).toBeInTheDocument();
        });

        it('should NOT render the button when luxury package is FALSE', () => {
            (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

            render(<ViewBookingHotel {...props} />);

            expect(
                screen.queryByRole('button', {
                    name: SitecoreDictionary.LuxuryLabelsViewAllHolidayDetails,
                }),
            ).not.toBeInTheDocument();
        });
    });

    describe('isFlightAndHotelPackage', () => {
        it('should render BookingSummary title when isFlightAndHotelPackage is true on viewBookingStore', () => {
            mockStores.viewBookingStore = { ...mockStores.viewBookingStore, isFlightAndHotelPackage: true };
            render(<ViewBookingHotel {...props} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesBookingSummary)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesHolidaySummary)).not.toBeInTheDocument();
        });

        it('should render BookingSummary title when isFlightAndHotelPackage is true on bookingStore', () => {
            mockStores.viewBookingStore = { ...mockStores.viewBookingStore, isFlightAndHotelPackage: false };
            mockStores.bookingStore = { ...mockStores.bookingStore, isFlightAndHotelPackage: true };
            render(<ViewBookingHotel {...props} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesBookingSummary)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesHolidaySummary)).not.toBeInTheDocument();
        });

        it('should render HolidaySummary title when isFlightAndHotelPackage is false', () => {
            mockStores.viewBookingStore = { ...mockStores.viewBookingStore, isFlightAndHotelPackage: false };
            mockStores.bookingStore = { ...mockStores.bookingStore, isFlightAndHotelPackage: false };
            render(<ViewBookingHotel {...props} />);

            expect(screen.getByText(SitecoreDictionary.BookingSummaryTitlesHolidaySummary)).toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.BookingSummaryTitlesBookingSummary)).not.toBeInTheDocument();
        });
    });
});
