import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { buildGetDirectionsGoogleMapsUrl } from 'frontend/utils/map.utils';
import itinerarySummaryFieldsMocks from 'frontend/components/renderings/ItinerarySummary/__mocks__/itinerarySummaryFields';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import ItineraryHotel, { IItineraryHotelProps } from './ItineraryHotel';

const createProps = (): IItineraryHotelProps => {
    const {
        AddressLabel,
        DirectionsLabel,
        HotelDetailsLabel,
        RoomsLabelPlural,
        RoomsLabelSingular,
        HotelTitle,
        AppleMapsLabel,
        GoogleMapsLabel,
        MapsApplicationLabel,
        CloseDrawerLabel,
    } = itinerarySummaryFieldsMocks;

    return {
        booking: mockBooking,
        AddressLabel,
        DirectionsLabel,
        HotelDetailsLabel,
        RoomsLabelPlural,
        RoomsLabelSingular,
        AppleMapsLabel,
        GoogleMapsLabel,
        MapsApplicationLabel,
        CloseDrawerLabel,
        HotelTitle,
        isExpanded: false,
        setExpanded: jest.fn(),
    };
};

jest.mock('frontend/utils/clipboard.utils');
jest.mock('frontend/utils/HolidaySummaryRoom.utils', () => ({
    getRoomsMeta: jest.fn(() => [
        {
            rooms: [{ title: 'Test room 1', roomNumber: '1', room: { code: 'a' } }],
        },
    ]),
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    getHotelAddress: jest.fn(() => 'hotelAddress'),
    getHotelCoordinates: jest.fn(() => 'coords'),
    buildHotelDetailsUrl: jest.fn(),
}));

jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils', () => ({
    getHotelMeta: jest.fn(() => ({
        accom: { rooms: mockBooking.package.accom.rooms },
    })),
}));

jest.mock('frontend/utils/map.utils', () => ({
    buildGetDirectionsGoogleMapsUrl: jest.fn(),
    buildGetDirectionsAppleMapsUrl: jest.fn(),
}));

let props: IItineraryHotelProps;
let mockStores;
let mockIsMobileViewport = false;

const mockItineraryItemComponent = jest.fn();
const mockTripadvisorInfoComponent = jest.fn();
const mockStarRatingComponent = jest.fn();
const mockItineraryItemSubtitleComponent = jest.fn();
const mockGetDirectionsPopup = jest.fn();

jest.mock('frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem', () => ({
    __esModule: true,
    default: props => {
        mockItineraryItemComponent(props);

        return (
            <div data-tid='itinerary-item'>
                {props.icon}
                {props.children}
            </div>
        );
    },
}));

jest.mock('frontend/components/renderings/ItinerarySummary/components/GetDirectionsPopup/GetDirectionsPopup', () => ({
    __esModule: true,
    default: props => {
        mockGetDirectionsPopup(props);

        return <div data-tid='get-directions-popup' />;
    },
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: props => {
        mockTripadvisorInfoComponent(props);

        return <div data-tid='tripadvisor-info' />;
    },
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingComponent(props);

        return <div data-tid='star-rating' />;
    },
}));

