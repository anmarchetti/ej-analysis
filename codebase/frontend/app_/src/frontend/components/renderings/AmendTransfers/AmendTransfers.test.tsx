import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking, mockTransfer, mockTransfersWithAmendmentCharges } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { deepClone } from 'frontend/utils/array.utils';
import { ITransfer } from 'models/data/ITransfer';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitePath from 'models/enum/SitePath';
import { TransferType } from 'models/enum/transfer/TransferType';

import AmendTransfers from './AmendTransfers';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/Link', () => ({ children }) => <div>{children}</div>);
jest.mock('frontend/components/common/Callout/Callout', () => ({ content }) => <div>{content}</div>);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={props.name}>{props.children}</div>;
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/hooks/useMediaQuery'),
    useMobileViewport: jest.fn(() => false),
}));

const mockTransfersBasketProps = jest.fn();
jest.mock('frontend/components/renderings/AmendmentBasket/components/TransfersBasket/TransfersBasket', () => ({
    __esModule: true,
    default: props => {
        mockTransfersBasketProps(props);

        return <div data-tid='transfers-basket' />;
    },
}));

const createStores = () =>
    createMockStores({
        amendTransfersStore: {
            transfersWithAmendmendCharges: deepClone(mockTransfersWithAmendmentCharges),
            selectedTransfer: { transfer: deepClone(mockTransfer) },
            changeSelectedTransfer: jest.fn(),
            changePrevSelectedTransfer: jest.fn(),
            redirectFromAmendTransfersPage: jest.fn(),
            initAmendTransfersPage: jest.fn(),
            submitTransfer: jest.fn(),
            isLoadingFromPayload: false,
            scenario: AmendScenarios.FromBooking,
            initialSelectedTransfer: {
                ...deepClone(mockTransfer),
                type: TransferType.Shared,
                code: 'initial-code',
                transferInfo: {
                    duration: 90,
                },
            } as Nullable<ITransfer>,
        },
        viewBookingStore: {
            booking: mockBooking,
            isAmendErrorPopupShown: false,
            isLoadingBookingFromPayload: false,
            continueToPay: jest.fn(),
            toggleAmendErrorPopup: jest.fn(),
        },
        trackingStore: {
            trackTransferAmendment: jest.fn(),
        },
    });

const priceTooltipText = 'Price is subject to change.';
const priceTooltipPromoSeatsText = 'Promo can not be applied to seats.';

const resetMocks = () =>
    ({
        fields: {
            IsPromotionalBannerEnabled: { value: true },
            PromotionalBannerText: { value: 'promotional banner text' },
            MinimumPromoBannerDuration: { value: 30 },
            PriceTooltipText: { value: priceTooltipText },
            PriceTooltipPromoSeatsText: { value: priceTooltipPromoSeatsText },
        },
        rendering: {},
    } as any);

let mockStores = createStores();
let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockSpinnerProps(props);

        return <div data-tid='spinner' />;
    },
}));

const mockErrorPopupProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup', () => ({
    __esModule: true,
    default: props => {
        mockErrorPopupProps(props);

        return <div data-tid='error-popup' onClick={props.onClose} />;
    },
}));

