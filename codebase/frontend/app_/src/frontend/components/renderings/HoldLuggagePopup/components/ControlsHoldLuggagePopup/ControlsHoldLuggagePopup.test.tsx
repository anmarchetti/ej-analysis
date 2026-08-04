import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';

import { ControlsHoldLuggagePopup, IControlsHoldLuggagePopupProps } from './ControlsHoldLuggagePopup';

jest.mock('frontend/components/icons-new/Minus', () => ({
    __esModule: true,
    default: () => <div>SvgMinus</div>,
}));

jest.mock('frontend/components/icons-new/Plus', () => ({
    __esModule: true,
    default: () => <div>SvgPlus</div>,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

const createProps = (): IControlsHoldLuggagePopupProps => ({
    code: 'LUG',
    isSport: false,
    priceLabel: 'price label',
});

const createStores = () => ({
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
    bookingStore: {
        currency: 'GBP',
        extraLuggage: {
            luggagePrices: {
                LUS: 30,
                LUG: 20,
            },
        },
        holdLuggage: {
            addBag: jest.fn(),
            removeBag: jest.fn(),
            isAddLuggageBtnDisabled: jest.fn(),
            isRemoveLuggageBtnDisabled: jest.fn(),
            selectedLuggage: { LUG: 3 },
            selectedLuggageNumber: 4,
        },
    },
    layoutStore: {
        isTradePortal: false,
        isPricesHidden: false,
        getPhrase: jest.fn(p => p),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ControlsHoldLuggagePopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render nothing when no code provided', () => {
        mockProps.code = undefined;

        const { container } = render(<ControlsHoldLuggagePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render price label', () => {
        render(<ControlsHoldLuggagePopup {...mockProps} />);

        expect(screen.queryByTestId('luggage-price-label')).toHaveTextContent('price label £20');
    });

    it('should NOT render price when isPricesHidden = true on tradePortal ', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.isPricesHidden = true;

        const { queryByTestId } = render(<ControlsHoldLuggagePopup {...mockProps} />);
        expect(queryByTestId('luggage-price-label')).not.toBeInTheDocument();
    });

    it('should have bags-control element', () => {
        render(<ControlsHoldLuggagePopup {...mockProps} />);

        expect(screen.getByTestId('bag-controls')).toBeInTheDocument();
    });

    describe('SvgMinus button', () => {
        it('should be disabled when isRemoveLuggageBtnDisabled is true', () => {
            mockStores.bookingStore.holdLuggage.isRemoveLuggageBtnDisabled = jest.fn(() => true);

            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('remove-bag-btn');

            expect(button).toBeDisabled();
            expect(button).toHaveClass('button');
            expect(button).toHaveClass('buttonDisabled');
        });

        it('should be enabled when isRemoveLuggageBtnDisabled is false', () => {
            mockStores.bookingStore.holdLuggage.isRemoveLuggageBtnDisabled = jest.fn(() => false);

            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('remove-bag-btn');

            expect(button).not.toBeDisabled();
            expect(button).not.toHaveClass('buttonDisabled');
        });

        it('should call removeBag when click on SvgMinus button', async () => {
            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('remove-bag-btn');

            await userEvent.click(button);

            expect(mockStores.bookingStore.holdLuggage.removeBag).toHaveBeenCalledWith(
                mockProps.code,
                mockProps.isSport,
            );
        });
    });

    describe('SvgPlus button', () => {
        it('should be disabled when isAddLuggageBtnDisabled is true', () => {
            mockStores.bookingStore.holdLuggage.isAddLuggageBtnDisabled = jest.fn(() => true);

            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('add-bag-btn');

            expect(button).toBeDisabled();
            expect(button).toHaveClass('button');
            expect(button).toHaveClass('buttonDisabled');
        });

        it('should be enabled when isAddLuggageBtnDisabled is false', () => {
            mockStores.bookingStore.holdLuggage.isAddLuggageBtnDisabled = jest.fn(() => false);

            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('add-bag-btn');

            expect(button).not.toBeDisabled();
            expect(button).not.toHaveClass('buttonDisabled');
        });

        it('should call addBag when click on SvgPlus button', async () => {
            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const button = screen.getByTestId('add-bag-btn');

            await userEvent.click(button);

            expect(mockStores.bookingStore.holdLuggage.addBag).toHaveBeenCalledWith(mockProps.code, mockProps.isSport);
        });
    });

    describe('luggage-item-value input', () => {
        it('should not allow manual entry', () => {
            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const inputElement: HTMLInputElement = screen.getByTestId('luggage-item-value');

            expect(inputElement).toHaveAttribute('readOnly');
            expect(inputElement.value).toBe('3');

            fireEvent.input(inputElement, { target: { value: '123' } });

            expect(inputElement.value).not.toBe('123');
        });

        it('should be 0 if there is no selected luggage for provided luggage code', () => {
            mockProps.code = 'LUS';
            render(<ControlsHoldLuggagePopup {...mockProps} />);

            const inputElement: HTMLInputElement = screen.getByTestId('luggage-item-value');

            expect(inputElement.value).toBe('0');
        });
    });
});
