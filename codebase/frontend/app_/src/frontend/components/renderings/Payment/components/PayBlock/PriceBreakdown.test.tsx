import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceBreakdown from './PriceBreakdown';

describe('<PriceBreakdown />', () => {
    const formatMoneyMock = jest.fn();
    const getPhraseMock = jest.fn();

    beforeEach(() => {
        formatMoneyMock.mockReturnValue('£100');
        getPhraseMock.mockReturnValue('Holiday Credit');
    });

    it('should render both amount and credit blocks when values are defined', () => {
        render(
            <PriceBreakdown
                amount={200}
                usedCredit={50}
                currency={CurrencyCode.GBP}
                formatMoney={formatMoneyMock}
                getPhrase={getPhraseMock}
                amountLabel='Holiday'
            />,
        );

        expect(screen.getByText('Holiday')).toBeInTheDocument();
        expect(screen.getByText('Holiday Credit')).toBeInTheDocument();
        expect(screen.getAllByText('£100').length).toBeGreaterThan(0);
    });

    it('should render only credit block when amount is 0', () => {
        render(
            <PriceBreakdown
                amount={0}
                usedCredit={20}
                currency={CurrencyCode.GBP}
                formatMoney={formatMoneyMock}
                getPhrase={getPhraseMock}
            />,
        );

        expect(screen.getByText('Holiday Credit')).toBeInTheDocument();
        expect(screen.queryByText('Holiday')).not.toBeInTheDocument();
    });

    it('should return null if credit is 0 or undefined', () => {
        const { container } = render(
            <PriceBreakdown
                amount={100}
                usedCredit={0}
                currency={CurrencyCode.GBP}
                formatMoney={formatMoneyMock}
                getPhrase={getPhraseMock}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should return null if currency is undefined', () => {
        const { container } = render(
            <PriceBreakdown
                amount={100}
                usedCredit={30}
                currency={undefined}
                formatMoney={formatMoneyMock}
                getPhrase={getPhraseMock}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should use getPhrase with correct key', () => {
        render(
            <PriceBreakdown
                amount={100}
                usedCredit={30}
                currency={CurrencyCode.GBP}
                formatMoney={formatMoneyMock}
                getPhrase={getPhraseMock}
            />,
        );

        expect(getPhraseMock).toHaveBeenCalledWith(SitecoreDictionary.PaymentLabelsHolidayCredit);
    });
});
