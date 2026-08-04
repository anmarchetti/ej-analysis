import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomCardAction, { IRoomCardActionProps } from './RoomCardAction';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardActionProps => ({
    price: 20,
    className: 'className',
    isLoading: false,
    isPriceVisible: true,
    isSelected: false,
    noPriceDictionary: SitecoreDictionary.PriceGraphLabelsCurrentPrice,
    onClick: jest.fn(),
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ price, ...props }) => {
        mockPriceLabelProps(props);

        return <div data-tid='price-label'>{price}</div>;
    },
}));

const mockBlockSelected = jest.fn();
jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: props => {
        mockBlockSelected(props);

        return <div data-tid='block-selected' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return (
            <div data-tid='button' onClick={onClick}>
                {children}
            </div>
        );
    },
}));

describe('<RoomCardAction />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomCardAction {...mockProps} />);

        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('room-card-action')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.AlternativeFlightsButtonsSelect)).not.toBeInTheDocument();
        expect(screen.queryByTestId('block-selected')).not.toBeInTheDocument();

        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'cta',
            dataTid: 'select-room-button',
            disabled: false,
            isLoading: false,
            isMedium: true,
            isFullWidth: true,
            'aria-label': '+ £20',
        });
        expect(screen.getByTestId('room-price')).toBeInTheDocument();
        expect(screen.getByTestId('room-price-postfix')).toBeInTheDocument();
        expect(mockPriceLabelProps).toHaveBeenCalledWith({
            tag: 'span',
        });
    });

    it('Should render default noPriceDictionary prop', async () => {
        mockProps.noPriceDictionary = undefined;
        mockProps.isPriceVisible = false;

        render(<RoomCardAction {...mockProps} />);

        expect(screen.queryByText(SitecoreDictionary.AlternativeFlightsButtonsSelect)).toBeInTheDocument();
    });

    it("Should NOT render pricePostfix when it hasn't been provided", () => {
        mockProps.pricePostfix = undefined;

        render(<RoomCardAction {...mockProps} />);

        expect(screen.queryByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).not.toBeInTheDocument();
    });

    it('Should capture onClick prop', async () => {
        render(<RoomCardAction {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('Should NOT render price label, but render default dictionary instead', async () => {
        mockProps.isPriceVisible = undefined;

        render(<RoomCardAction {...mockProps} />);

        expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.PriceGraphLabelsCurrentPrice)).toBeInTheDocument();
    });

    it('Should render Selected block when isSelected prop provided', () => {
        mockProps.isSelected = true;
        render(<RoomCardAction {...mockProps} />);

        expect(screen.queryByTestId('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('block-selected')).toBeInTheDocument();
        expect(mockBlockSelected).toHaveBeenCalledWith({
            siteCoreKey: SitecoreDictionary.RoomTypesLabelsSelected,
            className: 'selectedCta',
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardAction {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
