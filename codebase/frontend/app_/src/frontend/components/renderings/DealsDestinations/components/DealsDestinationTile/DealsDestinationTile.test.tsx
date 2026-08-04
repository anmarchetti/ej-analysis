import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { IRequestedPrice, IRequestedPriceValues } from 'models/data/IRequestedPrice';
import { mockTileFields } from 'frontend/components/renderings/DealsDestinations/mocks';

import DealsDestinationTile, { IDealsDestinationTileProps } from './DealsDestinationTile';

jest.mock('frontend/utils/livePrice.utils', () => ({
    getRequestedPriceAmountText: jest.fn().mockReturnValue('100'),
    getRequestedPriceDictionary: jest.fn(),
    buildRequestedPriceUrl: jest.fn().mockReturnValue('url'),
    getRequestedPriceValues: jest.fn().mockReturnValue({} as IRequestedPriceValues),
    isRequestedPriceInputValid: jest.fn().mockReturnValue(true),
}));

jest.mock('frontend/components/renderings/DealsDestinations/utils', () => ({
    getDestTileRequestedPriceText: jest.fn().mockReturnValue('price-label-text'),
}));

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: () => <div data-tid='price-label' />,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, onClick }) => (
        <div data-tid='router-link' onClick={onClick}>
            {children}
        </div>
    ),
}));

const createProps = (): IDealsDestinationTileProps => ({
    fields: deepClone(mockTileFields),
    pricesByDestCodes: { ES: { value: { geog: 'ES' } }, get: jest.fn(p => p) } as unknown as Map<
        string,
        IRequestedPrice
    >,
    requestedSearchUrl: undefined,
    parentTitle: 'parentTitle',
    setIsTouristTaxTooltipDisplayed: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isHolidayTypePage: false,
            isDealsHubPage: false,
        },
        trackingStore: { trackHolidayTypesHubEvents: jest.fn() },
        marketStore: { formatMoney: jest.fn(a => `£${a}`) },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<DealsDestinationTile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render title with link and price label', () => {
        render(<DealsDestinationTile {...mockProps} />);

        expect(screen.getByTestId('router-link')).toHaveTextContent(mockProps.fields.Destination[0].fields.Name.value);
        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(screen.getByTestId('deals-destination-tile-title')).toBeInTheDocument();
    });

    it('should call trackHolidayTypesHubEvents on router link click', () => {
        render(<DealsDestinationTile {...mockProps} />);

        waitFor(() => {
            userEvent.click(screen.getByTestId('router-link'));
            expect(mockStores.trackingStore.trackHolidayTypesHubEvents).toHaveBeenCalled();
        });
    });

    it('should render title without link and NOT render price label when fields are NOT provided', () => {
        mockProps.fields = undefined;
        render(<DealsDestinationTile {...mockProps} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render title without link and NOT render price label when pricesByDestCodes are NOT provided', () => {
        mockProps.pricesByDestCodes = undefined;
        render(<DealsDestinationTile {...mockProps} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        expect(screen.getByRole('heading')).toHaveTextContent(mockProps.fields.Destination[0].fields.Name.value);
    });
});
