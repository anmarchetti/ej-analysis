import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import AmendDatesSummaryFooter from './AmendDatesSummaryFooter';

const createProps = () => ({
    totalLabel: {
        value: 'totalLabel',
    },
});

let mockProps;
let mockStores;

jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryContinueBtn/AmendDatesSummaryContinueBtn',
    () => ({
        __esModule: true,
        default: () => <div>AmendDatesSummaryContinueBtn</div>,
    }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendDatesSummaryFooter />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: {
                offerPrices: {
                    amendmentDatesCharges: 30.01,
                },
            },
            marketStore: {
                formatMoney: jest.fn(v => v),
            },
        });
        mockProps = createProps();
    });

    it('Render totalAmount price', () => {
        render(<AmendDatesSummaryFooter {...mockProps} />);

        expect(screen.getByTestId('date-change-summary-footer')).toBeInTheDocument();
        expect(screen.getByText('31')).toBeInTheDocument();
        expect(screen.getByText('AmendDatesSummaryContinueBtn')).toBeInTheDocument();
    });

    it('Render null if no price for offer', () => {
        mockStores.amendDatesStore.offerPrices.amendmentDatesCharges = undefined;
        const { container } = render(<AmendDatesSummaryFooter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Render footer when amendmentDatesCharges is 0', () => {
        mockStores.amendDatesStore.offerPrices.amendmentDatesCharges = 0;
        render(<AmendDatesSummaryFooter {...mockProps} />);

        expect(screen.getByTestId('date-change-summary-footer')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('AmendDatesSummaryContinueBtn')).toBeInTheDocument();
    });
});
