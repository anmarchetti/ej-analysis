import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import * as offerUtils from 'frontend/utils/offer.utils';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import { HolidayCard } from './HolidayCard';

jest.mock('frontend/hooks/useLuggageTextFromOfferAndFields', () => ({
    useLuggageTextFromOfferAndFields: jest.fn().mockReturnValue('luggage text'),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHolidayCardImage = jest.fn();
jest.mock('./HolidayCardImage/HolidayCardImage', () => ({ ...props }) => {
    mockHolidayCardImage(props);

    return <div data-tid='holiday-card-image' />;
});

const mockHolidayCardHeader = jest.fn();
jest.mock('./HolidayCardHeader/HolidayCardHeader', () => ({ ...props }) => {
    mockHolidayCardHeader(props);

    return <div data-tid='holiday-card-header' />;
});

const mockHolidayCardBody = jest.fn();
jest.mock('./HolidayCardBody/HolidayCardBody', () => ({ ...props }) => {
    mockHolidayCardBody(props);

    return <div data-tid='holiday-card-body' />;
});

const createProps = () => ({
    fallbackImage: 'fallback-img',
    offer: { ...mockIframeOffer },
    shouldShowPrice: true,
});

const createStores = () =>
    createMockStores({
        searchStore: { destinationsDisplayValue: { main: 'Spain' } },
        queryParamStore: { buildHotelQueryPromotingIframe: jest.fn() },
    });

let mockProps;
let mockStores;

const mockContainsLuxuryPromoCode = jest.spyOn(offerUtils, 'containsLuxuryPromoCode');

describe('<HolidayCard />', () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockContainsLuxuryPromoCode.mockReturnValue(false);
    });

    it('should render HolidayCard component', () => {
        render(<HolidayCard {...mockProps} />);

        expect(screen.getByTestId('holiday-card-image')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-card-header')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-card-body')).toBeInTheDocument();
    });

    it('should render HolidayCardImage with appropriate props', () => {
        render(<HolidayCard {...mockProps} />);

        expect(mockHolidayCardImage).toHaveBeenCalledWith({
            offer: mockProps.offer,
            fallbackImage: mockProps.fallbackImage,
            isLuxuryPackage: false,
        });
    });

    it('should render HolidayCardHeader with appropriate props', () => {
        render(<HolidayCard {...mockProps} />);

        expect(mockHolidayCardHeader).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: mockProps.offer,
            }),
        );
    });

    it('should render HolidayCardBody with appropriate props', () => {
        render(<HolidayCard {...mockProps} />);

        expect(mockHolidayCardBody).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: mockProps.offer,
                shouldShowPrice: mockProps.shouldShowPrice,
                isLuxuryPackage: false,
            }),
        );
    });
});
