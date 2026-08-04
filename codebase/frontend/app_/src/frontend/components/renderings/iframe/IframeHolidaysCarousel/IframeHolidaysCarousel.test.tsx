import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { mockIframeOffer } from './__mocks__/iframe.mocks';
import { IframeHolidaysCarousel } from './IframeHolidaysCarousel';

const mockHolidayCard = jest.fn();
jest.mock('./components/Cards/HolidayCard/HolidayCard', () => ({
    __esModule: true,
    default: props => {
        mockHolidayCard(props);

        return <div data-tid='holiday-card' />;
    },
}));

jest.mock('./components/Cards/ViewAllCard/ViewAllCard', () => () => <div data-tid='view-all-card' />);

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

const createProps = () => ({
    fields: {
        DefaultText: mockSitecoreField('test default'),
        HoldBagText: mockSitecoreField('test hold bag'),
    },
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            basePath: '/en-holidays',
            isATOLProtectionEnabled: true,
        },
        queryParamStore: {
            totalGuestQuantity: 2,
            childrenQuantity: 0,
            buildSearchQueryWithParams: jest.fn(),
        },
        hotelsStore: {
            offers: [mockIframeOffer, { ...mockIframeOffer, id: '2' }, { ...mockIframeOffer, id: '3' }],
        },
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<IframeHolidaysCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component', () => {
        render(<IframeHolidaysCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getAllByTestId('holiday-card')).toHaveLength(3);
        expect(screen.getByTestId('view-all-card')).toBeInTheDocument();
        expect(screen.getByTestId('show-more-link')).toBeInTheDocument();
        expect(screen.getByTestId('atol')).toHaveTextContent(SitecoreDictionary.IframePromotingHolidaysLabelsAtol);
        expect(mockHolidayCard).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                fallbackImage: 'HotelFallbackImage',
                shouldShowPrice: true,
            }),
        );
    });

    it('should render nothing if no offers', () => {
        mockStores.hotelsStore.offers = [];

        const { container } = render(<IframeHolidaysCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render ATOL label when it is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;

        render(<IframeHolidaysCarousel {...mockProps} />);

        expect(screen.queryByTestId('atol')).not.toBeInTheDocument();
    });
});
