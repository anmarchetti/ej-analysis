import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IRequestedPriceValues } from 'models/data/IRequestedPrice';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PriceMathFunction } from 'models/enum/PriceMathFunction';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';

import DealsPromoTile, { IDealsPromoTileProps } from './DealsPromoTile';

jest.mock('frontend/utils/livePrice.utils', () => ({
    buildRequestedPriceUrl: jest.fn().mockReturnValue('url'),
    buildSitecoreLinkFullUrl: jest.fn().mockReturnValue('url2'),
    getRequestedPriceAmountText: jest.fn().mockReturnValue('100'),
    getRequestedPriceValues: jest.fn().mockReturnValue({} as IRequestedPriceValues),
    isRequestedPriceInputValid: jest.fn().mockReturnValue(true),
}));

jest.mock('frontend/services/offers.service', () => ({
    getRequestedPrice: jest.fn().mockReturnValue([{}, {}, {}]),
}));

const createProps = (): IDealsPromoTileProps => ({
    fields: {
        Title: mockSitecoreField('Test'),
        Image: { value: { src: 'image' } },
        Link: mockSitecoreField(mockSitecoreLinkField('url', 'link', SitecoreLinkType.External)),
        IsRequestedPriceEnabled: { value: true },
        IsRequestedPricePP: { value: true },
        IsRequestedPriceRounded: { value: true },
        RequestedSearch: { Name: 'search', Destinations: [], Url: '' },
        PriceMathFunction: {
            fields: {
                Code: { value: PriceMathFunction.Cheapest },
                Name: { value: 'name' },
            },
            id: '1',
        },
        SortOrder: {} as ISortOrderItem,
    },
    onItemLinkClick: jest.fn(),
    setIsTouristTaxDisplayed: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
        getPhrase: jest.fn(),
        sitePath: 'path',
    },
    appStore: { isScreenLessMedium: false },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps: IDealsPromoTileProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RouterLink', () => ({ children }) => <div data-tid='link'>{children}</div>);

const mockJSSIMageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<DealsPromoTile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render jssImageNext', () => {
        render(<DealsPromoTile {...mockProps} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSIMageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mockProps.fields.Image,
                mediaSize: { desktop: MediaSize.Medium },
                fill: true,
            }),
        );
    });

    it('should render link with title', async () => {
        const { getByTestId } = render(<DealsPromoTile {...mockProps} />);

        await waitFor(() => {
            expect(getByTestId('link')).toHaveTextContent('Test');
        });
    });

    it('should render title block exp editor', async () => {
        mockStores.layoutStore.isEditMode = true;
        const { container } = render(<DealsPromoTile {...mockProps} />);

        await waitFor(() => {
            expect(container.getElementsByClassName('tile-block--exp-editor').length).toBe(1);
        });
    });

    it('should render title without link', async () => {
        mockProps.fields.Link = null as any;
        const { getByRole, getByText } = render(<DealsPromoTile {...mockProps} />);

        await waitFor(() => {
            expect(getByText('Test')).not.toHaveClass('link-pseudo-overlay');
            expect(getByRole('heading')).toHaveTextContent('Test');
        });
    });

    it('should NOT render price info', async () => {
        const { container } = render(<DealsPromoTile {...mockProps} />);

        await waitFor(() => {
            expect(container.getElementsByClassName('tile-block-info__price').length).toBe(0);
        });
    });

    it('should NOT render', () => {
        mockProps.fields = null as any;
        const { container } = render(<DealsPromoTile {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
