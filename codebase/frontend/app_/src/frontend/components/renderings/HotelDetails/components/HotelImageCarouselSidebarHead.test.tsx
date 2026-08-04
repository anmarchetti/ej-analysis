import * as React from 'react';
import { render, screen, within } from '@testing-library/react';

import HotelImageCarouselSidebarHead from './HotelImageCarouselSidebarHead';

jest.mock('frontend/components/common/EcoCertifiedPill', () => () => <div data-tid='eco-certified-pill' />);

jest.mock('frontend/components/renderings/HotelDetails/components/HotelLocation', () => ({
    __esModule: true,
    RenderedHotelLocationLinks: () => <div data-tid='rendered-hotel-location-links' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    __esModule: true,
    Text: () => <div data-tid='sitecore-jss-text'>Text</div>,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/HotelRating', () => () => (
    <div data-tid='hotel-rating' />
));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => () => (
    <div data-tid='tripadvisor-info' />
));

jest.mock('frontend/components/cro/Experiment', () => ({
    __esModule: true,
    Experiment: ({ children }) => <div data-tid='experiment'>{children}</div>,
    Variant: ({ children, default: isDefault }) => (
        <div data-tid='variant'>
            {children}
            {!!isDefault && <span>isDefault</span>}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton', () => ({
    __esModule: true,
    default: () => <div data-tid='shortlist-button' />,
}));

const createStores = () => ({
    shortlistStore: {
        isShortlistEnabled: false,
    },
    layoutStore: {
        isEcoCertifiedEnabledOnHotelDetailsPage: false,
    },
});
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelImageCarouselSidebarHead />', () => {
    const resetMocks = () =>
        ({
            rendering: {} as any,
            hotelInfo: {
                numberOfReviews: 0,
                rating: 0,
                name: 'Hotel Name',
                ecoFacility: {
                    name: '',
                    tooltip: false,
                },
            } as any,
            reviewsAnchor: '',
            offer: {} as any,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.getByTestId('card-head')).toBeInTheDocument();
        expect(screen.getByTestId('title')).toBeInTheDocument();
        expect(screen.getByTestId('rendered-hotel-location-links')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-rating')).toBeInTheDocument();
    });

    it("Should get empty string subTitle when we haven't hotelInfo", () => {
        mocks.hotelInfo = null;

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.queryByTestId('rendered-hotel-location-links')).not.toBeInTheDocument();
    });

    it('Should render hotelInfo.name in Title', () => {
        mocks.hotelInfo.name = 'Hotel Name';

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        within(screen.getByTestId('title'));
        expect(screen.getByText(mocks.hotelInfo.name)).toBeInTheDocument();
    });

    it('Should render SiteCore Component Title', () => {
        mocks.hotelInfo.name = { HotelName: { value: 'Hotel Name' } };

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
    });

    it('should render card with Trip Advisor', () => {
        mocks.hotelInfo.numberOfReviews = 5;
        mocks.hotelInfo.rating = 5;

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();
    });

    it('should render card with EcoPill', () => {
        mocks.hotelInfo.ecoFacility.name = 'ecoFacility';
        mocks.hotelInfo.ecoFacility.tooltip = true;
        mockStores.layoutStore.isEcoCertifiedEnabledOnHotelDetailsPage = true;

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
    });

    it('should NOT render ShortlistButton when isShortlistEnabled is false', () => {
        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.queryByTestId('shortlist-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('card-head-actions')).not.toHaveClass('cardHeadActionsLong');
    });

    it('should render ShortlistButton when isShortlistEnabled is true', () => {
        mockStores.shortlistStore.isShortlistEnabled = true;

        render(<HotelImageCarouselSidebarHead {...mocks} />);

        expect(screen.getByTestId('shortlist-button')).toBeInTheDocument();
        expect(screen.getByTestId('card-head-actions')).toHaveClass('cardHeadActionsLong');
    });
});
