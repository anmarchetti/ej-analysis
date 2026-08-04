import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking, mockTransfer, mockTransfersWithAmendmentCharges } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendTransferPopup, { ITransferPopupProps } from './AmendTransferPopup';

let mockProps: ITransferPopupProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseMobileViewport = false;
jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockAmendPopupProps = jest.fn();
jest.mock('frontend/components/common/AmendEntityPopup/AmendEntityPopup', () => ({
    __esModule: true,
    default: ({ children, onClose, onConfirm, ...props }) => {
        mockAmendPopupProps(props);

        return (
            <div data-tid='amend-popup'>
                {children}
                <div data-tid='amend-popup-close' onClick={onClose} />
                <div data-tid='amend-popup-confirm' onClick={onConfirm} />
            </div>
        );
    },
}));

const mockTransferCardProps = jest.fn();
jest.mock('frontend/components/renderings/AmendTransfers/components/AmendTransferCard', () => ({
    __esModule: true,
    default: ({ onSelect, ...props }) => {
        mockTransferCardProps(props);

        return <div data-tid='transfer-card' onClick={onSelect} />;
    },
}));

const mockTransferShimmerProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendTransfers/components/AmendTransfersShimmer/AmendTransfersShimmer',
    () => ({
        __esModule: true,
        default: props => {
            mockTransferShimmerProps(props);

            return <div data-tid='transfer-shimmer' />;
        },
    }),
);

describe('<AmendTransferPopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: {
                TransferPopupAltOptionsSingle: mockSitecoreField('AltTransferTitleSingle'),
                TransferPopupAltOptionsPlural: mockSitecoreField('AltTransfersTitlePlural'),
                TransferPopupChosenTitle: mockSitecoreField('ChosenTransferTitle'),
                TransferPopupSubtitle: mockSitecoreField('Subtitle'),
                TransferPopupTitle: mockSitecoreField('Title'),
            },
            initialTransfer: mockTransfer,
            isLoading: false,
            onClose: jest.fn(),
            onConfirm: jest.fn(),
            altTransfers: [
                {
                    ...mockTransfersWithAmendmentCharges[0],
                    transfer: {
                        ...mockTransfersWithAmendmentCharges[0].transfer,
                        code: 'X9099191BERS12',
                    },
                },
                mockTransfersWithAmendmentCharges[1],
            ],
        };
        mockStores = createMockStores({
            viewBookingStore: {
                booking: mockBooking,
            },
        });
    });

    it('should render component', () => {
        render(<AmendTransferPopup {...mockProps} />);

        expect(screen.getByTestId('amend-popup')).toBeInTheDocument();
        expect(mockAmendPopupProps).toHaveBeenCalledWith({
            title: mockProps.fields!.TransferPopupTitle,
            subtitle: mockProps.fields!.TransferPopupSubtitle,
            tidPrefix: 'change-hotel',
            contentClassName: 'content',
            isConfirmDisabled: true,
        });
        expect(screen.getAllByTestId('transfer-card')).toHaveLength(3);
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(1, {
            transfer: mockProps.initialTransfer,
            isSelected: true,
            revertPrice: 0,
            contentClassName: 'cardContent',
            className: 'transferCard',
            isAmendAppearance: true,
            currency: 'GBP',
        });
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(2, {
            transfer: mockProps.altTransfers![0].transfer,
            contentClassName: 'cardContent',
            className: 'transferCard',
            currency: 'GBP',
            isAmendAppearance: true,
            isSelected: false,
            amendCharge: 13,
        });
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(3, {
            transfer: mockProps.altTransfers![1].transfer,
            isAmendAppearance: true,
            isSelected: false,
            amendCharge: 0,
            contentClassName: 'cardContent',
            className: 'transferCard',
            currency: 'GBP',
        });

        expect(screen.getByText('ChosenTransferTitle')).toBeInTheDocument();
        expect(screen.getByText('AltTransfersTitlePlural 2')).toBeInTheDocument();
        expect(screen.queryByTestId('transfer-shimmer')).not.toBeInTheDocument();
        expect(mockReplaceToken).toHaveBeenCalledWith('AltTransfersTitlePlural', Tokens.Amount, '2');
    });

    it('should render shimmer when isLoading prop has been passed', () => {
        mockProps.isLoading = true;

        render(<AmendTransferPopup {...mockProps} />);

        expect(screen.getByTestId('transfer-shimmer')).toBeInTheDocument();
        expect(screen.queryByTestId('transfer-card')).not.toBeInTheDocument();
    });

    it('should render component with no altTransfers', () => {
        mockProps.altTransfers = undefined;

        render(<AmendTransferPopup {...mockProps} />);

        expect(screen.getAllByTestId('transfer-card')).toHaveLength(1);
    });

    it('should render component with 1 alternative option', () => {
        mockProps.altTransfers = [mockTransfersWithAmendmentCharges[0]];

        render(<AmendTransferPopup {...mockProps} />);

        expect(screen.getByText('AltTransferTitleSingle 1')).toBeInTheDocument();
        expect(mockReplaceToken).toHaveBeenCalledWith('AltTransferTitleSingle', Tokens.Amount, '1');
    });

    it('should select transfer by click on a card', async () => {
        render(<AmendTransferPopup {...mockProps} />);

        const selectBtn = screen.getAllByTestId('transfer-card')[1];

        await userEvent.click(selectBtn);
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(
            4,
            expect.objectContaining({
                transfer: mockProps.initialTransfer,
                isSelected: false,
                revertPrice: -13,
            }),
        );
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(
            5,
            expect.objectContaining({
                transfer: mockProps.altTransfers![0].transfer,
                isSelected: true,
                amendCharge: 13,
            }),
        );
    });

    it('should select transfer by click on a initial transfer card', async () => {
        render(<AmendTransferPopup {...mockProps} />);

        const selectInitBtn = screen.getAllByTestId('transfer-card')[0];
        const selectAltBtn = screen.getAllByTestId('transfer-card')[1];

        await userEvent.click(selectAltBtn);
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(
            4,
            expect.objectContaining({
                transfer: mockProps.initialTransfer,
                isSelected: false,
                revertPrice: -13,
            }),
        );

        await userEvent.click(selectInitBtn);
        expect(mockTransferCardProps).toHaveBeenNthCalledWith(
            7,
            expect.objectContaining({
                transfer: mockProps.initialTransfer,
                isSelected: true,
                revertPrice: 0,
            }),
        );
    });

    describe('Confirm call', () => {
        it('should cal onConfirm and onClose props', async () => {
            render(<AmendTransferPopup {...mockProps} />);

            const confirmBtn = screen.getByTestId('amend-popup-confirm');
            const selectBtn = screen.getAllByTestId('transfer-card')[2];

            await userEvent.click(selectBtn);

            await userEvent.click(confirmBtn);
            expect(mockProps.onConfirm).toHaveBeenCalledWith(mockProps.altTransfers![1]);
            expect(mockProps.onClose).toHaveBeenCalled();
        });
    });

    describe('should NOT render component', () => {
        it('should NOT render component if no fields', () => {
            mockProps.fields = undefined;

            const { container } = render(<AmendTransferPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should NOT render component if no initialTransfer', () => {
            mockProps.initialTransfer = undefined;

            const { container } = render(<AmendTransferPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });
});
