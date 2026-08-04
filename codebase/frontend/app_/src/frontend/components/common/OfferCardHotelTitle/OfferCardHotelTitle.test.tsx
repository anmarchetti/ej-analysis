import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockedOffer } from 'frontend/__mocks__/offer';
import Link from 'frontend/components/common/Link';

import OfferCardHotelTitle, { IOfferCardHotelTitleProps } from './OfferCardHotelTitle';

let mockIsHolidayStore = true;
jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => mockIsHolidayStore),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Link', () => jest.fn(({ children, ...props }) => <a {...props}>{children}</a>));

jest.mock('frontend/components/common/Button', () => ({ children, onClick }) => (
    <button data-tid='button' onClick={onClick}>
        {children}
    </button>
));

const createMockProps = (): IOfferCardHotelTitleProps => ({
    hotelLink: '',
    hotelLinkWithPrice: '',
    offer: mockedOffer,
    onClick: jest.fn(),
});

let mockStores;
let mockProps;

describe('OfferCardHotelTitle', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = {
            layoutStore: {
                isShortlistPage: true,
            },
            shortlistStore: {
                isOfferFromAnotherMarket: () => false,
            },
        };
    });

    it('should render button on shortlist page when offer is from another market', async () => {
        mockStores.shortlistStore.isOfferFromAnotherMarket = () => true;
        render(<OfferCardHotelTitle {...mockProps} />);

        const button = screen.getByTestId('button');
        expect(button).toHaveTextContent(mockProps.offer.hotel.name);

        await userEvent.click(button);

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render Link on shortlist page when offer is from the current market', async () => {
        render(<OfferCardHotelTitle {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                href: mockProps.hotelLinkWithPrice,
            }),
            expect.anything(),
        );

        expect(screen.getByText(mockProps.offer.hotel.name)).toBeInTheDocument();
        await userEvent.click(screen.getByText(mockProps.offer.hotel.name));
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render Link on other pages when not on shortlist', async () => {
        mockStores.layoutStore.isShortlistPage = false;
        render(<OfferCardHotelTitle {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                href: mockProps.hotelLinkWithPrice,
            }),
            expect.anything(),
        );

        expect(screen.getByText(mockProps.offer.hotel.name)).toBeInTheDocument();
    });

    it('should render Link on trade portal', async () => {
        mockIsHolidayStore = false;
        render(<OfferCardHotelTitle {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                href: mockProps.hotelLinkWithPrice,
            }),
            expect.anything(),
        );

        expect(screen.getByText(mockProps.offer.hotel.name)).toBeInTheDocument();
    });

    it('should pass hotelLinkWithPrice as the "as" prop to Link when provided', () => {
        mockProps.hotelLink = 'linkTest';
        mockProps.hotelLinkWithPrice = 'asLinkTest';

        render(<OfferCardHotelTitle {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                href: mockProps.hotelLinkWithPrice,
                as: mockProps.hotelLink,
            }),
            expect.anything(),
        );
    });
});
