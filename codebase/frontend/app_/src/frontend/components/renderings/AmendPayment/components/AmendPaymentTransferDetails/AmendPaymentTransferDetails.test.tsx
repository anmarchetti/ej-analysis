import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockTransferWithAmendmentCharges } from 'frontend/__mocks__';

import AmendPaymentTransferDetails from './AmendPaymentTransferDetails';

expect.extend(toHaveNoViolations);

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTransferCardProps = jest.fn();
jest.mock('frontend/components/renderings/AmendTransfers/components/AmendTransferCard', () => ({
    __esModule: true,
    default: props => {
        mockTransferCardProps(props);

        return <div data-tid='transfer-card' />;
    },
}));

describe('<AmendPaymentTransferDetails />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendTransfersStore: {
                selectedTransfer: mockTransferWithAmendmentCharges,
            },
        });
    });

    it('Should render component', () => {
        render(<AmendPaymentTransferDetails />);

        expect(screen.getByTestId('amend-payment-transfer-details')).toBeInTheDocument();
        expect(mockTransferCardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                transfer: mockTransferWithAmendmentCharges.transfer,
                amendCharge: 13,
                contentClassName: 'cardContent',
                currency: undefined,
                isPriceBlockHidden: true,
                isPayment: true,
            }),
        );
    });

    it('Should render nothing when selected transfer is not exists', () => {
        mockStores.amendTransfersStore.selectedTransfer = null;
        const { container } = render(<AmendPaymentTransferDetails />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentTransferDetails />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
