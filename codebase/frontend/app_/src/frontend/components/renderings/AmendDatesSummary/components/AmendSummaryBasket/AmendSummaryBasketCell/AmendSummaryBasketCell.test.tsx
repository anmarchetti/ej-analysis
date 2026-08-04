import React from 'react';
import { render } from '@testing-library/react';

import AmendSummaryBasketCell from './AmendSummaryBasketCell';

const createProps = () => ({
    items: [{ dataTid: 'data-tid', icon: 'icon', name: 'name', key: 'key' }],
    withRightSeparator: true,
});

let mockProps;

jest.mock('./BasketCellItem/BasketCellItem', () => ({
    __esModule: true,
    default: () => <div>BasketCellItem</div>,
}));

describe('<AmendSummaryBasketCell />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Render item with separator', () => {
        const { container, getByText } = render(<AmendSummaryBasketCell {...mockProps} />);

        expect(container.querySelector('.withSeparator')).toBeInTheDocument();
        expect(container.querySelector('.separator')).toBeInTheDocument();
        expect(getByText('BasketCellItem')).toBeInTheDocument();
    });
});