jest.mock(
    'frontend/components/renderings/ItinerarySummary/components/ItineraryItemSubtitle/ItineraryItemSubtitle',
    () => ({
        __esModule: true,
        default: props => {
            mockItineraryItemSubtitleComponent(props);

            return <div data-tid='itinerary-item-subtitle' />;
        },
    }),
);

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ItineraryHotel />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: { basePath: '' },
            viewBookingStore: {
                isLuxuryPackage: false,
                isFlightAndHotelPackage: false,
            },
        });

        props.booking.package.accom.rooms[0].roomType.title = 'Test Title';
        window.open = jest.fn();
    });

    it('should not render full content when component is collapsed', () => {
        render(<ItineraryHotel {...props} />);

        expect(screen.queryByTestId('itinerary-hotel-extended')).not.toBeInTheDocument();
        expect(mockItineraryItemSubtitleComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                showContent: true,
            }),
        );
    });

    it('should pass setExpanded prop to ItineraryItem', () => {
        render(<ItineraryHotel {...props} />);

        expect(mockItineraryItemComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
                setExpanded: props.setExpanded,
            }),
        );
    });

    it('should NOT render hotel details link when it is a flight and hotel package', () => {
        mockStores.viewBookingStore.isFlightAndHotelPackage = true;

        render(<ItineraryHotel {...props} />);

        expect(screen.queryByTestId('itinerary-summary-hotel-view-link')).not.toBeInTheDocument();
    });

    describe('expanded mode', () => {
        beforeEach(() => {
            props.isExpanded = true;
        });

        it('should render expanded content', () => {
            render(<ItineraryHotel {...props} />);

            expect(screen.getByTestId('itinerary-hotel-trip-advisor')).toBeInTheDocument();

            const rooms = screen.getAllByTestId('itinerary-summary-room');

            expect(screen.getByTestId('itinerary-hotel-extended')).toBeInTheDocument();
            expect(mockItineraryItemSubtitleComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    subtitle: expect.objectContaining({ value: expect.any(String) }),
                    content: 'hotelAddress',
                    showContent: false, // collapsed when expanded
                    className: expect.any(String),
                    contentClassName: expect.any(String),
                    subtitleClassName: expect.any(String),
                }),
            );

            expect(screen.getByRole('heading', { level: 6, name: props.RoomsLabelSingular.value })).toBeInTheDocument();
            expect(rooms).toHaveLength(1);
            expect(rooms[0]).toHaveTextContent('1: Test room 1');
        });

        it('should show hotel name in subtitle even for lux holidays', () => {
            mockStores.viewBookingStore.isLuxuryPackage = true;
            props.isExpanded = true;
            render(<ItineraryHotel {...props} />);

            expect(mockItineraryItemSubtitleComponent).toHaveBeenCalled();
            expect(screen.queryByTestId('itinerary-hotel-extended')).toHaveClass('content withoutMarginTop');
        });

        it('should display correctly multi room content', () => {
            (getRoomsMeta as jest.Mock).mockReturnValueOnce([
                {
                    rooms: [
                        { title: 'Test room 1', roomNumber: '1', room: { code: 'a' } },
                        { title: 'Test room 2', roomNumber: '2', room: { code: 'b' } },
                    ],
                },
            ]);

            render(<ItineraryHotel {...props} />);

            const [room1, room2] = screen.queryAllByTestId('itinerary-summary-room');

            expect(screen.getByRole('heading', { level: 6, name: props.RoomsLabelPlural.value })).toBeInTheDocument();
            expect(room1).toHaveTextContent('1: Test room 1');
            expect(room2).toHaveTextContent('2: Test room 2');
        });

        it('should NOT display rooms when getRoomsMeta does not return rooms', () => {
            (getRoomsMeta as jest.Mock).mockReturnValueOnce([{}]);

            render(<ItineraryHotel {...props} />);

            expect(
                screen.queryByRole('heading', { level: 6, name: props.RoomsLabelSingular.value }),
            ).not.toBeInTheDocument();
            expect(screen.queryAllByTestId('itinerary-summary-room')).toHaveLength(0);
        });

        it('should render tripadvisor info and rating of the hotel', () => {
            (getHotelMeta as jest.Mock).mockReturnValueOnce({
                starRating: 4,
                taRating: 3,
                numberOfReviews: 10,
                accom: { rooms: [] },
            });

            render(<ItineraryHotel {...props} />);

            expect(mockStarRatingComponent).toHaveBeenCalledWith({ rating: 4 });
            expect(mockTripadvisorInfoComponent).toHaveBeenCalledWith({ rating: 3, reviews: 10 });
        });

        it('should NOT render tripadvisor info if no tripadvisor rating and reviews', () => {
            (getHotelMeta as jest.Mock).mockReturnValueOnce({
                taRating: null,
                numberOfReviews: null,
                accom: { rooms: [] },
            });

            render(<ItineraryHotel {...props} />);

            expect(mockTripadvisorInfoComponent).not.toHaveBeenCalled();
        });

        it('should have correct hotel details link', () => {
            const linkMock = '/hotel-details-link';

            (buildHotelDetailsUrl as jest.Mock).mockReturnValue(linkMock);

            render(<ItineraryHotel {...props} />);

            expect(screen.getByTestId('itinerary-summary-hotel-view-link')).toHaveAttribute('href', linkMock);
        });

        it('should have correct get directions maps link on desktop', async () => {
            const mockedResult = 'get-directions-link';

            (buildGetDirectionsGoogleMapsUrl as jest.Mock).mockReturnValue(mockedResult);

            render(<ItineraryHotel {...props} />);

            await userEvent.click(screen.getByRole('button', { name: props.DirectionsLabel.value }));

            expect(window.open).toHaveBeenCalledWith(mockedResult);
        });

        it('should copy hotel address to clipboard on click', async () => {
            render(<ItineraryHotel {...props} />);

            await userEvent.click(screen.getByTestId('itinerary-summary-copy-to-clipboard-btn'));
            expect(copyToClipboard).toHaveBeenCalledWith('hotelAddress');
        });
    });

    describe('<GetDirectionsPopup />', () => {
        beforeEach(() => {
            mockIsMobileViewport = true;
            props.isExpanded = true;
        });

        it('should open drawer popup on mobile on clicking get directions cta and pass correct props', async () => {
            render(<ItineraryHotel {...props} />);
            expect(screen.queryByTestId('get-directions-popup')).not.toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: props.DirectionsLabel.value }));

            expect(screen.queryByTestId('get-directions-popup')).toBeInTheDocument();

            expect(mockGetDirectionsPopup).toHaveBeenCalledWith({
                directionsLabel: props.DirectionsLabel,
                mapsApplicationLabel: props.MapsApplicationLabel,
                onClose: expect.any(Function),
                closeDrawerLabel: props.CloseDrawerLabel,
                appleMapsLabel: props.AppleMapsLabel,
                googleMapsLabel: props.GoogleMapsLabel,
                coordinates: 'coords',
            });
        });
    });
});
