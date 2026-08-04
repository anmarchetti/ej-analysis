import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import { Transfers } from './Transfers';

let mockStores;

const mockTransferItemProps = jest.fn();
jest.mock('frontend/components/common/Booking/TransferItem/TransferItem', () => ({
    __esModule: true,
    default: ({ onAmendTransfersClick, ...props }) => {
        mockTransferItemProps(props);

        return <div data-tid='transfer-item' onClick={onAmendTransfersClick} />;
    },
}));

const mockIsHolidaysStore = true;
jest.mock('frontend/store/holidays', () => ({
    __esModule: true,
    isHolidayStore: () => mockIsHolidaysStore,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockViewBookingComponentWrapperProps = jest.fn();
jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, children, id }) => {
        mockViewBookingComponentWrapperProps({ dataTid, Title, children, id });

        return (
            <div data-tid={dataTid} id={id}>
                {children}
            </div>
        );
    },
}));

describe('<Transfers />', () => {
    const createProps = () => ({
        startDate: '01/01/2025',
        rendering: {} as any,
        onAmendTransfersClick: jest.fn(),
        transfers: [
            {
                id: '1',
                name: 'name',
                type: TransferType.Shared,
                content: '<ul><li>content</li></ul>',
                iconUrl: 'iconUrl',
                quantity: 1,
            } as ITransfer,
        ],
        isIconOrange: false,
    });

    let props = createProps();

    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            amendTransfersStore: {
                isNoAvailableTransfers: false,
                setIsUnavailableTransferPopupShown: jest.fn(),
            },
        });
    });

    it('should NOT render when transfers array is empty', () => {
        props.transfers = [];
        const { container } = render(<Transfers {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render single transfer', () => {
        render(<Transfers {...props} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                Title: { value: SitecoreDictionary.TransferLabelsTitleTransferSingular },
            }),
        );
        expect(mockTransferItemProps).toHaveBeenCalledWith({
            transfer: props.transfers[0],
            isIconOrange: false,
            showOccupancy: true,
            rendering: props.rendering,
        });
    });

    it('should render multiple transfer', () => {
        props.transfers = [
            { id: '1', name: 'Private', type: TransferType.Private, quantity: 1 },
            { id: '2', name: 'Private', type: TransferType.Private, quantity: 2 },
            { id: '3', name: 'Shared', type: TransferType.Shared, quantity: 4 },
            { id: '4', name: 'Shared', type: TransferType.Shared, quantity: 5 },
            { id: '5', name: 'NoTransfer', type: TransferType.NoTransfer, quantity: 0 },
        ] as ITransfer[];
        render(<Transfers {...props} />);
        const transfers = screen.getAllByTestId('transfer-item');

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                Title: { value: SitecoreDictionary.TransferLabelsTitleTransfersPlural },
            }),
        );
        expect(transfers).toHaveLength(3);
    });

    describe('Click on transfer item', () => {
        it('should handle click on transfer item when isNoAvailableTransfers is false', async () => {
            mockStores.amendTransfersStore.isNoAvailableTransfers = false;

            render(<Transfers {...props} />);

            const transfer = screen.getAllByTestId('transfer-item')[0];

            await userEvent.click(transfer);

            expect(mockStores.amendTransfersStore.setIsUnavailableTransferPopupShown).not.toHaveBeenCalled();
            expect(props.onAmendTransfersClick).toHaveBeenCalled();
        });

        it('should handle click on transfer item when isNoAvailableTransfers is true', async () => {
            mockStores.amendTransfersStore.isNoAvailableTransfers = true;

            render(<Transfers {...props} />);

            const transfer = screen.getAllByTestId('transfer-item')[0];

            await userEvent.click(transfer);

            expect(mockStores.amendTransfersStore.setIsUnavailableTransferPopupShown).toHaveBeenCalledWith(true);
            expect(props.onAmendTransfersClick).not.toHaveBeenCalled();
        });
    });
});
