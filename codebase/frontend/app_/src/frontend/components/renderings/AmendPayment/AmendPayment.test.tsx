import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockAmendPaymentInfo } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PaymentStep } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import {
    gaPaymentError,
    HolidaysUnavailableReason,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentInitialization } from 'frontend/components/renderings/Payment/usePaymentInitialization';

import { mockPaymentPriceBreakdownFields } from './__mocks__/amendPayment';
import AmendPayment from './AmendPayment';
import { getPriceBreakdown } from './AmendPayment.utils';
import { TAmendPaymentProps } from './interfaces';

let mockProps: TAmendPaymentProps;
let mockStores;

const mockCheckingChangesText = 'Hang tight, we are checking your changes';

const mockTaxesAndFees = [
    {
        code: 'TAX1',
        exchangeRate: 1.19,
        paylocalAmount: 10,
        paylocalAmountConverted: 8.4,
        paylocalAmountConvertedCurrency: 'GBP',
        paylocalAmountCurrency: 'EUR',
    },
];

const defaultTouristTaxData = {
    hasTouristTax: true,
    newTaxesAndFees: mockTaxesAndFees,
    newTouristTaxConverted: 8.4,
    prevTouristTax: 5,
};

const defaultTouristTaxFields = {
    paidToUsLabel: 'Paid to us',
    prevTaxLabel: 'Previous tax',
    newTaxLabel: 'New tax',
    newTaxPopupTitle: 'Tooltip title',
    newTaxPopupContent: 'Tooltip content',
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/AmendPaymentErrorPopup/AmendPaymentErrorPopup', () => ({
    __esModule: true,
    default: ({ onClose }) => <div data-tid='amend-payment-error-popup' onClick={onClose} />,
}));

jest.mock('./components/AmendPaymentMetaBlock/AmendPaymentMetaBlock', () => () => (
    <div data-tid='amend-payment-meta-block'>AmendPaymentMetaBlock</div>
));

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

jest.mock('./components/AmendUnavailablePopup/AmendUnavailablePopup', () => () => <div data-tid='unavailable' />);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' onClick={props.onClose} />;
    },
}));
const mockPriceBreakdownProps = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/PriceBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownProps(props);

        return <div data-tid='price-breakdown' />;
    },
}));

const mockAccordionProps = jest.fn();
jest.mock('./components/AmendPaymentAccordion/AmendPaymentAccordion', () => ({
    __esModule: true,
    default: props => {
        mockAccordionProps(props);

        return <div data-tid='accordion' />;
    },
}));

const mockWarningPopupProps = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: props => {
        mockWarningPopupProps(props);

        return <div data-tid='warning-popup' />;
    },
}));

jest.mock('frontend/components/renderings/Payment/usePaymentInitialization');
const mockUsePaymentInitialization = jest.mocked(usePaymentInitialization);

const mockPriceBreakdownItems = [
    {
        breakdownTitle: 'title',
        amount: 100,
        uniqueKey: 'change',
        tooltipText: 'tooltip',
    },
];

jest.mock('./AmendPayment.utils', () => ({
    ...jest.requireActual('./AmendPayment.utils'),
    __esModule: true,
    getPriceBreakdown: jest.fn(() => mockPriceBreakdownItems),
}));

