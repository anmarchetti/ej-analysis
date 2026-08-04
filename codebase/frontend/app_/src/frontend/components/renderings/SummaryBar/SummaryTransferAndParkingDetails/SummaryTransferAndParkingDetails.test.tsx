import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

import SummaryTransferAndParkingDetails from './SummaryTransferAndParkingDetails';

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

const mockSummaryEditButton = jest.fn();
jest.mock('frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton', () => ({
    __esModule: true,
    default: ({ dataTid, scrollAnchorId, onClick, isHidden }) => {
        mockSummaryEditButton(isHidden);

        return (
            <button data-tid={dataTid} data-scroll-anchor-id={scrollAnchorId} onClick={onClick}>
                Edit
            </button>
        );
    },
}));

const createProps = (): ISummaryBarSitecoreFields => ({
    ...mockSummaryBarSitecoreFields,
});

const createStores = (
    transfer = {
        name: 'Shared Transfer',
        price: 15,
        code: '0',
    },
    selectedAirportParking = {
        title: 'Airport Parking',
        bookingDetails: {
            totalPrice: 130,
        },
    },
    transfers = [
        { name: 'Transfer 1', code: '1' },
        { name: 'Transfer 2', code: '2' },
    ],
    isExternalExtrasEnabled: boolean = false,
    airportParkings: IAirportParking[] | null = [],
) =>
    createMockStores({
        bookingStore: {
            transfer,
            packageInfo: {
                paymentInfo: {
                    currency: 'GBP',
                },
            },
            transfers,
        },
        airportParkingStore: {
            selectedAirportParking,
            airportParkings,
        },
        marketStore: {
            formatMoney: jest.fn((amount: number) => `£${amount}`),
        },
        layoutStore: {
            isExternalExtrasEnabled,
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SummaryTransferAndParking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();

        mockContainsLuxuryPromoCode = false;
        mockSummaryEditButton.mockClear();
    });

    it('should NOT render when DisableTransferAndParking is true', () => {
        mockProps.DisableTransferAndParking = { value: true };

        const { container } = render(<SummaryTransferAndParkingDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should display the title', () => {
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-title')).toHaveTextContent('TransferAndParkingTitle');
    });

    it('should NOT display transfer if none', () => {
        mockStores.bookingStore.transfer = null;
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-transfer-name')).not.toBeInTheDocument;
    });

    it('should display transfer if any', () => {
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-transfer-name')).toHaveTextContent('Shared Transfer');
    });

    it('should display parking', () => {
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-parking-name')).toHaveTextContent('Airport Parking');
        expect(screen.queryByTestId('transfer-and-parking-details-parking-cost')).toHaveTextContent('£130');
    });

    it('should NOT display parking if no available data', () => {
        mockStores.airportParkingStore.selectedAirportParking = null;
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-parking-name')).not.toBeInTheDocument();
        expect(screen.queryByTestId('transfer-and-parking-details-parking-cost')).not.toBeInTheDocument();
    });

    it('should NOT render the transfer and parking details if there is no parking nor transfer', () => {
        mockStores.airportParkingStore.selectedAirportParking = null;
        mockStores.bookingStore.transfer = null;
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details')).not.toBeInTheDocument();
    });

    it('should not render the parking details if the airportParkingStore is not available', () => {
        mockStores.airportParkingStore = undefined;
        render(<SummaryTransferAndParkingDetails {...mockProps} />);
        expect(screen.queryByTestId('transfer-and-parking-details-parking-name')).not.toBeInTheDocument();
        expect(screen.queryByTestId('transfer-and-parking-details-parking-cost')).not.toBeInTheDocument();
    });

    it('should render edit button with correct scroll anchor', () => {
        render(<SummaryTransferAndParkingDetails {...mockProps} />);

        expect(screen.getByTestId('transfer-and-parking-edit')).toHaveAttribute(
            'data-scroll-anchor-id',
            ScrollAnchorId.Transfer,
        );
    });

    it('should pass onEditClick to edit button', () => {
        const mockOnEditClick = jest.fn();

        render(<SummaryTransferAndParkingDetails {...mockProps} onEditClick={mockOnEditClick} />);

        const editButton = screen.getByTestId('transfer-and-parking-edit');
        editButton.click();

        expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    describe('Edit button visibility based on alternatives', () => {
        const mockTransfer = { name: 'Shared Transfer', price: 15, code: '0' };
        const mockParking = { title: 'Airport Parking', bookingDetails: { totalPrice: 130 } };

        it('should hide edit button when no transfer or parking options', () => {
            mockStores = createStores(mockTransfer, mockParking, [], false, []);

            render(<SummaryTransferAndParkingDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should show edit button when multiple transfer alternatives exist', () => {
            mockStores = createStores(
                mockTransfer,
                mockParking,
                [
                    { name: 'Transfer 1', code: '1' },
                    { name: 'Transfer 2', code: '2' },
                ],
                false,
                [],
            );

            render(<SummaryTransferAndParkingDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });

        it('should show edit button when parking is available and enabled', () => {
            mockStores = createStores(mockTransfer, mockParking, [], true, [{ title: 'Parking 1' } as IAirportParking]);

            render(<SummaryTransferAndParkingDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });

        it('should hide edit button when parking exists but feature is disabled', () => {
            mockStores = createStores(mockTransfer, mockParking, [], false, [
                { title: 'Parking 1' } as IAirportParking,
            ]);

            render(<SummaryTransferAndParkingDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should hide edit button when EnableEditButtons is false', () => {
            mockProps.EnableEditButtons = mockSitecoreField(false);
            mockStores = createStores(
                mockTransfer,
                mockParking,
                [
                    { name: 'Transfer 1', code: '1' },
                    { name: 'Transfer 2', code: '2' },
                ],
                true,
                [{ title: 'Parking 1' } as IAirportParking],
            );

            render(<SummaryTransferAndParkingDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });
    });
});
