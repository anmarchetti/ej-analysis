import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import DealsPromoTiles from './DealsPromoTiles';

const createProps = () => ({
    fields: {
        items: [
            {
                id: 1,
                Title: { value: 'test1' },
                Image: { src: 'image1' },
                Link: { href: 'url1', text: 'link1', linkType: 'external1' },
                fields: {
                    Title: { value: 'Test' },
                    Image: { src: 'image' },
                    Link: { href: 'url', text: 'link', linkType: 'external' },
                    IsRequestedPriceEnabled: { value: true },
                    IsRequestedPricePP: { value: true },
                    IsRequestedPriceRounded: { value: true },
                    RequestedSearch: { Name: 'search' },
                    PriceMathFunction: {
                        fields: {
                            Code: { value: 'cheapest' },
                            Name: { value: 'name' },
                        },
                    },
                    SortOrder: null,
                },
            },
        ],
    },
    rendering: { placeholders: { [PlaceholderNames.TitleBlock]: [] } },
    params: {
        IsModuleClickTrackingEnabled: 'click',
        ModuleLocation: 'Top Banner',
    },
});

const createStores = () =>
    createMockStores({
        trackingStore: { trackModuleClick: jest.fn() },
        layoutStore: {
            isEditMode: false,
            sitePath: 'path',
            isTouristTaxEnabled: true,
        },
        appStore: { isScreenLessMedium: false },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/DealsPromoTiles/components/DealsPromoTile', () => ({
    __esModule: true,
    default: ({ setIsTouristTaxDisplayed }) => {
        setIsTouristTaxDisplayed(true);

        return <div className='tile' key={mockProps.fields.items[0].id} />;
    },
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

describe('<DealsPromoTiles />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', () => {
        mockProps.fields = null;
        const { container } = render(<DealsPromoTiles {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render promo tile', async () => {
        const { container } = render(<DealsPromoTiles {...mockProps} />);

        expect(container.getElementsByClassName('tile').length).toBe(1);
    });

    it('should NOT render promo tile', async () => {
        mockProps.fields.items = null;
        const { container } = render(<DealsPromoTiles {...mockProps} />);

        expect(container.getElementsByClassName('tile').length).toBe(0);
    });

    it('should render tax info when isTouristTaxEnabled is true', () => {
        render(<DealsPromoTiles {...mockProps} />);

        expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
    });

    it('should NOT render tax info when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;
        render(<DealsPromoTiles {...mockProps} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });
});
