import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockTransfer } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TransferDropdown, { ITransferDropdownProps } from './TransferDropdown';

const createMockProps = (): ITransferDropdownProps => ({
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    title: mockSitecoreField('title'),
    ctaLabel: 'ctaLabel',
    offerTransfer: mockTransfer,
    onClickEditCTA: jest.fn(),
    ctaProps: {
        isPlaceholderShimmer: false,
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendSummaryAccordionProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAmendSummaryAccordionProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockEditButtonProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/EditButton/EditButton', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockEditButtonProps(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                {children}
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

describe('<TransferDropdown />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendTransfersStore: {
                isAmendPriceEnabledOnViewBookingPage: true,
            },
        });
        mockProps = createMockProps();
    });

    it('Render content', () => {
        mockStores.amendDatesStore.transfer.isLoading = false;
        render(<TransferDropdown {...mockProps} />);

        expect(screen.getByTestId('transfer-dropdown-title')).toHaveTextContent(mockTransfer.name);
        expect(screen.getByTestId('transfer-duration')).toBeInTheDocument();
        expect(mockTransferDuration).toHaveBeenCalledWith(
            expect.objectContaining({ duration: mockTransfer.transferInfo?.duration, className: 'duration' }),
        );

        expect(mockEditButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({ isPlaceholderShimmer: false, dataTid: 'amend-summary-transfer-edit-button' }),
        );
        expect(screen.getByTestId('amend-summary-transfer-edit-button')).toHaveTextContent(mockProps.ctaLabel);
        expect(screen.getByTestId('amend-summary-transfer')).toBeInTheDocument();
        expect(mockAmendSummaryAccordionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: mockProps.icon,
                title: mockProps.title.value,
                dataTid: 'amend-summary-transfer',
            }),
        );
    });

    describe('AmendUpsellMessage', () => {
        it('Should be rendered', () => {
            mockProps.upgradePrice = 30;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(mockPriceLabelProps).toHaveBeenCalledWith({
                price: 30,
                priceLabel: SitecoreDictionary.ViewBookingLabelsUpgradeTransfer,
            });
        });

        it('Should NOT be rendered when price is negative', () => {
            mockProps.upgradePrice = -30;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when isLoading state is on', () => {
            mockProps.isLoading = true;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when isAmendPriceEnabledOnViewBookingPage state is off', () => {
            mockStores.amendTransfersStore.isAmendPriceEnabledOnViewBookingPage = false;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when upgradePrice is not defined', () => {
            mockProps.upgradePrice = undefined;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.queryByTestId('price-label')).not.toBeInTheDocument;
        });
    });

    describe('Edit button', () => {
        it('Render edit button in shimmer state when it was passed by props', () => {
            mockProps.isLoading = true;
            mockProps.ctaProps.isPlaceholderShimmer = true;
            render(<TransferDropdown {...mockProps} />);

            expect(screen.getByTestId('amend-summary-transfer-edit-button')).toBeInTheDocument();
            expect(mockEditButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({ isPlaceholderShimmer: true, dataTid: 'amend-summary-transfer-edit-button' }),
            );
        });

        it('Should call onClickEditCTA on click', async () => {
            render(<TransferDropdown {...mockProps} />);

            await userEvent.click(screen.getByTestId('amend-summary-transfer-edit-button'));

            expect(mockProps.onClickEditCTA).toHaveBeenCalled();
        });
    });

    it('Should NOT render component if offerTransfer is not provided', () => {
        mockProps.offerTransfer = null;
        const { container } = render(<TransferDropdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
