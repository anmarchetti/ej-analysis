import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';

import IncludedBagsRow, { IIncludedBagsRowProps } from './IncludedBagsRow';

const createProps = (): IIncludedBagsRowProps => ({
    fields: mockCabinBagsFields,
    withInfant: false,
});

let mockProps = createProps();

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<IncludedBagsRow />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component without infant', () => {
        const { SmallBagDropdownLabel, IncludedIcon } = mockCabinBagsFields;

        render(<IncludedBagsRow {...mockProps} />);

        const includedBags = screen.getByTestId('lcb-price-panel-included-bags');
        expect(includedBags).toHaveTextContent(SmallBagDropdownLabel.value);
        expect(includedBags).toHaveClass('includedBag');
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: IncludedIcon,
            className: 'icon',
            'data-tid': 'included-bag-icon',
        });
    });

    it('should render component with infant', () => {
        const { SmallBagDropdownWithInfantLabel } = mockCabinBagsFields;

        mockProps.withInfant = true;

        render(<IncludedBagsRow {...mockProps} />);

        expect(screen.getByTestId('small-bag-dropdown-label')).toHaveTextContent(SmallBagDropdownWithInfantLabel.value);
    });
});
