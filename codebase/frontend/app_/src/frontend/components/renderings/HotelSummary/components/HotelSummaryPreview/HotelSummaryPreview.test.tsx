import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HotelSummaryPreview, { THotelSummaryPreviewProps } from './HotelSummaryPreview';

expect.extend(toHaveNoViolations);

const createProps = (): THotelSummaryPreviewProps => ({
    title: mockSitecoreField('Title'),
    viewSummaryLabel: 'View summary',
    toggleShowDetails: jest.fn(),
    shouldShowBtn: true,
});

const mockOfferCardSliderComponent = jest.fn();
const mockStarRatingComponent = jest.fn();
const mockShowMoreButtonComponent = jest.fn();

let props;
let mockStores;

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => url),
    },
}));

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSliderComponent(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingComponent(props);

        return <div data-tid='star-rating' />;
    },
}));

jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButtonComponent(props);

        return <button onClick={() => props.onClick()}>{props.title}</button>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelSummaryPreview />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('should render hotel summary preview card', () => {
        const mockedBooking = mockStores.viewBookingStore.booking;

        render(<HotelSummaryPreview {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(props.title.value);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(mockedBooking.hotel.name);
        expect(mockStarRatingComponent).toHaveBeenCalledWith({ rating: 4 });

        expect(mockOfferCardSliderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isFullScreenEnabled: true,
                showIndex: true,
                fallbackImage: 'HotelFallbackImage',
                images: mockedBooking.hotel.images,
            }),
        );

        expect(screen.getByTestId('hotel-summary-card')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: props.viewSummaryLabel })).toBeInTheDocument();
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({ title: props.viewSummaryLabel }),
        );
    });

    it('should not render ShowMoreButton when shouldShowBtn is false', () => {
        props.shouldShowBtn = false;

        render(<HotelSummaryPreview {...props} />);

        expect(screen.queryByRole('button', { name: props.viewSummaryLabel })).not.toBeInTheDocument();
        expect(mockShowMoreButtonComponent).not.toHaveBeenCalled();
    });

    it('should display hotel images from accom hotel field when booking hotel images are not defined', () => {
        mockStores.viewBookingStore.booking.hotel.images = undefined;

        render(<HotelSummaryPreview {...props} />);

        expect(mockOfferCardSliderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                images: mockStores.viewBookingStore.booking.package.accom.hotel.images,
            }),
        );
    });

    describe('Hotel rating rendering', () => {
        it('should display decimal rating value', () => {
            mockStores.viewBookingStore.booking.hotel.starRating = '1.4';

            render(<HotelSummaryPreview {...props} />);

            expect(mockStarRatingComponent).toHaveBeenCalledWith({ rating: 1 });
        });

        it('should not display rating when the hotel star rating in zero', () => {
            mockStores.viewBookingStore.booking.hotel.starRating = 0;

            render(<HotelSummaryPreview {...props} />);

            expect(mockStarRatingComponent).not.toHaveBeenCalled();
        });

        it('should not display rating when the hotel star rating in not defined', () => {
            mockStores.viewBookingStore.booking.hotel.starRating = undefined;

            render(<HotelSummaryPreview {...props} />);

            expect(mockStarRatingComponent).not.toHaveBeenCalled();
        });
    });

    it('should call toggleShowDetails on click show more details CTA', async () => {
        render(<HotelSummaryPreview {...props} />);

        await userEvent.click(screen.getByRole('button', { name: props.viewSummaryLabel }));

        expect(props.toggleShowDetails).toHaveBeenCalledWith(true);
    });

    it('should not render the hotel name when it is empty', () => {
        mockStores.viewBookingStore.booking.hotel.name = '';

        render(<HotelSummaryPreview {...props} />);

        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('should not render a card title without a Sitecore value', () => {
        props.title = '';

        render(<HotelSummaryPreview {...props} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should not render a view summary button without a Sitecore CTA label value', () => {
        props.viewSummaryLabel = '';

        render(<HotelSummaryPreview {...props} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render the component when booking is not defined', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<HotelSummaryPreview {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HotelSummaryPreview {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
