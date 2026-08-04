import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TransferItemAmendButton from './TransferItemAmendButton';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage', () => ({
    __esModule: true,
    default: props => {
        mockPriceLabelProps(props);

        return <div data-tid='price-label' />;
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => (
        <button data-tid='amend-transfers-button' {...props}>
            {children}
        </button>
    ),
}));

const createProps = () => ({
    onAmendTransfersClick: jest.fn(),
});
const createStores = () =>
    createMockStores({
        amendTransfersStore: {
            transferStatus: DataStatus.Loaded,
            isAmendPriceEnabledOnViewBookingPage: true,
            upgradePrice: 10,
            isAmendCTADisabled: false,
        },
    });

let props;
let mockStores;

describe('<TransferItemAmendButton />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('AmendUpsellMessage', () => {
        it('Should be rendered', () => {
            render(<TransferItemAmendButton {...props} />);

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(mockPriceLabelProps).toHaveBeenCalledWith({
                price: 10,
                priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeTransfer,
            });
        });

        it('Should NOT be rendered when upgradePrice equal 0', () => {
            mockStores.amendTransfersStore.upgradePrice = 0;
            render(<TransferItemAmendButton {...props} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when not loaded', () => {
            mockStores.amendTransfersStore.transferStatus = DataStatus.Loading;
            render(<TransferItemAmendButton {...props} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when no isAmendPriceEnabledOnViewBookingPage', () => {
            mockStores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage = false;
            render(<TransferItemAmendButton {...props} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });
    });

    it('UpgradeTransfer button should NOT be rendered - cause price', () => {
        mockStores.amendTransfersStore.upgradePrice = 0;
        render(<TransferItemAmendButton {...props} />);

        expect(screen.queryByTestId('amend-transfers-button')).toBeInTheDocument();
        expect(screen.queryByText('ViewBooking.Labels.UpgradeTransfer')).not.toBeInTheDocument();
    });

    it('UpgradeTransfer button should NOT be rendered - not enabled', () => {
        mockStores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage = false;
        render(<TransferItemAmendButton {...props} />);

        expect(screen.queryByTestId('amend-transfers-button')).toBeInTheDocument();
        expect(screen.queryByText('ViewBooking.Labels.UpgradeTransfer')).not.toBeInTheDocument();
    });

    it('UpgradeTransfer button should NOT be rendered - cause transfer status', () => {
        mockStores.amendTransfersStore.transferStatus = DataStatus.Loading;
        render(<TransferItemAmendButton {...props} />);

        expect(screen.queryByTestId('amend-transfers-button')).toBeInTheDocument();
        expect(screen.queryByText('ViewBooking.Labels.UpgradeTransfer')).not.toBeInTheDocument();
    });

    it('Should render all children', () => {
        render(<TransferItemAmendButton {...props} />);

        expect(screen.getByTestId('amend-transfers-button')).toBeInTheDocument();

        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(mockPriceLabelProps).toHaveBeenCalledWith({
            price: 10,
            priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeTransfer,
        });
    });

    it('Should onAmendTransfersClick has been called', () => {
        render(<TransferItemAmendButton {...props} />);

        const button = screen.getByTestId('amend-transfers-button');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(props.onAmendTransfersClick).toHaveBeenCalled();
    });

    it('Should render empty onAmendTransfersClick handler', () => {
        render(<TransferItemAmendButton {...props} onAmendTransfersClick={undefined} />);

        const button = screen.getByTestId('amend-transfers-button');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(props.onAmendTransfersClick).not.toHaveBeenCalled();
    });

    it('Should render disabled button', () => {
        mockStores.amendTransfersStore.isAmendCTADisabled = true;
        render(<TransferItemAmendButton {...props} />);

        const button = screen.getByTestId('amend-transfers-button');
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });
});
