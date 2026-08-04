import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode, SignDisplay } from 'code/currency';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { mockHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import { HoldLuggageInfoLabel, THoldLuggageInfoLabelProps } from './HoldLuggageInfoLabel';

const createProps = (): THoldLuggageInfoLabelProps => ({
    isMobileContent: false,
    NoLuggageAddedLabel: mockHoldLuggagePopupFields.NoLuggageAddedLabel,
    LuggageAddedLabel: mockHoldLuggagePopupFields.LuggageAddedLabel,
});

const createStores = () => ({
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
    bookingStore: {
        currency: CurrencyCode.GBP,
        holdLuggage: {
            selectedTotalNumber: 2,
            selectedLuggageTotalPrice: 300,
        },
    },
    layoutStore: {
        isTradePortal: false,
        isPricesHidden: false,
    },
});

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

describe('HoldLuggageInfoLabel', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render LuggageAddedLabel with total price when selectedTotalNumber != 0', () => {
        render(<HoldLuggageInfoLabel {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-info-label')).toHaveClass('infoLabel');
        expect(screen.getByTestId('hold-luggage-info-label')).not.toHaveClass('mobileInfoLabel');

        expect(screen.queryByText('LuggageAddedLabel 2')).toBeInTheDocument();
        expect(screen.queryByText('£300')).toBeInTheDocument();
        expect(screen.queryByText('NoLuggageAddedLabel')).not.toBeInTheDocument();
        expect(screen.queryByText('£0')).not.toBeInTheDocument();

        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(
            mockStores.bookingStore.holdLuggage.selectedLuggageTotalPrice,
            {
                currency: mockStores.bookingStore.currency,
                signDisplay: SignDisplay.Always,
            },
        );
    });

    it('should render NoLuggageAddedLabel when selectedTotalNumber == 0', () => {
        mockStores.bookingStore.holdLuggage.selectedTotalNumber = 0;
        mockStores.bookingStore.holdLuggage.selectedLuggageTotalPrice = 0;

        render(<HoldLuggageInfoLabel {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-info-label')).toHaveClass('infoLabel');

        expect(screen.queryByText('NoLuggageAddedLabel')).toBeInTheDocument();
        expect(screen.queryByText('£0')).toBeInTheDocument();
        expect(screen.queryByText('LuggageAddedLabel 2')).not.toBeInTheDocument();
        expect(screen.queryByText('£300')).not.toBeInTheDocument();

        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(
            mockStores.bookingStore.holdLuggage.selectedLuggageTotalPrice,
            {
                currency: mockStores.bookingStore.currency,
                signDisplay: SignDisplay.Always,
            },
        );
    });

    it('should have mobileInfoLabel class when it is mobile', () => {
        mockProps.isMobileContent = true;

        render(<HoldLuggageInfoLabel {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-info-label')).toHaveClass('mobileInfoLabel');
    });

    it('should NOT render price when isPricesHidden = true on tradePortal ', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.isPricesHidden = true;

        const { queryByTestId } = render(<HoldLuggageInfoLabel {...mockProps} />);
        expect(queryByTestId('hold-luggage-info-label-price')).not.toBeInTheDocument();
    });
});
