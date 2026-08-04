import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockAmendDatesStore } from 'frontend/__mocks__';
import { createMockStores as createDefaultMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';

import AmendSummaryBasket from './AmendSummaryBasket';

const createProps = () => ({
    fields: {
        feeLabel: {
            value: 'feeLabel',
        },
        AdditionalCostLabel: mockSitecoreField('AdditionalCostLabel'),
        ChangeFeeLabel: mockSitecoreField('ChangeFeeLabel'),
    },
});

const createMockStores = () =>
    createDefaultMockStores({
        amendDatesStore: {
            ...mockAmendDatesStore,
            extraLuggage: {
                totalHoldLuggageItemsNumber: 2,
            },
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendBasketHeaderPriceProps = jest.fn();
jest.mock('./AmendBasketHeaderPrice/AmendBasketHeaderPrice', () => ({
    __esModule: true,
    default: props => {
        mockAmendBasketHeaderPriceProps(props);

        return <div data-tid='amend-basket-header-price' />;
    },
}));
jest.mock('./AmendSummaryBasketCell/AmendSummaryBasketCell', () => ({
    __esModule: true,
    default: () => <div>AmendSummaryBasketCell</div>,
}));

jest.mock('./AmendSummaryBasket.utils');

describe('<AmendSummaryBasket />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render children components', () => {
        render(<AmendSummaryBasket {...mockProps} />);

        expect(screen.getAllByText('AmendSummaryBasketCell').length).toBe(3);
        expect(screen.getByTestId('amend-basket-header-price')).toBeInTheDocument();
    });

    it('Should render AmendBasketHeaderPrice with calloutProps if they are provided', () => {
        const calloutProps = { position: CalloutPosition.Center, orientation: CalloutOrientation.Bottom };
        mockProps.calloutProps = calloutProps;

        render(<AmendSummaryBasket {...mockProps} />);

        expect(mockAmendBasketHeaderPriceProps).toHaveBeenCalledWith({
            feeLabel: mockProps.fields.ChangeFeeLabel.value,
            additionalCostLabel: mockProps.fields.AdditionalCostLabel.value,
            calloutProps,
        });
    });

    it('Render null when data does not exist', () => {
        mockStores.amendDatesStore.booking = null;
        const { container } = render(<AmendSummaryBasket {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
