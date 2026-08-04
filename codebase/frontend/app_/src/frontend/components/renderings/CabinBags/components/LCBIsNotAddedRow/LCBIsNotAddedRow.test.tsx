import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';

import LCBIsNotAddedRow, { ILCBIsNotAddedRowProps } from './LCBIsNotAddedRow';

const createProps = (): ILCBIsNotAddedRowProps => ({
    fields: mockCabinBagsFields,
    hasLCB: false,
    isLackOfCapacity: false,
});

const createStores = () => ({
    layoutStore: {
        isPostBookingPages: false,
    },
});

let mockProps = createProps();
let mockStores = createStores();

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LCBIsNotAddedRow />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should show when hasLCB = false', () => {
        const { OverheadBagDropdownLabel, OverheadIcon } = mockCabinBagsFields;

        render(<LCBIsNotAddedRow {...mockProps} />);

        const noBagsAdded = screen.getByTestId('lcb-price-panel-bags-no-added');
        expect(noBagsAdded).toHaveTextContent(OverheadBagDropdownLabel.value);
        expect(noBagsAdded).not.toHaveClass('d-none');

        expect(mockJSSImage).toHaveBeenCalledWith({
            field: OverheadIcon,
            className: 'icon',
            'data-tid': 'overhead-bag-not-added-icon',
        });

        expect(screen.queryByTestId('lcb-price-panel-bags-no-capacity')).not.toBeInTheDocument();
    });

    it('should hide when hasLCB = true', () => {
        mockProps.hasLCB = true;

        render(<LCBIsNotAddedRow {...mockProps} />);

        expect(screen.getByTestId('lcb-price-panel-bags-no-added')).toHaveClass('d-none');
    });

    it('should NOT return no capacity label when isLackOfCapacity is true on post booking', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        mockProps.isLackOfCapacity = true;

        render(<LCBIsNotAddedRow {...mockProps} />);

        expect(screen.getByTestId('lcb-price-panel-bags-no-added')).toBeInTheDocument();
        expect(screen.queryByTestId('lcb-price-panel-bags-no-capacity')).not.toBeInTheDocument();
    });

    it('should return no capacity label when isLackOfCapacity is true on booking flow', () => {
        mockProps.isLackOfCapacity = true;

        render(<LCBIsNotAddedRow {...mockProps} />);

        const label = screen.getByTestId('lcb-price-panel-bags-no-capacity');
        expect(label).toHaveClass('noCapacity');
        expect(label).toHaveTextContent(mockCabinBagsFields.NoMoreLCBCapacityLabel.value);
    });
});
