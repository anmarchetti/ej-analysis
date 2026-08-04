import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores as createDefaultMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';

import AmendDatesSummaryFee from './AmendDatesSummaryFee';

const createMockStores = () => createDefaultMockStores({ amendDatesStore: deepClone(mockAmendDatesStore) });

const createProps = () => ({
    feeLabel: `${Tokens.Amount} feeLabel`,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendDatesSummaryFee />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render fee label with price', () => {
        render(<AmendDatesSummaryFee {...mockProps} />);

        expect(screen.getByText('+ £30 feeLabel')).toBeInTheDocument();
    });

    it('Render null if no fee price for offer', () => {
        mockStores.amendDatesStore.offerPrices.amendmentDatesFees = undefined;
        const { container } = render(<AmendDatesSummaryFee {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
