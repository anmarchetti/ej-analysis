import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockAmendDatesStore, mockBooking } from 'frontend/__mocks__';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';

import AmendDatesSummaryHotel from './AmendDatesSummaryHotel';

const createProps = () => ({
    fallbackHotelImage: 'fallbackHotelImage',
    linkLabel: 'linkLabel',
    className: 'additionalClassName',
});

let mockProps;
let mockStores;

const mockOfferCardSlider = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSlider(props);

        return <div data-tid='offer-card-slider'>OfferCardSlider</div>;
    },
}));

const mockNextLink = jest.fn(({ children }) => <>{children}</>);

jest.mock('next/link', () => ({
    __esModule: true,
    default: (props: any) => mockNextLink(props),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('AmendDatesSummaryHotel', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: mockAmendDatesStore,
            layoutStore: { basePath: '/en/holidays' },
        });
        mockProps = createProps();
    });

    it('should render', () => {
        const { container } = render(<AmendDatesSummaryHotel {...mockProps} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(mockOfferCardSlider).toHaveBeenCalledWith({
            fallbackImage: 'fallbackHotelImage',
            images: mockBooking.hotel?.images,
            isFullScreenEnabled: true,
            showIndex: true,
        });
        expect(screen.getByText(mockBooking.package.accom.hotel.name!)).toBeInTheDocument();
        expect(screen.getByText('linkLabel')).toBeInTheDocument();
        expect(mockNextLink).toHaveBeenCalledWith(
            expect.objectContaining({
                children: expect.arrayContaining([expect.any(Object), expect.any(Object)]),
                href: `/en/holidays${buildHotelDetailsUrl(mockBooking.hotel)}`,
                'data-tid': 'amend-dates-summary-hotel-view-link',
                target: '_blank',
                className: expect.any(String),
            }),
        );
        expect(screen.getByTestId('amend-dates-summary-hotel')).toHaveClass('hotel additionalClassName summary-hotel');
        expect(container.querySelector('.summary-hotel')).toHaveAttribute(
            'class',
            'hotel additionalClassName summary-hotel',
        );
    });

    it('should render null if no booking', () => {
        mockStores.amendDatesStore = { ...mockAmendDatesStore, booking: undefined };
        const { container } = render(<AmendDatesSummaryHotel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render hotel link if no hotelPath', () => {
        mockStores.amendDatesStore.booking.hotel = undefined;
        const { container } = render(<AmendDatesSummaryHotel {...mockProps} />);

        expect(screen.queryByText('linkLabel')).not.toBeInTheDocument();
        expect(container.querySelector('.link')).not.toBeInTheDocument();
    });
});
