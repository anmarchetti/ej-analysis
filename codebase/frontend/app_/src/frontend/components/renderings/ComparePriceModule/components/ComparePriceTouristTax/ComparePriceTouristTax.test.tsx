import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import ComparePriceTouristTax from './ComparePriceTouristTax';

const createProps = () => ({
    label: 'Tourist Tax Label',
    isPriceGraphView: false,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    TouristTaxGenericTooltip: ({ children, triggerClassName }) => (
        <div data-tid='tourist-tax-tooltip' className={triggerClassName}>
            {children}
        </div>
    ),
}));

describe('<ComparePriceTouristTax />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isTouristTaxEnabled: true },
        });
    });

    it('should NOT render when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;

        const { container } = render(<ComparePriceTouristTax {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when label is missing', () => {
        mockProps.label = '';

        const { container } = render(<ComparePriceTouristTax {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when label is undefined', () => {
        mockProps.label = undefined;

        const { container } = render(<ComparePriceTouristTax {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render', () => {
        render(<ComparePriceTouristTax {...mockProps} />);

        expect(screen.getByText('Tourist Tax Label')).toBeInTheDocument();
        expect(screen.getByTestId('tourist-tax-tooltip')).toBeInTheDocument();
    });

    it('should render with graph wrapper class when isPriceGraphView is true', () => {
        mockProps.isPriceGraphView = true;

        render(<ComparePriceTouristTax {...mockProps} />);

        expect(screen.getByTestId('compare-price-tourist-tax-wrapper')).toHaveClass('graphWrapper');
    });

    it('should NOT render graph wrapper class when isPriceGraphView is false', () => {
        mockProps.isPriceGraphView = false;

        render(<ComparePriceTouristTax {...mockProps} />);

        expect(screen.queryByTestId('compare-price-tourist-tax-wrapper')).not.toHaveClass('graphWrapper');
    });
});
