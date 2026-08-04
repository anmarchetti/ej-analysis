import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import PriceContent, { IPriceContentProps } from './PriceContent';

const createProps = (): IPriceContentProps => ({
    link: mockSitecoreField(mockSitecoreLinkField('/', 'link', SitecoreLinkType.External)),
    livePrice: { pricePP: 20 } as ILivePrice,
    price: mockSitecoreField('20'),
    pricePrefix: mockSitecoreField('pricePrefix'),
    isExternalExtras: false,
});

const createStores = () => ({
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/usePriceLabels', () =>
    jest.fn(() => ({
        labelBeforePrice: 'mockLabelBeforePrice',
        labelAfterPrice: 'mockLabelAfterPrice',
    })),
);

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

describe('<PriceContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render component when both price and live price are empty', () => {
        mockProps.livePrice = undefined;
        mockProps.price = undefined;
        const { container } = render(<PriceContent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render live price if present', () => {
        const { queryByTestId, getByTestId } = render(<PriceContent {...mockProps} />);

        expect(getByTestId('live-price-content')).toBeInTheDocument();
        expect(queryByTestId('price-content-prefix')).not.toBeInTheDocument();
        expect(queryByTestId('regular-price-content')).not.toBeInTheDocument();

        expect(getByTestId('live-price-label-before')).toHaveTextContent('mockLabelBeforePrice');
        expect(getByTestId('live-price')).toHaveTextContent('£20');
        expect(getByTestId('live-price-label-after')).toHaveTextContent('mockLabelAfterPrice');
    });

    it('should render regular price when live price is NOT present', () => {
        mockProps.livePrice = undefined;
        const { queryByTestId, getByTestId } = render(<PriceContent {...mockProps} />);

        expect(queryByTestId('live-price-content')).not.toBeInTheDocument();
        expect(getByTestId('price-content-prefix')).toBeInTheDocument();
        expect(getByTestId('regular-price-content')).toBeInTheDocument();

        expect(getByTestId('price-content-prefix')).toHaveTextContent('pricePrefix');
        expect(getByTestId('price-content')).toHaveTextContent('20');
    });

    it('should render additional regular price styling when isExternalExtras=true', () => {
        mockProps.livePrice = undefined;
        mockProps.isExternalExtras = true;
        const { getByTestId } = render(<PriceContent {...mockProps} />);

        expect(getByTestId('price-content-prefix')).toHaveClass('alignRight');
        expect(getByTestId('regular-price-content')).toHaveClass('priceContainerAlt');
    });
});
