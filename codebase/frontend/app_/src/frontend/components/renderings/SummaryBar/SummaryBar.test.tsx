import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { RouteDirection } from 'models/enum/RouteDirection';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { mockSummaryBarSitecoreFields } from './mocks';
import SummaryBar from './SummaryBar';
import { ISummaryBarSitecoreFields } from './SummaryBar.interfaces';

const createProps = (): ISitecoreComponent<ISummaryBarSitecoreFields> => ({
    fields: { ...mockSummaryBarSitecoreFields },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isExtrasPage: true,
            isSummaryBarEnabled: true,
            isSummaryBarHidden: false,
            getPhrase: jest.fn((key: string) => key),
        },
        appStore: {
            isScreenLessMedium: false,
        },
        bookingStore: {
            selectedOffer: {
                hotel: {
                    name: 'Hotel Cool Breeze',
                    country: { name: 'Spain' },
                    location: { name: 'Catalonia' },
                    resort: { name: 'Costa Brava' },
                    images: [
                        {
                            description: '',
                            large: 'https://example.com/large1.jpg',
                            medium: 'https://example.com/medium1.jpg',
                            small: 'https://example.com/small1.jpg',
                        },
                    ],
                },
                transport: {
                    routes: [
                        { direction: RouteDirection.Outbound, depDate: new Date('2025-08-01T10:00:00Z') },
                        { direction: RouteDirection.Inbound, depDate: new Date('2025-08-06T18:00:00Z') },
                    ],
                },
                accom: {
                    unit: [
                        { occupation: { adults: 2, children: 1, infants: 1 } },
                        { occupation: { adults: 1, children: 0, infants: 0 } },
                    ],
                },
                stay: 5,
            },
        },
    });

let mockProps;
let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='summary-details' />,
}));

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    OfferCardSlider: () => <div data-tid='slider' />,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn((date: Date) => `formatted-${date.toISOString()}`),
}));

jest.mock('frontend/utils/accommodation.utils', () => ({
    getDurationLabel: jest.fn((getPhrase: any, stay: number) => `${stay} nights`),
}));

jest.mock('frontend/utils/guestsValidation', () => ({
    getNumberOfGuestsByCategory: jest.fn(
        (_getPhrase: any, adults: number, children: number, infants: number) =>
            `${adults} adults, ${children} children, ${infants} infants`,
    ),
}));

describe('<SummaryBar />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render the title when the component is enabled', () => {
        render(<SummaryBar {...mockProps} />);

        expect(screen.getByTestId('summary-bar-title')).toBeInTheDocument();
    });

    it('should NOT render the title when the component is enabled but the page is on mobile', () => {
        mockStores.appStore.isScreenLessLarge = true;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-title')).not.toBeInTheDocument();
    });

    it('should NOT render the title when the page is extras but the component is NOT enabled', () => {
        mockStores.layoutStore.isSummaryBarEnabled = false;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-title')).not.toBeInTheDocument();
    });

    it('should NOT render the title when the offer is not present', () => {
        mockStores.bookingStore.selectedOffer = null;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-title')).not.toBeInTheDocument();
    });

    it('should NOT render the title when the fields are empty', () => {
        mockProps.fields = null;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-title')).not.toBeInTheDocument();
    });

    it('should add isHidden class to the summary bar component if isSummaryBarHidden is true', () => {
        mockStores.layoutStore.isSummaryBarHidden = true;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar')).toHaveClass('isHidden');
    });

    it('should NOT add isHidden class to the summary bar component if isSummaryBarHidden is false', () => {
        mockStores.layoutStore.isSummaryBarHidden = false;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar')).not.toHaveClass('isHidden');
    });

    it('should render positioned container with summaryBarContainerExtras class when isExtrasPage is true', () => {
        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-positioned-container')).toHaveClass('summaryBarContainerExtras');
    });

    it('should render positioned container without summaryBarContainerExtras class when isExtrasPage is false', () => {
        mockStores.layoutStore.isExtrasPage = false;

        render(<SummaryBar {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-positioned-container')).not.toHaveClass('summaryBarContainerExtras');
    });
});
