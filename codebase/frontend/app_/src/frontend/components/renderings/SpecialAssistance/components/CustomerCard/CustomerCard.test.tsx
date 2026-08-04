import React from 'react';
import { render, screen } from '@testing-library/react';

import CustomerCard, { ICustomerCardFields } from './CustomerCard';

const createProps = (): ICustomerCardFields => ({
    customerName: 'John Doe',
    description: 'Assistance description',
});
let mockProps = createProps();

describe('<CustomerCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should  render component', () => {
        render(<CustomerCard {...mockProps} />);

        expect(screen.getByTestId('customer-card')).toHaveClass('customerCard');
        expect(screen.getByText(mockProps.customerName)).toBeInTheDocument();
        expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    });
});
