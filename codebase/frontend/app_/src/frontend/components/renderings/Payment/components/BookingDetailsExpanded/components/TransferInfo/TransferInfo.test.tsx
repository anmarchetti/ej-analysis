import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockTransfer } from 'frontend/__mocks__';
import { ITransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';

import TransferInfo, { ITransferInfoProps } from './TransferInfo';

const createProps = (): ITransferInfoProps => ({
    transfer: mockTransfer,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('frontend/components/icons-new/TaxiFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='taxi-icon'>Taxi Icon</div>,
}));

jest.mock('frontend/components/icons-new/TransferFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='transfer-icon'>Transfer Icon</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TransferInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render SvgTransferFilled for shared transfer type', () => {
        mockProps.transfer = { type: TransferType.Shared, name: 'Shared Transfer' } as ITransfer;
        render(<TransferInfo {...mockProps} />);
        expect(screen.getByTestId('transfer-icon')).toBeInTheDocument();
        expect(screen.getByTestId('transfer-name')).toHaveTextContent('Shared Transfer Luggage.Buttons.Included');
    });

    it('should render SvgTaxiFilled for private transfer type', () => {
        mockProps.transfer = { type: TransferType.Private, name: 'Private Transfer' } as ITransfer;
        render(<TransferInfo {...mockProps} />);
        expect(screen.getByTestId('taxi-icon')).toBeInTheDocument();
        expect(screen.getByTestId('transfer-name')).toHaveTextContent('Private Transfer Luggage.Buttons.Included');
    });

    it('should add textClassName for transfer name', () => {
        mockProps.transfer = { type: TransferType.Private, name: 'Private Transfer' } as ITransfer;
        mockProps.textClassName = 'smallText';
        render(<TransferInfo {...mockProps} />);
        expect(screen.getByTestId('transfer-name')).toHaveClass('smallText');
    });
});
