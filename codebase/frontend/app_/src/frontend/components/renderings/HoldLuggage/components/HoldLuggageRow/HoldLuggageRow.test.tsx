import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import HoldLuggageRow, { IHoldLuggageRowProps } from './HoldLuggageRow';

const createProps = (): IHoldLuggageRowProps => ({
    title: 'title',
    description: 'description',
    icon: 'icon',
    includedForFreeText: mockSitecoreField('includedForFreeText'),
    price: '£80',
    uniqueId: 'unique-id',
});

const createStores = () => ({
    layoutStore: {
        isTradePortal: false,
        isPricesHidden: true,
        isExtrasPage: true,
        isConfirmationPage: false,
    },
    bookingStore: {
        extraLuggage: {
            canAddHoldLuggage: true,
        },
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <div data-tid='button'>{props.children}</div>;
    },
}));

describe('HoldLuggageRow', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageRow', () => {
        delete mockProps.price;

        render(<HoldLuggageRow {...mockProps} />);

        const component = screen.getByTestId('hold-luggage-row');
        expect(component).toHaveClass('holdLuggageRow');
        expect(component).not.toHaveClass('noBorder');
        expect(component).not.toHaveClass('confirmation');

        expect(screen.getByTestId('image-unique-id')).toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-row-title')).toHaveTextContent('title');
        expect(screen.getByTestId('hold-luggage-row-description')).toHaveTextContent('description');
        expect(screen.getByTestId('hold-luggage-row-included-label')).toHaveTextContent('includedForFreeText');

        expect(screen.queryByTestId('hold-luggage-row-subtitle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-row-price')).not.toBeInTheDocument();
    });

    it('should add noBorder class when canAddHoldLuggage == false ', () => {
        mockStores.bookingStore.extraLuggage.canAddHoldLuggage = false;

        render(<HoldLuggageRow {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-row')).toHaveClass('holdLuggageRow noBorder');
    });

    it("should render subtitle when it's provided", () => {
        mockProps.subtitle = '(1 x Bicycle)';

        render(<HoldLuggageRow {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-row-subtitle')).toHaveTextContent(mockProps.subtitle);
    });

    it("should render price when it's provided", () => {
        mockProps.price = 'CHF+56';
        mockProps.editLabel = 'editLabel';
        mockProps.onEditClick = jest.fn();
        mockStores.layoutStore.isTradePortal = false;

        render(<HoldLuggageRow {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-row-price')).toHaveTextContent(mockProps.price);
        expect(screen.getByTestId('button')).toHaveTextContent(mockProps.editLabel);
        expect(mockButton).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'priceButton',
                onClick: mockProps.onEditClick,
                isText: true,
            }),
        );
    });

    describe('isPriceVisible', () => {
        it('should always render prices of additional luggage and sports equipment when isTradePortal is false', () => {
            render(<HoldLuggageRow {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-row-price-text')).toBeInTheDocument();
            expect(screen.queryByTestId('hold-luggage-row-price-fees')).not.toBeInTheDocument();
        });

        it('should render prices of additional luggage and sports equipment when isTradePortal is true AND isPriceHidden is false', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.layoutStore.isPricesHidden = false;

            render(<HoldLuggageRow {...mockProps} />);

            expect(screen.getByTestId('hold-luggage-row-price-text')).toBeInTheDocument();
        });

        it('should render feesWarning when it is passed', () => {
            mockProps.feesWarning = '(excl. transfer costs)';

            render(<HoldLuggageRow {...mockProps} />);

            const fees = screen.getByTestId('hold-luggage-row-price-fees');

            expect(fees).toHaveTextContent(mockProps.feesWarning);
            expect(fees).toHaveClass('fees');
        });

        it('should NOT render prices of additional luggage and sports equipment when isTradePortal is true AND isPriceHidden is true', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<HoldLuggageRow {...mockProps} />);

            expect(screen.queryByTestId('hold-luggage-row-price-text')).not.toBeInTheDocument();
        });
    });

    it('should NOT render price when isExtrasPage is false', () => {
        mockStores.layoutStore.isExtrasPage = false;

        render(<HoldLuggageRow {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-row-price')).not.toBeInTheDocument();
    });

    it('should NOT render includedForFree and apply styles for confirmation page', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        render(<HoldLuggageRow {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-row')).toHaveClass('confirmation');
        expect(screen.queryByTestId('hold-luggage-row-included-label')).not.toBeInTheDocument();
    });
});
