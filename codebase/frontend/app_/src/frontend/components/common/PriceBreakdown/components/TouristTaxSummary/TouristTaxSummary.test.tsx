import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';

import TouristTaxSummary, { ITouristTaxSummaryProps } from './TouristTaxSummary';

const mockTaxesAndFees: TAmendTaxesAndFees = [
    {
        code: 'TAX1',
        exchangeRate: 1.19,
        paylocalAmount: 10,
        paylocalAmountConverted: 8.4,
        paylocalAmountConvertedCurrency: 'GBP',
        paylocalAmountCurrency: 'EUR',
    },
];

const createProps = (): ITouristTaxSummaryProps => ({
    currency: CurrencyCode.GBP,
    newTaxesAndFees: mockTaxesAndFees,
    newTouristTaxConverted: 8.4,
    prevTouristTax: 5,
    prevTaxLabel: 'Previous tax',
    newTaxLabel: 'New tax',
    newTaxPopupTitle: 'Tooltip title',
    newTaxPopupContent: 'Tooltip content',
});

let mockStores = createMockStores({
    marketStore: {
        formatMoney: jest.fn(a => `${a}`),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceTokens: jest.fn(content => content ?? ''),
    },
}));

jest.mock('./TouristTaxSummary.utils', () => ({
    buildAmountToken: jest.fn(() => 'EUR 10.00'),
    buildRateToken: jest.fn(() => 'EUR 1 = GBP 0.85'),
}));

const mockTooltipTriggerProps = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: props => {
        mockTooltipTriggerProps(props);

        return <div data-tid='tooltip-trigger'>{props.children}</div>;
    },
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => {
    const RichTextWithLinks = props => {
        mockRichTextWithLinksProps(props);

        return <span>{props.field?.value}</span>;
    };

    return { __esModule: true, default: RichTextWithLinks };
});

describe('<TouristTaxSummary />', () => {
    let mockProps = createProps();

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            marketStore: {
                formatMoney: jest.fn(a => `${a}`),
            },
        });
        mockRichTextWithLinksProps.mockClear();
        mockTooltipTriggerProps.mockClear();
    });

    it('should render previous tax row with label and formatted amount', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(screen.getByText(mockProps.prevTaxLabel!)).toBeInTheDocument();
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.prevTouristTax, {
            currency: mockProps.currency,
        });
    });

    it('should render new tax label when provided', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith(
            expect.objectContaining({ tag: 'span', field: { value: mockProps.newTaxLabel } }),
        );
    });

    it('should render tooltip trigger containing the formatted new tax price', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.newTouristTaxConverted, {
            currency: mockProps.currency,
        });
    });

    it('should pass tabIndex to TooltipTrigger', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(mockTooltipTriggerProps).toHaveBeenCalledWith(expect.objectContaining({ tabIndex: 0 }));
    });

    it('should render tooltip content', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    it('should render tooltip popup title when provided', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith(
            expect.objectContaining({ field: { value: mockProps.newTaxPopupTitle } }),
        );
    });

    it('should NOT render tooltip popup title when not provided', () => {
        mockProps.newTaxPopupTitle = undefined;
        render(<TouristTaxSummary {...mockProps} />);

        expect(mockRichTextWithLinksProps).not.toHaveBeenCalledWith(
            expect.objectContaining({ className: 'tooltipTitle' }),
        );
    });

    it('should render aria-label on tooltip content div', () => {
        render(<TouristTaxSummary {...mockProps} />);

        expect(
            screen.getByRole('generic', { name: `${mockProps.newTaxPopupTitle} ${mockProps.newTaxPopupContent}` }),
        ).toBeInTheDocument();
    });
});
