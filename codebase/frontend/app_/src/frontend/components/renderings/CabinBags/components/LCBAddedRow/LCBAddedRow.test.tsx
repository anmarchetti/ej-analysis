import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';

import LCBAddedRow, { ILCBAddedRowProps } from './LCBAddedRow';

const createProps = (): ILCBAddedRowProps => ({
    fields: mockCabinBagsFields,
    hasLCB: false,
    price: '100',
    removeBag: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn(p => p),
            isTradePortal: false,
            isPricesHidden: false,
            isPostBookingPages: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<LCBAddedRow />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component visible when hasLCB = true', () => {
        mockProps.hasLCB = true;
        const { OverheadBagAddedDropdownLabel, OverheadAddedIcon } = mockCabinBagsFields;

        render(<LCBAddedRow {...mockProps} />);

        const bagsAdded = screen.getByTestId('lcb-price-panel-bags-added');
        expect(bagsAdded).toHaveTextContent(OverheadBagAddedDropdownLabel.value);
        expect(bagsAdded).not.toHaveClass('d-none');
        expect(bagsAdded).toHaveClass('largeBagAdded');

        expect(mockJSSImage).toHaveBeenCalledWith({
            field: OverheadAddedIcon,
            className: 'icon',
            'data-tid': 'overhead-bag-added-icon',
        });

        const removeContainer = screen.getByTestId('remove-container');
        expect(removeContainer).not.toHaveClass('priceContainerCenter');
        expect(removeContainer).toHaveClass('priceContainer');

        const price = screen.getByTestId('lcb-price-panel-price');
        expect(price).toHaveClass('price');
        expect(price).toHaveTextContent('100');

        const removeBtn = screen.getByTestId('remove-btn');
        expect(removeBtn).toHaveClass('removeBtn');
        expect(removeBtn).toHaveTextContent('Globals.Buttons.Remove');
    });

    it('should hide when hasLCB = false', () => {
        render(<LCBAddedRow {...mockProps} />);

        expect(screen.getByTestId('lcb-price-panel-bags-added')).toHaveClass('largeBagAdded d-none');
    });

    it('should call removeBag when click on remove button', async () => {
        render(<LCBAddedRow {...mockProps} />);

        const addBtn = screen.getByTestId('remove-btn');

        await userEvent.click(addBtn);

        expect(mockProps.removeBag).toHaveBeenCalled();
    });

    describe('Price visibility on Trade Portal', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should hide price when it is Trade Portal and isPricesHidden=true', () => {
            mockStores.layoutStore.isPricesHidden = true;

            render(<LCBAddedRow {...mockProps} />);

            expect(screen.queryByTestId('lcb-price-panel-price')).not.toBeInTheDocument();
            expect(screen.getByTestId('remove-container')).toHaveClass('priceContainerCenter');
        });

        it('should show price when it is Trade Portal and isPricesHidden=false', () => {
            render(<LCBAddedRow {...mockProps} />);

            expect(screen.queryByTestId('lcb-price-panel-price')).toBeInTheDocument();
            expect(screen.getByTestId('remove-container')).not.toHaveClass('priceContainerCenter');
        });
    });

    describe('Post Booking Flow', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPostBookingPages = true;
        });

        it('should hide price remove container and apply different styling', () => {
            render(<LCBAddedRow {...mockProps} />);

            expect(screen.queryByTestId('remove-container')).not.toBeInTheDocument();
            expect(screen.getByTestId('lcb-price-panel-bags-added')).toHaveClass('largeBagAddedAlt');
        });
    });

    it('should NOT render "remove cabin bag" container when it is luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<LCBAddedRow {...mockProps} />);

        expect(screen.queryByTestId('remove-container')).not.toBeInTheDocument();
    });

    it('should hide price when price is not defined', () => {
        mockProps.price = undefined;

        render(<LCBAddedRow {...mockProps} />);

        expect(screen.queryByTestId('lcb-price-panel-price')).not.toBeInTheDocument();
    });
});
