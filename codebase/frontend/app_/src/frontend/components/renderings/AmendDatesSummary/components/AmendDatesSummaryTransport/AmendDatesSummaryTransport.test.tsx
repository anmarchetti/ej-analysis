import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';

import AmendDatesSummaryTransport from './AmendDatesSummaryTransport';

const createProps = () => ({
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    title: mockSitecoreField('title'),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSummaryExpand = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockSummaryExpand(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockEditBtn = jest.fn();
jest.mock('frontend/components/common/AmendSummary/EditButton/EditButton', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockEditBtn(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                edit-btn
            </button>
        );
    },
}));

const mockTransferDuration = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration', () => ({
    __esModule: true,
    default: props => {
        mockTransferDuration(props);

        return <div data-tid='transfer-duration' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return (
            <button data-tid='popup-placeholder' onClick={props.onClose}>
                popup
            </button>
        );
    },
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendUpsellMessage/AmendUpsellMessage', () => ({
    __esModule: true,
    default: props => {
        mockPriceLabelProps(props);

        return <div data-tid='price-label' />;
    },
}));

describe('<AmendDatesSummaryTransport />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendDatesStore: mockAmendDatesStore,
            amendTransfersStore: {
                isAmendPriceEnabledOnViewBookingPage: true,
                upgradePrice: 10,
                isAmendCTAVisible: true,
                setIsUnavailableTransferPopupShown: jest.fn(),
            },
        });
        mockProps = createProps();
    });

    describe('AmendUpsellMessage', () => {
        it('Should be rendered', () => {
            render(<AmendDatesSummaryTransport {...mockProps} />);

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(mockPriceLabelProps).toHaveBeenCalledWith({
                price: 30,
                priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeTransfer,
            });
        });

        it('Should NOT be rendered when price is negative', () => {
            mockStores.amendDatesStore.transfer.upgradePrice = -30;
            render(<AmendDatesSummaryTransport {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when isLoading state is on', () => {
            mockStores.amendDatesStore.transfer.isLoading = true;
            render(<AmendDatesSummaryTransport {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when isAmendPriceEnabledOnViewBookingPage state is off', () => {
            mockStores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage = false;
            render(<AmendDatesSummaryTransport {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });
    });

    describe('Handle CTA click', () => {
        it('Should call handleChangeTransfer when transfer list is not empty', async () => {
            render(<AmendDatesSummaryTransport {...mockProps} />);

            const editBtn = screen.getByRole('button', { name: 'edit-btn' });

            await userEvent.click(editBtn);

            expect(mockStores.amendDatesStore.transfer.handleChangeTransfer).toHaveBeenCalled();
            expect(mockStores.amendTransfersStore.setIsUnavailableTransferPopupShown).not.toHaveBeenCalled();
        });

        it('Should call setIsUnavailableTransferPopupShown when transfer list in empty', async () => {
            mockStores.amendDatesStore.transfer.transferOffers = [];
            render(<AmendDatesSummaryTransport {...mockProps} />);

            const editBtn = screen.getByRole('button', { name: 'edit-btn' });

            await userEvent.click(editBtn);

            expect(mockStores.amendDatesStore.transfer.handleChangeTransfer).not.toHaveBeenCalled();
            expect(mockStores.amendTransfersStore.setIsUnavailableTransferPopupShown).toHaveBeenCalled();
        });
    });

    it('Render content', () => {
        mockStores.amendDatesStore.transfer.isLoading = false;
        render(<AmendDatesSummaryTransport {...mockProps} />);

        expect(screen.getByText('Shared Transfer Required')).toBeInTheDocument();
        expect(screen.getByTestId('transfer-duration')).toBeInTheDocument();
        expect(mockTransferDuration).toHaveBeenCalledWith(
            expect.objectContaining({ duration: 0, className: 'duration' }),
        );

        expect(screen.getByText('Private taxi')).toBeInTheDocument();
        expect(mockEditBtn).toHaveBeenCalledWith(
            expect.objectContaining({ isPlaceholderShimmer: false, dataTid: 'amend-dates-transfer-edit-button' }),
        );
        expect(screen.getByTestId('amend-dates-transfer-edit-button')).toBeInTheDocument();
        expect(screen.getByTestId('amend-summary-transfer')).toBeInTheDocument();
        expect(mockSummaryExpand).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: { value: { src: mockStores.amendDatesStore.offer.transfers[0].iconUrl } },
                title: mockProps.title.value,
                dataTid: 'amend-summary-transfer',
            }),
        );
    });

    it('should render component with empty string icon, when iconUrl in null', () => {
        mockStores.amendDatesStore.offer.transfers[0].iconUrl = null;
        mockStores.amendDatesStore.transfer.isLoading = false;

        render(<AmendDatesSummaryTransport {...mockProps} />);

        expect(mockSummaryExpand).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: { value: { src: '' } },
            }),
        );
    });

    it('Render edit button in shimmer state', () => {
        mockStores.amendDatesStore.transfer.isLoading = true;
        render(<AmendDatesSummaryTransport {...mockProps} />);

        expect(screen.getByTestId('amend-dates-transfer-edit-button')).toBeInTheDocument();
    });

    it('Render previous transport', () => {
        mockStores.amendDatesStore.offer.transfers[0].type = TransferType.Shared;
        render(<AmendDatesSummaryTransport {...mockProps} />);

        expect(screen.getByTestId('previous-transfer')).toHaveTextContent('Private taxi');
    });

    it('Render null', () => {
        mockStores.amendDatesStore.offer.transfers[0] = null;
        const { container } = render(<AmendDatesSummaryTransport {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
