import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';

import RebookCard, { TRebookCardProps } from './RebookCard';

const createProps = (): TRebookCardProps => ({
    fields: {
        ActionText: { value: 'Rebook the same holiday in just a few clicks.' },
        CTAButtonLabel: { value: 'Rebook this holiday' },
        RebookButtonLabel: { value: 'Rebook this holiday' },
        Subtitle: { value: 'Loved your trip?' },
        Title: { value: 'Ready to go back?' },
    },
    rendering: {},
    params: {},
});

let props: TRebookCardProps;
let mockStores;

const mockTextComponent = jest.fn();
const mockHotelImageComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: (props: any) => {
        mockTextComponent(props);

        return <div data-tid={props['data-tid']}>{props.field.value}</div>;
    },
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...rest }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageComponent(props);

        return <img alt='hotel' />;
    },
}));

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: url => `https://media.example.com/${url}`,
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RebookCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                booking: {
                    ...mockBooking,
                    hotel: {
                        images: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
                    },
                },
            },
            layoutStore: {
                getSetting: jest.fn().mockReturnValue('fallback.jpg'),
            },
            routerStore: {
                hotelDetailsBrowseUrl: jest.fn().mockReturnValue('https://example.com/hotel/details'),
            },
            queryParamStore: {
                buildRebookHotelQuery: jest.fn().mockReturnValue('?rebook=true'),
            },
        });
    });

    it('should render the component with correct text and link', () => {
        render(<RebookCard {...props} />);

        expect(screen.getByTestId('rebook-container')).toBeInTheDocument();
        expect(screen.getByText('Ready to go back?')).toBeInTheDocument();
        expect(screen.getByText('Loved your trip?')).toBeInTheDocument();
        expect(screen.getByText('Rebook the same holiday in just a few clicks.')).toBeInTheDocument();
        expect(screen.getByText('Rebook this holiday')).toBeInTheDocument();

        expect(mockStores.routerStore.hotelDetailsBrowseUrl).toHaveBeenCalledWith(
            mockStores.viewBookingStore.booking.hotel,
            '?rebook=true',
        );
        expect(mockStores.queryParamStore.buildRebookHotelQuery).toHaveBeenCalledWith(
            mockStores.viewBookingStore.booking,
        );

        const rebookLink = screen.getByTestId('rebook-button');

        expect(rebookLink).toHaveAttribute('href', 'https://example.com/hotel/details');
    });

    describe('Image rendering', () => {
        it('should render 4 images when 4 or more are available', () => {
            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).toHaveBeenCalledTimes(4);
            expect(mockHotelImageComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ 'data-tid': 'rebook-image-0' }),
            );
            expect(mockHotelImageComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ 'data-tid': 'rebook-image-1' }),
            );
            expect(mockHotelImageComponent).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ 'data-tid': 'rebook-image-2' }),
            );
            expect(mockHotelImageComponent).toHaveBeenNthCalledWith(
                4,
                expect.objectContaining({ 'data-tid': 'rebook-image-3' }),
            );
        });

        it('should render 3 images when exactly 3 are available', () => {
            mockStores.viewBookingStore.booking.hotel.images = [{ id: '1' }, { id: '2' }, { id: '3' }];

            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).toHaveBeenCalledTimes(3);
        });

        it('should render 2 images when exactly 2 are available', () => {
            mockStores.viewBookingStore.booking.hotel.images = [{ id: '1' }, { id: '2' }];

            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).toHaveBeenCalledTimes(2);
        });

        it('should render 1 image when exactly 1 is available', () => {
            mockStores.viewBookingStore.booking.hotel.images = [{ id: '1' }];

            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).toHaveBeenCalledTimes(1);
        });

        it('should render 0 images when none are available', () => {
            mockStores.viewBookingStore.booking.hotel.images = [];

            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).not.toHaveBeenCalled();
        });

        it('should pass the correct fallback image URL to HotelImage components', () => {
            render(<RebookCard {...props} />);

            expect(mockHotelImageComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    fallbackImage: 'https://media.example.com/fallback.jpg',
                }),
            );
        });
    });

    it('should NOT render when fields are missing', () => {
        props.fields = undefined;

        const { container } = render(<RebookCard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when booking is missing', () => {
        mockStores.viewBookingStore.booking = null;

        const { container } = render(<RebookCard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
