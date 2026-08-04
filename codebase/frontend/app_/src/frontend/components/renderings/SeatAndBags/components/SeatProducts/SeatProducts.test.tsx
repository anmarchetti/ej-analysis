import * as React from 'react';
import { render } from '@testing-library/react';

import SeatProducts from './SeatProducts';

jest.mock('frontend/components/renderings/SeatAndBags/components/SeatBag', () => ({
    __esModule: true,
    default: ({ text }) => (
        <div className='seat-bag' data-tid={text}>
            SeatBag {text}
        </div>
    ),
}));

describe('<SeatProducts />', () => {
    const createProps = () => ({
        products: [
            {
                id: 'Product1',
                name: 'Product1',
            },
            {
                id: 'Product2',
                name: 'Product2',
            },
            {
                id: 'Product1',
                name: 'Product1',
            },
        ],
    });

    let mockProps;

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render 2 seat bags', () => {
        const { getByTestId, container } = render(<SeatProducts {...mockProps} />);

        expect(container.querySelectorAll('.seat-bag')).toHaveLength(2);
        expect(getByTestId('Product1')).toHaveTextContent('SeatBag Product1');
        expect(getByTestId('Product2')).toHaveTextContent('SeatBag Product2');
    });

    it('should NOT render component when no products', () => {
        mockProps.products = [];
        const { container } = render(<SeatProducts {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
