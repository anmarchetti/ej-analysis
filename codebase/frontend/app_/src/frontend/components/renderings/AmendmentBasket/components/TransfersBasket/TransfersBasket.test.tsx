import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockTransfer } from 'frontend/__mocks__';

import TransfersBasket from './TransfersBasket';

describe('<TransfersBasket /> ', () => {
    it('Should render passed props', () => {
        const { container } = render(<TransfersBasket transfer={mockTransfer} />);

        expect(screen.getByText(mockTransfer.name)).toBeInTheDocument();
        expect(container.querySelector('.card__icon')).toHaveStyle(`background-image: url(${mockTransfer.iconUrl});`);
    });

    it('Should NOT render when transfer is undefined', () => {
        const { container } = render(<TransfersBasket transfer={undefined} />);

        expect(screen.queryByText(mockTransfer.name)).not.toBeInTheDocument();
        expect(container.querySelector('card__icon')).not.toBeInTheDocument();
    });
});
