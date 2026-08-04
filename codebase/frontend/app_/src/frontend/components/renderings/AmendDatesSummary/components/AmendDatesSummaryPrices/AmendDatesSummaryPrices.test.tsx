import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores as createDefaultMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ScreenViews } from 'models/enum/ScreenViews';

import AmendDatesSummaryPrices from './AmendDatesSummaryPrices';

jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryFee/AmendDatesSummaryFee',
    () => ({
        __esModule: true,
        default: () => <div>AmendDatesSummaryFee</div>,
    }),
);
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: () => <div>Callout</div>,
}));

const createProps = () => ({
    fields: {
        ChangeFeeLabel: mockSitecoreField('ChangeFeeLabel'),
        PreviousCostLabel: mockSitecoreField('PreviousCostLabel'),
        AdditionalCostLabel: mockSitecoreField('AdditionalCostLabel'),
        NewCostLabel: mockSitecoreField('NewCostLabel'),
        CostTooltipContent: mockSitecoreField('CostTooltipContent'),
        ShowCostTooltip: mockSitecoreField(true),
    },
    tidPostfix: ScreenViews.Desktop,
});

const createMockStores = () =>
    createDefaultMockStores({
        amendDatesStore: {
            ...mockAmendDatesStore,
            offerPrices: {
                ...mockAmendDatesStore.offerPrices,
                bookingPrice: 100.01,
                offerPrice: 130.01,
                amendmentDatesCharges: 10.01,
            },
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendDatesSummaryPrices />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render all components', () => {
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.getByText('PreviousCostLabel')).toBeInTheDocument();
        expect(screen.getByText('£100.01')).toBeInTheDocument();
        expect(screen.getByText('NewCostLabel')).toBeInTheDocument();
        expect(screen.getByText('£130.01')).toBeInTheDocument();
        expect(screen.getByText('Callout')).toBeInTheDocument();
        expect(screen.getByText('AdditionalCostLabel')).toBeInTheDocument();
        expect(screen.getByText('£10.01')).toBeInTheDocument();
        expect(screen.getByText('AmendDatesSummaryFee')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-previous-price')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-new-price')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-additional-cost')).toBeInTheDocument();
        expect(screen.getByTestId(`amend-dates-summary-prices-${ScreenViews.Desktop}`)).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-previous-cost-label')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-previous-cost')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-new-cost-label')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-new-cost')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-additional-cost-label')).toBeInTheDocument();
        expect(screen.getByTestId('amend-dates-additional-price')).toBeInTheDocument();
    });

    it('Render null if no prices', () => {
        mockStores.amendDatesStore.offerPrices = null;
        const { container } = render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Prevent render tooltip if it was tuned off', () => {
        mockProps.fields.ShowCostTooltip = mockSitecoreField(false);
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.queryByText('Callout')).not.toBeInTheDocument();
    });

    it('Prevent fee if it has not been provided', () => {
        mockStores.amendDatesStore.offerPrices.amendmentDatesFees = null;
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.queryByText('AmendDatesSummaryFee')).not.toBeInTheDocument();
    });

    it('Do NOT render previous cost label', () => {
        mockStores.amendDatesStore.offerPrices = {
            bookingPrice: null,
        };
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.queryByText('PreviousCostLabel')).not.toBeInTheDocument();
    });

    it('Do NOT render new cost label', () => {
        mockStores.amendDatesStore.offerPrices = {
            offerPrice: null,
        };
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.queryByText('NewCostLabel')).not.toBeInTheDocument();
    });

    it('Do NOT render additional cost label', () => {
        mockStores.amendDatesStore.offerPrices = {
            amendmentDatesCharges: null,
        };
        render(<AmendDatesSummaryPrices {...mockProps} />);

        expect(screen.queryByText('AdditionalCostLabel')).not.toBeInTheDocument();
    });
});
