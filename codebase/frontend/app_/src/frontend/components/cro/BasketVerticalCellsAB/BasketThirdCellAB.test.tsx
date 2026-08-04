import * as React from 'react';
import { configure, render, screen } from '@testing-library/react';

import * as luggageUtils from 'frontend/utils/luggage.utils';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { BasketThirdCellAB, IBasketThirdCellABProps } from './BasketThirdCellAB';

configure({ testIdAttribute: 'data-tid' });

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isATOLProtectionEnabled: true },
    bookingStore: {
        transfer: null as Nullable<ITransfer>,
        defaultTransferFromUrl: '1',
        selectedTransferCode: '2',
        extraLuggage: {
            totalHoldLuggageItemsNumber: 5,
        },
    },
    guestDetailsStore: {
        infants: [{ value: 'infant 1' }, { value: 'infant 2' }],
    },
});

const createProps = (): IBasketThirdCellABProps => ({
    className: '',
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    getHoldItemsLabel: jest.fn().mockReturnValue('getHoldItemsLabel result'),
}));

describe('<BasketThirdCell  />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render with className when className prop is defined', () => {
        mockProps.className = 'third';
        render(<BasketThirdCellAB {...mockProps} />);

        expect(screen.getByTestId('third-cell')).toBeInTheDocument();
    });

    it('should render correct luggage info', () => {
        const { queryByTestId } = render(<BasketThirdCellAB {...mockProps} />);

        expect(luggageUtils.getHoldItemsLabel).toHaveBeenCalledWith(7, mockStores.layoutStore.getPhrase);
        expect(queryByTestId('luggage')).toHaveTextContent('getHoldItemsLabel result');
    });

    describe('Transfer', () => {
        it('should NOT render any transfer item when transfer is hidden', () => {
            mockStores.bookingStore.transfer = { isHidden: true } as Nullable<ITransfer>;
            render(<BasketThirdCellAB {...mockProps} />);

            expect(screen.queryByTestId('transfer-shared')).not.toBeInTheDocument();
            expect(screen.queryByTestId('transfer-private')).not.toBeInTheDocument();
        });

        describe('Shared transfer', () => {
            beforeEach(() => {
                mockStores.bookingStore.transfer = { type: TransferType.Shared } as Nullable<ITransfer>;
            });

            it('should render TransferLabelsSelected label when selectedTransferCode is not equal with defaultTransferFromUrl and transfer is shared', () => {
                render(<BasketThirdCellAB {...mockProps} />);

                expect(screen.queryByTestId('transfer-shared')).toHaveTextContent(
                    SitecoreDictionary.TransferLabelsSelected,
                );
            });

            it('should render TransferLabelsIncluded label when selectedTransferCode the same as defaultTransferFromUrl and transfer is shared', () => {
                mockStores.bookingStore.selectedTransferCode = '1';
                render(<BasketThirdCellAB {...mockProps} />);

                expect(screen.queryByTestId('transfer-shared')).toHaveTextContent(
                    SitecoreDictionary.TransferLabelsIncluded,
                );
            });
        });

        describe('Private transfer', () => {
            it('should render TransferLabelsPrivateTransfer label when transfer is private', () => {
                mockStores.bookingStore.transfer = { type: TransferType.Private } as Nullable<ITransfer>;
                render(<BasketThirdCellAB {...mockProps} />);

                expect(screen.queryByTestId('transfer-private')).toHaveTextContent(
                    SitecoreDictionary.TransferLabelsPrivateTransfer,
                );
            });
        });
    });

    it('should render HotelDetailsLabelsAtolProtected label', () => {
        render(<BasketThirdCellAB {...mockProps} />);

        expect(screen.queryByTestId('atol-protected')).toHaveTextContent(
            SitecoreDictionary.HotelDetailsLabelsAtolProtected,
        );
        expect(screen.queryByTestId('atol-protected')).toHaveClass('list-item--icon list-item--no-icon');
    });

    it('should not render ATOL label when ATOL is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;
        render(<BasketThirdCellAB {...mockProps} />);

        expect(screen.queryByTestId('atol-protected')).not.toBeInTheDocument();
    });
});
