import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode, SignDisplay } from 'code/currency';
import { createMockStores, mockTransferFields } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import PriceInfo, { IPriceInfo } from './PriceInfo';

const createProps = (): IPriceInfo => ({
    pricePP: 100,
    isLabelPPShown: true,
    type: TransferType.Private,
    currency: CurrencyCode.GBP,
    isNoTransfer: false,
    UpgradeForText: mockTransferFields.UpgradeForText,
    UpgradeForFree: mockTransferFields.UpgradeForFree,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ price, ...restProps }) => {
        mockPriceLabelProps(restProps);

        return <div data-tid='price-label'>{price}</div>;
    },
}));

let mockStores;
let mockProps;

describe('<PriceInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    describe('price label', () => {
        it('should render price and label with positive price', () => {
            render(<PriceInfo {...mockProps} />);

            expect(screen.getByTestId('price-container-PRIVATE')).toHaveTextContent('UpgradeForText');

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(mockPriceLabelProps).toHaveBeenCalledWith({
                priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPerson,
                dataTid: 'transfer-price-info',
            });

            expect(screen.getByText('£100')).toBeInTheDocument();
            expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.pricePP, {
                currency: 'GBP',
                maximumFractionDigits: 0,
                signDisplay: undefined,
            });
        });

        it('should render price and label with negative price', () => {
            mockProps.pricePP = -50;

            render(<PriceInfo {...mockProps} />);

            expect(screen.getByTestId('price-container-PRIVATE')).not.toHaveTextContent('UpgradeForText');

            expect(screen.getByText('£-50')).toBeInTheDocument();
            expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.pricePP, {
                currency: 'GBP',
                maximumFractionDigits: 0,
                signDisplay: SignDisplay.ExceptZero,
            });
        });

        it('should render price without pp when isLabelPPShown is false', () => {
            mockProps.isLabelPPShown = false;

            render(<PriceInfo {...mockProps} />);

            expect(mockPriceLabelProps).toHaveBeenCalledWith({
                priceDictionary: undefined,
                dataTid: 'transfer-price-info',
            });
        });
    });

    it('should render UpgradeForFree text when price is zero for private transfer', () => {
        mockProps.pricePP = 0;
        mockProps.type = TransferType.Private;

        render(<PriceInfo {...mockProps} />);

        expect(screen.getByTestId('price-container-PRIVATE')).toHaveTextContent('UpgradeForFree');
        expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
    });

    it('should NOT render component when price is undefined', () => {
        mockProps.pricePP = undefined;

        const { container } = render(<PriceInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when price is zero for noTransfer', () => {
        mockProps.pricePP = 0;
        mockProps.isNoTransfer = true;

        const { container } = render(<PriceInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