describe('<AmendTransfers />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
    });

    describe('Price jump popup', () => {
        it('should render price jump popup placeholder', () => {
            render(<AmendTransfers {...mocks} />);

            expect(screen.getByTestId(PlaceholderNames.PriceJumpPopup)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                name: PlaceholderNames.PriceJumpPopup,
                rendering: mocks.rendering,
            });
        });
    });

    it('should not render if no selected flights and transfers', () => {
        const { container } = render(<AmendTransfers {...mocks} />);
        expect(container.querySelector('.amend-transfers')).toBeTruthy();
    });

    describe('Error popup', () => {
        it('should show error popup', () => {
            mockStores.viewBookingStore.isAmendErrorPopupShown = true;

            render(<AmendTransfers {...mocks} />);

            expect(screen.getByTestId('error-popup')).toBeInTheDocument();
            expect(mockErrorPopupProps).toHaveBeenCalledWith({ onClose: expect.any(Function) });
        });

        it('should not show error popup', () => {
            mockStores.viewBookingStore.isAmendErrorPopupShown = false;

            render(<AmendTransfers {...mocks} />);

            expect(screen.queryByTestId('error-popup')).not.toBeInTheDocument();
        });

        it('Should call toggleAmendErrorPopup when press close cta on error popup', async () => {
            mockStores.viewBookingStore.isAmendErrorPopupShown = true;

            render(<AmendTransfers {...mocks} />);

            await userEvent.click(screen.getByTestId('error-popup'));

            expect(mockStores.viewBookingStore.toggleAmendErrorPopup).toHaveBeenCalledWith(false);
        });
    });

    it('should render three AmendTransferCards', () => {
        const { container } = render(<AmendTransfers {...mocks} />);

        expect(container.querySelectorAll('.amend-transfer-card')).toHaveLength(3);
    });

    it('should render two AmendTransferCards if not private and not equals initial transfer', () => {
        mockStores.amendTransfersStore.transfersWithAmendmendCharges[1].transfer.type = TransferType.Shared;

        const { container } = render(<AmendTransfers {...mocks} />);

        expect(container.querySelectorAll('.amend-transfer-card')).toHaveLength(2);
    });

    it("Should render continue and 'go back' button on desktop viewport", () => {
        render(<AmendTransfers {...mocks} />);

        expect(screen.getByRole('button', { name: 'Globals.Buttons.Continue' })).toBeInTheDocument();
        expect(screen.getByText('AmendBooking.Buttons.GoBackNoChanges')).toBeInTheDocument();
    });

    it('should render Continue button and call continueToPay on click', async () => {
        render(<AmendTransfers {...mocks} />);

        const button = screen.getByRole('button', { name: 'Globals.Buttons.Continue' });

        expect(button).toBeInTheDocument();
        await userEvent.click(button);

        expect(mockStores.amendTransfersStore.submitTransfer).toHaveBeenCalled();
    });

    it('should render private taxi promo banner', () => {
        render(<AmendTransfers {...mocks} />);

        expect(screen.getByText('promotional banner text')).toBeInTheDocument();
    });

    it('should not render private taxi promo banner if not enabled', () => {
        mocks.fields.IsPromotionalBannerEnabled.value = false;

        render(<AmendTransfers {...mocks} />);

        expect(screen.queryByText('promotional banner text')).not.toBeInTheDocument();
    });

    it('should not render private taxi promo banner if duration difference is less than minimum', () => {
        mocks.fields.MinimumPromoBannerDuration.value = 90;

        render(<AmendTransfers {...mocks} />);

        expect(screen.queryByText('promotional banner text')).not.toBeInTheDocument();
    });

    it('should not render private taxi promo banner if either transfer has 0 duration', () => {
        mockStores.amendTransfersStore.transfersWithAmendmendCharges[0].transfer.transferInfo = { duration: 0 };
        mockStores.amendTransfersStore.transfersWithAmendmendCharges[1].transfer.transferInfo = { duration: 0 };

        render(<AmendTransfers {...mocks} />);

        expect(screen.queryByText('promotional banner text')).not.toBeInTheDocument();
    });

    it('should show loading spinner', () => {
        mockStores.viewBookingStore.isLoadingBookingFromPayload = true;
        mockStores.viewBookingStore.booking.transfers = [];

        render(<AmendTransfers {...mocks} />);

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(mockSpinnerProps).toHaveBeenCalledWith(
            expect.objectContaining({ header: 'Globals.Labels.ValidatingPackage' }),
        );
    });

    it('should render null if not loading and no transfers', () => {
        mockStores.amendTransfersStore.initialSelectedTransfer = null;

        const { container } = render(<AmendTransfers {...mocks} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should call changeSelectedTransfer on click', async () => {
        render(<AmendTransfers {...mocks} />);

        const button = screen.getAllByRole('button')[2];
        expect(button).toBeInTheDocument();
        await userEvent.click(button);

        expect(mockStores.amendTransfersStore.changeSelectedTransfer).toHaveBeenCalledWith(
            expect.objectContaining(mockStores.amendTransfersStore.transfersWithAmendmendCharges[1]),
        );

        expect(mockStores.trackingStore.trackTransferAmendment).toHaveBeenCalled();
    });

    it('should call changeSelectedTransfer with null if initial transfer', () => {
        render(<AmendTransfers {...mocks} />);

        const button = screen.getAllByRole('button')[0];
        expect(button).toBeInTheDocument();
        fireEvent.click(button);

        expect(mockStores.amendTransfersStore.changeSelectedTransfer).toHaveBeenCalledWith(null);
    });

    it('Should NOT show that promocode is can not be applied to seats', () => {
        mockStores.layoutStore.getSetting = () => true;
        render(<AmendTransfers {...mocks} />);
        expect(screen.queryByText(priceTooltipText)).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText)).not.toBeInTheDocument();
    });

    it('Should NOT show that promocode is can not be applied to seats if no promocode', () => {
        mockStores.layoutStore.getSetting = () => false;
        mockStores.viewBookingStore.booking.discountCode = undefined;
        render(<AmendTransfers {...mocks} />);

        expect(screen.queryByText(priceTooltipText)).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText)).not.toBeInTheDocument();
    });

    it('Should show that promocode is can not be applied to seats', () => {
        mockStores.layoutStore.getSetting = () => false;
        mockStores.viewBookingStore.booking.discountCode = '1234' as any;
        render(<AmendTransfers {...mocks} />);
        expect(screen.queryByText(priceTooltipText, { exact: false })).toBeInTheDocument();
        expect(screen.queryByText(priceTooltipPromoSeatsText, { exact: false })).toBeInTheDocument();
    });

    it('Should NOT render continue and "go back" buttons on mobile viewport', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        render(<AmendTransfers {...mocks} />);

        expect(screen.queryByRole('link', { name: 'AmendBooking.Buttons.GoBackNoChanges' })).not.toBeInTheDocument();
        expect(screen.queryByText('AmendBooking.Buttons.GoBackNoChanges')).not.toBeInTheDocument();
    });

    describe('MobileBasket', () => {
        it('Should render MobileBasket when isMobile is true', () => {
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendTransfers {...mocks} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: PlaceholderNames.MobileBasket,
                    rendering: {},
                    price: 0,
                    hasOptionSelected: true,
                    handleSubmit: mockStores.amendTransfersStore.submitTransfer,
                    backLink: SitePath.ViewBooking,
                }),
            );
            expect(screen.getByTestId('transfers-basket')).toBeInTheDocument();
            expect(mockTransfersBasketProps).toHaveBeenCalledWith({
                transfer: mockStores.amendTransfersStore.selectedTransfer!.transfer,
            });
        });

        it('Should render MobileBasket when isMobile is true with rounded positive price', () => {
            mockStores.amendTransfersStore.selectedTransfer.amendmentCharges = 10.1;
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendTransfers {...mocks} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 11,
                }),
            );
        });

        it('Should render MobileBasket when isMobile is true with rounded negative price', () => {
            mockStores.amendTransfersStore.selectedTransfer.amendmentCharges = -10.1;
            jest.mocked(useMobileViewport).mockReturnValueOnce(true);
            render(<AmendTransfers {...mocks} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: -10,
                }),
            );
        });

        it('Should NOT render MobileBasket when isMobile is false', () => {
            jest.mocked(useMobileViewport).mockReturnValueOnce(false);
            render(<AmendTransfers {...mocks} />);

            expect(screen.queryByTestId(PlaceholderNames.MobileBasket)).not.toBeInTheDocument();
            expect(screen.queryByTestId('transfers-basket')).not.toBeInTheDocument();
            expect(mockTransfersBasketProps).not.toHaveBeenCalled();
        });
    });
});
