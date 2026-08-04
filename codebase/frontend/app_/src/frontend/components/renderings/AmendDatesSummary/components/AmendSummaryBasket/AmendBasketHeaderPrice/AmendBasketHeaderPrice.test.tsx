import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import AmendBasketHeaderPrice from './AmendBasketHeaderPrice';

const createProps = () => ({
    feeLabel: 'feeLabel',
    totalCostLabel: 'totalCostLabel',
    additionalCostLabel: 'additionalCostLabel',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummaryFee/AmendDatesSummaryFee',
    () => ({
        __esModule: true,
        default: () => <div>AmendDatesSummaryFee</div>,
    }),
);

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCalloutProps(props);

        return <div data-tid='callout' />;
    },
}));

describe('<AmendBasketHeaderPrice />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render content', () => {
        mockStores.amendDatesStore.offerPrices!.amendmentDatesCharges = 10.01;
        render(<AmendBasketHeaderPrice {...mockProps} />);

        expect(screen.getByText('additionalCostLabel')).toBeInTheDocument();
        expect(screen.getByText('£10.01')).toBeInTheDocument();
        expect(screen.getByText('AmendDatesSummaryFee')).toBeInTheDocument();
        expect(screen.getByTestId('basket-additional-price')).toBeInTheDocument();
    });

    it('Render Callout if calloutProps are provided', () => {
        mockProps.calloutProps = { position: CalloutPosition.Center, orientation: CalloutOrientation.Bottom };
        render(<AmendBasketHeaderPrice {...mockProps} />);

        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith(mockProps.calloutProps);
    });
});
