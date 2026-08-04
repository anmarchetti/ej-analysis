import React from 'react';
import { render, screen } from '@testing-library/react';

import AmendSummaryBasketCellItem from './BasketCellItem';

const createProps = () => ({
    dataTid: 'data-tid',
    icon: 'icon',
    name: 'name',
    key: 'key',
});

let mockProps;

describe('<AmendSummaryBasketCellItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Render passed props', () => {
        render(<AmendSummaryBasketCellItem {...mockProps} />);

        expect(screen.getByTestId('data-tid')).toBeInTheDocument();
        expect(screen.getByText('icon')).toBeInTheDocument();
        expect(screen.getByText('name')).toBeInTheDocument();
    });
});
