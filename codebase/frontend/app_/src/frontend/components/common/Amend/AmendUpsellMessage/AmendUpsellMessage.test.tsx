import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendUpsellMessage from './AmendUpsellMessage';

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

expect.extend(toHaveNoViolations);

describe('<AmendUpsellMessage />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendTransfersStore: {
                currency: CurrencyCode.GBP,
            },
        });
        mockProps = {
            price: 10,
            priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeTransfer,
        };
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendUpsellMessage {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    it('Should be rendered with price and label', () => {
        render(<AmendUpsellMessage {...mockProps} />);

        expect(
            screen.getByText(`${SitecoreDictionary.ViewBookingLabelsUpgradeTransfer} £${mockProps.price}`),
        ).toBeInTheDocument();
    });

    it('Should NOT render price label when prise is not provided with props', () => {
        mockProps.price = 0;
        render(<AmendUpsellMessage {...mockProps} />);

        expect(screen.queryByText('ViewBooking.Labels.UpgradeTransfer')).not.toBeInTheDocument();
    });

    it('Should not be rendered when no price label', () => {
        mockProps.priceLabel = null;
        render(<AmendUpsellMessage {...mockProps} />);

        expect(screen.queryByText(`${SitecoreDictionary.ViewBookingLabelsUpgradeTransfer}`)).not.toBeInTheDocument();
    });

    it('Should render with price rounded up', () => {
        mockProps.price = 10.38;
        render(<AmendUpsellMessage {...mockProps} />);

        expect(screen.getByText('ViewBooking.Labels.UpgradeTransfer £11')).toBeInTheDocument();
    });

    it('Should apply biggerMargin class when isPostBookingPages is true', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        render(<AmendUpsellMessage {...mockProps} />);

        const label = screen.getByText(`${SitecoreDictionary.ViewBookingLabelsUpgradeTransfer} £${mockProps.price}`);
        expect(label).toHaveClass('biggerMargin');
    });

    it('Should NOT apply biggerMargin class when isPostBookingPages is false', () => {
        mockStores.layoutStore.isPostBookingPages = false;
        render(<AmendUpsellMessage {...mockProps} />);

        const label = screen.getByText(`${SitecoreDictionary.ViewBookingLabelsUpgradeTransfer} £${mockProps.price}`);
        expect(label).not.toHaveClass('biggerMargin');
    });
});