describe('<AmendPayment />', () => {
    let amendmentType: AmendmentType | undefined;

    beforeEach(() => {
        mockProps = {
            fields: {
                ...mockPaymentPriceBreakdownFields,
                PopupIcon: mockSitecoreField(mockSitecoreImageField('icon')),
                SeatsPopupTitle: mockSitecoreField('There is an issue with your seats'),
                SeatsPopupDescription: mockSitecoreField('Please select your seats again'),
                SeatsPopupPrimaryCTA: mockSitecoreField('Back to summary'),
                SeatsPopupSecondaryCTA: mockSitecoreField('Continue without seats'),
                PaidToUs: mockSitecoreField('Paid to us'),
                PrevTax: mockSitecoreField('Previous tax'),
                NewTax: mockSitecoreField('New tax'),
                NewTaxPopupTitle: mockSitecoreField('Tooltip title'),
                NewTaxPopupContent: mockSitecoreField('Tooltip content'),
            } as any,
            rendering: 'rendering',
            params: {},
        };

        mockStores = createMockStores({
            amendPaymentStore: {
                totalPrice: 50,
                initialize: jest.fn(),
                toggleErrorPopupVisibility: jest.fn(),
                redirectFromPaymentPage: jest.fn(),
                amendmentPaymentInfo: mockAmendPaymentInfo,
                balanceAmount: 100,
                isTimeToPay: false,
                isPaying: false,
                isProductUnavailable: false,
                canAddToBalance: true,
                goBackToPreviousPage: jest.fn(),
                totalPaymentAmount: 50,
                hasTouristTax: defaultTouristTaxData.hasTouristTax,
                newTaxesAndFees: defaultTouristTaxData.newTaxesAndFees,
                newTouristTaxConverted: defaultTouristTaxData.newTouristTaxConverted,
                prevTouristTax: defaultTouristTaxData.prevTouristTax,
            },
            payStore: { isAtcomError: false, amountToPay: 50, usedCredit: 20 },
            amendFlightsStore: {
                isPrevSelectedFlightUnavailable: false,
            },
            amendRoomAndBoardStore: {
                areOptionsNotValidated: false,
            },
            viewBookingStore: {
                showBooking: jest.fn(),
            },
            trackingStore: {
                getTrackPaymentData: jest.fn(),
            },
            amendDatesStore: {
                seats: {
                    isSeatNoLongerAvailable: false,
                    handleContinueWithoutSeats: jest.fn(),
                },
            },
            marketStore: {
                currency: CurrencyCode.GBP,
            },
        });

        mockStores.layoutStore.getPhrase = jest.fn(phrase =>
            phrase === SitecoreDictionary.AmendBookingLabelsCheckingChanges ? mockCheckingChangesText : phrase,
        );

        Object.defineProperty(mockStores.amendPaymentStore, 'amendmentType', {
            get: () => amendmentType,
        });
    });

    it('Should render component', () => {
        mockStores.amendPaymentStore.isFromAmendFlight = true;
        render(<AmendPayment {...mockProps} />);

        expect(screen.queryByText(mockCheckingChangesText)).not.toBeInTheDocument();
        expect(screen.getByTestId('accordion')).toBeInTheDocument();
        expect(mockAccordionProps).toHaveBeenCalledWith(
            expect.objectContaining({ fields: mockProps.fields, rendering: 'rendering' }),
        );
        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: mockStores.amendPaymentStore.totalPrice,
            subTotalPrice: mockStores.amendPaymentStore.totalPrice,
            feesPerPersons: mockAmendPaymentInfo.feesPerPersons,
            feeChargePrice: mockAmendPaymentInfo.totalFeesAmount,
            fields: mockProps.fields,
            previousBalance: undefined,
            priceBreakdownItems: mockPriceBreakdownItems,
            holidayCredit: mockStores.payStore.usedCredit,
            currency: mockStores.marketStore.currency,
            touristTaxData: defaultTouristTaxData,
            touristTaxFields: defaultTouristTaxFields,
        });

        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.UnAvailableFlowPopup,
            rendering: mockProps.rendering,
        });
    });

    it('Should render priceBreakdown component with previous balance prop when isTimeToPay', () => {
        mockStores.amendPaymentStore.canAddToBalance = false;
        render(<AmendPayment {...mockProps} />);

        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: mockStores.payStore.amountToPay,
            subTotalPrice: mockStores.amendPaymentStore.totalPrice,
            feesPerPersons: mockAmendPaymentInfo.feesPerPersons,
            feeChargePrice: mockAmendPaymentInfo.totalFeesAmount,
            fields: mockProps.fields,
            previousBalance: mockStores.amendPaymentStore.balanceAmount,
            priceBreakdownItems: mockPriceBreakdownItems,
            holidayCredit: mockStores.payStore.usedCredit,
            currency: mockStores.marketStore.currency,
            touristTaxData: defaultTouristTaxData,
            touristTaxFields: defaultTouristTaxFields,
        });
    });

    it('Should render priceBreakdown component with total price when amendmentChargesWithoutFees is NOT provided', () => {
        mockStores.amendPaymentStore.amendmentPaymentInfo = undefined;
        render(<AmendPayment {...mockProps} />);

        expect(getPriceBreakdown).toHaveBeenCalledWith(
            undefined,
            mockStores.amendPaymentStore.totalPrice,
            mockProps.fields,
        );
    });

    it('Should render nothing when fields have not been provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<AmendPayment {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call initialize func', async () => {
        render(<AmendPayment {...mockProps} />);

        expect(mockUsePaymentInitialization).toHaveBeenCalled();
    });

    describe('GA analytics events', () => {
        const holidayUnavailableLabel = 'holiday is unavailable';

        it('should push analytics event when transferErrors are defined', () => {
            mockStores.payStore.transferErrors = [{ messageKey: 'message', descriptionKey: 'description' }];
            render(<AmendPayment {...mockProps} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...gaPaymentError,
                }),
            );
        });

        it('should NOT push analytics event when transferErrors are NOT defined', () => {
            render(<AmendPayment {...mockProps} />);

            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });

        it('should push analytics event holiday is unavailable when product is unavailable', () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            amendmentType = AmendmentType.Transfer;
            render(<AmendPayment {...mockProps} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_action: holidayUnavailableLabel,
                    event_label: HolidaysUnavailableReason.TRANSFER,
                }),
            );
        });

        it('should push analytics event holiday is unavailable with Seats reason when seats amend is unavailable', () => {
            mockStores.amendPaymentStore.isAmendItemUnavailable = false;
            mockStores.amendDatesStore.seats.isSeatNoLongerAvailable = true;

            render(<AmendPayment {...mockProps} />);

            expect(mockPushTrackingEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_action: holidayUnavailableLabel,
                    event_label: HolidaysUnavailableReason.SEATS,
                }),
            );
        });

        it('should NOT push analytics event holiday is unavailable when product is available', () => {
            mockStores.amendPaymentStore.isAmendItemUnavailable = false;
            mockStores.amendPaymentStore.isFromAmendTransfer = true;

            render(<AmendPayment {...mockProps} />);

            expect(mockPushTrackingEvent).not.toHaveBeenCalled();
        });
    });

    it('should render components correctly when there is no price change', () => {
        mockStores.amendPaymentStore.totalPaymentAmount = 0;
        mockStores.amendPaymentStore.totalPrice = 0;
        render(<AmendPayment {...mockProps} />);

        expect(screen.getByTestId('accordion')).toBeInTheDocument();
        expect(mockAccordionProps).toHaveBeenCalledWith(
            expect.objectContaining({ steps: [PaymentStep.Entity, PaymentStep.Confirmation] }),
        );
        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: mockStores.payStore.amountToPay,
            subTotalPrice: mockStores.amendPaymentStore.totalPrice,
            feesPerPersons: mockAmendPaymentInfo.feesPerPersons,
            feeChargePrice: mockAmendPaymentInfo.totalFeesAmount,
            fields: mockProps.fields,
            previousBalance: undefined,
            priceBreakdownItems: mockPriceBreakdownItems,
            holidayCredit: mockStores.payStore.usedCredit,
            currency: mockStores.marketStore.currency,
            touristTaxData: defaultTouristTaxData,
            touristTaxFields: defaultTouristTaxFields,
        });
    });

    it('should NOT render PriceBreakdown with previous balance when isPayingOnlyFees', () => {
        mockStores.amendPaymentStore.isPayingFeesOnly = true;

        render(<AmendPayment {...mockProps} />);
        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith(
            expect.objectContaining({
                previousBalance: undefined,
            }),
        );
    });

    describe('AmendPaymentErrorPopup', () => {
        it('should render "AmendPaymentErrorPopup" without "atcom" error', () => {
            mockStores.amendPaymentStore.isErrorPopupShown = true;
            render(<AmendPayment {...mockProps} />);

            const paymentErrorPopup = screen.queryByTestId('amend-payment-error-popup');
            fireEvent.click(paymentErrorPopup!);
            expect(mockStores.viewBookingStore.showBooking).not.toHaveBeenCalled();
        });

        it('should render  with "atcom" error', () => {
            mockStores.amendPaymentStore.isErrorPopupShown = true;
            mockStores.payStore.isAtcomError = true;
            render(<AmendPayment {...mockProps} />);

            const paymentErrorPopup = screen.queryByTestId('amend-payment-error-popup');
            expect(paymentErrorPopup).toBeInTheDocument();

            fireEvent.click(paymentErrorPopup!);
            expect(mockStores.viewBookingStore.showBooking).toHaveBeenCalled();
            expect(mockStores.amendPaymentStore.toggleErrorPopupVisibility).toHaveBeenCalledWith(false);
        });

        it('should NOT be rendered', () => {
            render(<AmendPayment {...mockProps} />);

            expect(screen.queryByTestId('amend-payment-error-popup')).not.toBeInTheDocument();
        });
    });

    describe('PriceJumpPopup', () => {
        it('should be rendered when data is NOT loading', () => {
            render(<AmendPayment {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                name: PlaceholderNames.PriceJumpPopup,
                rendering: 'rendering',
            });
        });
    });

    describe('Loader', () => {
        it('should show the checking changes message when data is loading', () => {
            mockStores.amendPaymentStore.isLoadingData = true;
            render(<AmendPayment {...mockProps} />);

            expect(screen.getByText(mockCheckingChangesText)).toBeInTheDocument();
        });

        it('should show the checking changes message when paying is in progress', () => {
            mockStores.amendPaymentStore.isPaying = true;
            render(<AmendPayment {...mockProps} />);

            expect(screen.getByText(mockCheckingChangesText)).toBeInTheDocument();
        });
    });

    describe('AmendUnavailablePopup', () => {
        it('should render AmendUnavailablePopup when data error is loading', () => {
            mockStores.amendPaymentStore.isLoadingDataError = true;
            const { getByTestId } = render(<AmendPayment {...mockProps} />);

            expect(getByTestId('unavailable')).toBeInTheDocument();
        });

        it('should not render AmendUnavailablePopup when isProductUnavailable', () => {
            mockStores.amendPaymentStore.isAmendItemUnavailable = true;
            const { queryByTestId } = render(<AmendPayment {...mockProps} />);

            expect(queryByTestId('unavailable')).not.toBeInTheDocument();
        });
    });

    describe('ProductUnavailablePopup', () => {
        it('should render ProductUnavailablePopup with Flight product isPrevSelectedFlightUnavailable', () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendFlightsStore.isPrevSelectedFlightUnavailable = true;
            amendmentType = AmendmentType.Flight;
            render(<AmendPayment {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                product: AmendmentType.Flight,
                onClose: expect.any(Function),
                name: PlaceholderNames.ProductUnavailablePopup,
                rendering: 'rendering',
            });
        });

        it('should render ProductUnavailablePopup with Transfer product isAmendItemUnavailable', () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendPaymentStore.isAmendItemUnavailable = true;
            amendmentType = AmendmentType.Transfer;
            render(<AmendPayment {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                product: AmendmentType.Transfer,
                onClose: expect.any(Function),
                name: PlaceholderNames.ProductUnavailablePopup,
                rendering: 'rendering',
            });
        });

        it('should render ProductUnavailablePopup with RoomAndBoard product areOptionsNotValidated', () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendDatesStore.isValidatedOfferUnavailable = true;
            amendmentType = AmendmentType.Dates;
            render(<AmendPayment {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                product: AmendmentType.Dates,
                name: 'product-unavailable-popup',
                onClose: expect.any(Function),
                rendering: 'rendering',
            });
        });

        it('should render ProductUnavailablePopup with AmendDates product', () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendRoomAndBoardStore.areOptionsNotValidated = true;
            amendmentType = AmendmentType.RoomAndBoard;
            render(<AmendPayment {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenCalledWith({
                product: AmendmentType.RoomAndBoard,
                onClose: expect.any(Function),
                name: PlaceholderNames.ProductUnavailablePopup,
                rendering: 'rendering',
            });
        });

        it('Should call goBackToPreviousPage when click on ProductUnavailablePopup', async () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendRoomAndBoardStore.areOptionsNotValidated = true;
            mockStores.amendPaymentStore.isFromAmendRoomAndBoard = true;
            mockStores.amendPaymentStore.goBackToPreviousPage = jest.fn();
            render(<AmendPayment {...mockProps} />);

            const popup = screen.getAllByTestId('placeholder')[0];

            await userEvent.click(popup);

            expect(mockStores.amendPaymentStore.goBackToPreviousPage).toHaveBeenCalled();
        });

        it('Should call redirectFromPaymentPage when isFromAmendDates and click on ProductUnavailablePopup', async () => {
            mockStores.amendPaymentStore.isProductUnavailable = true;
            mockStores.amendDatesStore.isValidatedOfferUnavailable = true;
            mockStores.amendPaymentStore.isFromAmendDates = true;
            mockStores.amendPaymentStore.redirectFromPaymentPage = jest.fn();
            render(<AmendPayment {...mockProps} />);

            const popup = screen.getAllByTestId('placeholder')[0];

            await userEvent.click(popup);

            expect(mockStores.amendPaymentStore.redirectFromPaymentPage).toHaveBeenCalledWith(SitePath.AmendDates);
        });
    });

    it('Should render WarningPopup when isSeatNoLongerAvailable', () => {
        mockStores.amendDatesStore.seats.isSeatNoLongerAvailable = true;
        render(<AmendPayment {...mockProps} />);

        expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
        expect(mockWarningPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields?.SeatsPopupTitle,
                description: mockProps.fields?.SeatsPopupDescription,
                icon: mockProps.fields?.PopupIcon,
                ctaText: mockProps.fields?.SeatsPopupPrimaryCTA,
                secondaryCtaText: mockProps.fields?.SeatsPopupSecondaryCTA,
                onClose: mockStores.amendPaymentStore.goBackToPreviousPage,
                onSecondaryCtaClick: mockStores.amendDatesStore.seats.handleContinueWithoutSeats,
            }),
        );
    });
});
