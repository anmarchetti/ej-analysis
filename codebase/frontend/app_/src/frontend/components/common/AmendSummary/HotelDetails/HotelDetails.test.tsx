import { render, screen } from '@testing-library/react';

import { mockBooking, mockHotel } from 'frontend/__mocks__';

import HotelDetails, { IHotelDropdownProps } from './HotelDetails';

const createMockProps = (): IHotelDropdownProps => ({
    fallbackHotelImage: 'fallbackHotelImage',
    linkLabel: 'linkLabel',
    hotel: mockHotel,
    isHotelDetailsLinkShown: true,
});

let mockProps;

const mockOfferCardSliderProps = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSliderProps(props);

        return <div data-tid='offer-card-slider'>OfferCardSlider</div>;
    },
}));

const mockRatingsDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails', () => ({
    __esModule: true,
    default: props => {
        mockRatingsDetailsProps(props);

        return <div data-tid='ratings-details' />;
    },
}));

const mockHotelPreviewLinkProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink', () => ({
    __esModule: true,
    default: props => {
        mockHotelPreviewLinkProps(props);

        return <div data-tid='hotel-preview-link'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/icons/ChevronRight', () => () => <div data-tid='chevron-right' />);

describe('<HotelDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render', () => {
        render(<HotelDetails {...mockProps} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(mockOfferCardSliderProps).toHaveBeenCalledWith({
            fallbackImage: 'fallbackHotelImage',
            images: mockBooking.hotel?.images,
            isFullScreenEnabled: true,
            showIndex: true,
        });
        expect(screen.getByText(mockHotel.name!)).toBeInTheDocument();
        expect(screen.getByTestId('ratings-details')).toBeInTheDocument();
        expect(mockRatingsDetailsProps).toHaveBeenCalledWith({ ...mockBooking.hotel, className: 'ratings' });
        expect(screen.getByTestId('hotel-preview-link')).toBeInTheDocument();
        expect(mockHotelPreviewLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hotel: mockHotel,
                className: 'link',
            }),
        );
        expect(screen.getByText(mockProps.linkLabel)).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should NOT render component if no hotel', () => {
        mockProps.hotel = null;
        const { container } = render(<HotelDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render hotel details link if isHotelDetailsLinkShown is false', () => {
        mockProps.isHotelDetailsLinkShown = false;
        render(<HotelDetails {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should NOT render hotel details link if linkLabel is not provided', () => {
        mockProps.linkLabel = undefined;
        render(<HotelDetails {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });
});
