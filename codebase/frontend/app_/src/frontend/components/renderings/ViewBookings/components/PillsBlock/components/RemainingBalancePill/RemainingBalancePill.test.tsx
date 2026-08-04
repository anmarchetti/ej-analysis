import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RemainingBalancePill from './RemainingBalancePill';

jest.mock('frontend/utils/tokenizer', () => ({ Tokenizer: { replaceTokens: jest.fn(s => s) } }));

const mockPricePillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/PricePill/PricePill', () => ({ children, ...props }) => {
    mockPricePillComponent(props);

    return <div>{children}</div>;
});

const createProps = () => ({
    value: 100,
    dueDate: '2029-12-12',
    currency: CurrencyCode.GBP,
    className: 'class',
});

let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
        },
        marketStore: {
            formatMoney: jest.fn(a => `£${a}`),
        },
    }),
}));

describe('<RemainingBalancePill />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<RemainingBalancePill {...mockProps} />);

        expect(mockPricePillComponent).toHaveBeenCalledWith({
            isLightRed: true,
            isFullWidth: true,
            className: mockProps.className,
        });
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(SitecoreDictionary.ViewBookingsLabelsRemainingDueDate, {
            [Tokens.Amount]: '£100',
            [Tokens.Date]: '12/12/2029',
        });
        expect(screen.getByText(SitecoreDictionary.ViewBookingsLabelsRemainingDueDate)).toBeInTheDocument();
    });
});
