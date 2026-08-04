import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendHotelOffer, mockHotel } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendHotelOfferCardFooter from './AmendHotelOfferCardFooter';

jest.mock('frontend/utils/getHotelLocation');

const createMockProps = () => ({
    fields: {
        ViewHotelCTA: mockSitecoreField('ViewHotelCTA'),
        BookHotelCTA: mockSitecoreField('BookHotelCTA'),
        PriceTooltip: mockSitecoreField('PriceTooltip'),
    },
    onSelectHotel: jest.fn(),
    offer: {
        ...mockedOffer,
        price: 100,
        accom: {
            ...mockedOffer.accom,
            unit: [
                {
                    ...mockedOffer.accom.unit[0],
                    isFreeForKids: false,
                },
            ],
        },
    },
    amendHotelOffer: mockAmendHotelOffer,
    onClick: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='search-results-loading-skeleton' />,
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCalloutProps(props);

        return <div data-tid='callout'>{props.content}</div>;
    },
}));

const mockFreeForKidsPillProps = jest.fn();
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeForKidsPillProps(props);

        return <div data-tid='free-for-kids-pill'>{props.children}</div>;
    },
}));

const mockHotelPreviewLinkProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink', () => ({
    __esModule: true,
    default: ({ clickHandler, ...props }) => {
        mockHotelPreviewLinkProps(props);

        return (
            <button onClick={() => clickHandler('preview-link')} data-tid='hotel-preview-link'>
                {props.children}
            </button>
        );
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<AmendHotelOfferCardFooter />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                setSelectedHotelDetailsOffer: jest.fn(),
            },
        });
    });

    it('Should render component', () => {
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.getByText('£100')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.PriceSummaryLabelsTotal)).toBeInTheDocument();
        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith(
            expect.objectContaining({
                orientation: CalloutOrientation.Top,
                position: CalloutPosition.Right,
                isShownOnHover: true,
            }),
        );

        expect(screen.getByTestId('hotel-preview-link')).toBeInTheDocument();
        expect(mockHotelPreviewLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                hotel: mockProps.offer.hotel,
                className: 'btn btn--outlined btn--full-width viewHotelButton',
            }),
        );
        expect(screen.getByText(mockProps.fields.ViewHotelCTA.value)).toBeInTheDocument();
        expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.PriceTooltip.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.BookHotelCTA.value)).toBeInTheDocument();
    });

    it('Should render FreeForKidsPill if applicable', () => {
        mockProps.offer = {
            ...mockProps.offer,
            accom: { ...mockProps.offer.accom, unit: [{ ...mockProps.offer.accom.unit[0], isFreeForKids: true }] },
        };

        render(<AmendHotelOfferCardFooter {...mockProps} />);
        expect(screen.getByTestId('free-for-kids-pill')).toBeInTheDocument();
        expect(mockFreeForKidsPillProps).toHaveBeenCalledWith(
            expect.objectContaining({
                countryCode: mockProps.offer.hotel?.country?.code,
                tooltipMessage: mockStores.layoutStore.getPhrase(
                    SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
                ),
            }),
        );
    });

    it('Should render null if fields are not provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render PriceTooltip if not provided', () => {
        mockProps.fields.PriceTooltip = undefined;
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
    });

    it('Should NOT render BookHotelCTA if not provided', () => {
        mockProps.fields.BookHotelCTA = undefined;
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.queryByTestId('book-hotel-cta')).not.toBeInTheDocument();
    });

    it('Should NOT render HotelPreviewLink if not provided', () => {
        mockProps.fields.ViewHotelCTA = undefined;
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
    });

    it('Should NOT render HotelPreviewLink if hotel is not provided', () => {
        mockProps.offer.hotel = undefined;
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
    });

    it('Should NOT render HotelPreviewLink if amend offer is not provided', () => {
        mockProps.offer.hotel = mockHotel;
        mockProps.amendHotelOffer = undefined;
        render(<AmendHotelOfferCardFooter {...mockProps} />);

        expect(screen.queryByTestId('hotel-preview-link')).not.toBeInTheDocument();
    });

    describe('Click on hotel-preview-link', () => {
        it('should call trackClickViewBookingFromAmendHotel', async () => {
            render(<AmendHotelOfferCardFooter {...mockProps} />);

            const btn = screen.getByTestId('hotel-preview-link');
            await userEvent.click(btn);

            expect(mockStores.trackingStore.changeHotel.clickViewBookingFromAmendHotel).toHaveBeenCalledWith(
                mockProps.amendHotelOffer,
                'preview-link',
            );
        });

        it('should call mobile handler when isMobile is true', async () => {
            mockUseMobileViewport = true;

            render(<AmendHotelOfferCardFooter {...mockProps} />);

            const btn = screen.getByTestId('hotel-preview-link');
            await userEvent.click(btn);

            expect(mockStores.trackingStore.changeHotel.clickViewBookingFromAmendHotel).toHaveBeenCalledWith(
                mockProps.amendHotelOffer,
                'preview-link',
            );
            expect(mockStores.amendHotelStore.setSelectedHotelDetailsOffer).toHaveBeenCalledWith(
                mockProps.amendHotelOffer,
                mockProps.offer.hotel,
            );
            expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith('preview-link');
        });
    });
});
