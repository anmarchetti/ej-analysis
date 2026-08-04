import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { useChatbotTracking } from 'frontend/hooks/useChatbotTracking/useChatbotTracking';
import { containsFAndHPromoCode } from 'frontend/utils/offer.utils';
import { CreditType } from 'models/enum/CreditType';
import { IPriceBreakdownItem } from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';
import * as utils from 'frontend/components/renderings/CancelBooking/CancelBooking.utils';

import { cancelBookingFieldsMock } from './__mocks__/mockFields';
import { mockStepOneChecked, mockStepsStateInit } from './__mocks__/mockState';
import CancelBooking, { TCancelBookingProps } from './CancelBooking';

let mockMoreThenMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: () => mockMoreThenMobileViewport,
}));

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            initializeCancellationSummaryFetch: jest.fn(),
            initializeCreditConfirmPage: jest.fn(),
            booking: mockBooking,
            selectedRefundType: CreditType.Credit,
            clearCreditStore: jest.fn(),
            isOneTimeUseCreditEnabled: false,
            initializeFromPayload: jest.fn().mockResolvedValue({}),
            isCancellationSummaryIsLoading: false,
        },
    });

const createProps = (): TCancelBookingProps => ({
    fields: cancelBookingFieldsMock,
    params: {},
    rendering: undefined,
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useChatbotTracking/useChatbotTracking', () => ({
    useChatbotTracking: jest.fn(),
}));

jest.mock('frontend/utils/offer.utils', () => ({
    containsFAndHPromoCode: jest.fn(() => false),
}));

const mockPriceBreakdownProps = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/PriceBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownProps(props);

        return <div data-tid='price-breakdown' />;
    },
}));

const mockCancellationAccordionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/CancelBooking/components/CancellationAccordion/CancellationAccordion',
    () => ({
        __esModule: true,
        default: props => {
            mockCancellationAccordionProps(props);

            return <div data-tid='cancelation-accordion' />;
        },
    }),
);

const mockCancellationErrorPopup = jest.fn();
jest.mock(
    'frontend/components/renderings/CancelBooking/components/CancellationErrorPopup/CancellationErrorPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockCancellationErrorPopup(props);

            return <div data-tid='cancellation-error-popup' />;
        },
    }),
);

const mockPriceBreakdown: { priceBreakdownItems: IPriceBreakdownItem[]; totalRefund: number } = {
    priceBreakdownItems: [
        { amount: 5, breakdownTitle: 'refund' },
        { amount: 1, breakdownTitle: 'credit' },
    ],
    totalRefund: 1000,
};

jest.spyOn(utils, 'usePriceBreakdown').mockReturnValue(mockPriceBreakdown);
jest.spyOn(utils, 'generateInitialStateFromSteps').mockReturnValue(mockStepsStateInit);

describe('<CancelBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should call useChatbotTracking with booking and containsFAndHPromoCode result', () => {
        (containsFAndHPromoCode as jest.Mock).mockReturnValue(true);

        render(<CancelBooking {...mockProps} />);

        expect(containsFAndHPromoCode).toHaveBeenCalledWith(mockBooking.promoCollections || []);
        expect(useChatbotTracking).toHaveBeenCalledWith(mockBooking, true);
    });

    it('Should render component', async () => {
        render(<CancelBooking {...mockProps} />);

        expect(screen.getByTestId('cancel-booking')).toBeInTheDocument();
        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(screen.getByTestId('cancelation-accordion')).toBeInTheDocument();

        expect(mockCancellationAccordionProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            booking: mockStores.holidayCreditStore.booking,
            setStepsState: expect.any(Function),
            stepsState: mockStepsStateInit,
        });

        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            subTotalPrice: undefined,
            totalPrice: mockPriceBreakdown.totalRefund,
            fields: mockProps.fields,
            priceBreakdownItems: mockPriceBreakdown.priceBreakdownItems,
            totalPriceLabelField: mockProps.fields?.TotalCost,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitleStepOne,
            currency: mockBooking.paymentInfo.currency,
            isLoading: false,
        });

        expect(screen.getByTestId('cancellation-error-popup')).toBeInTheDocument();
        expect(mockCancellationErrorPopup).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });

        await waitFor(() => {
            expect(mockStores.holidayCreditStore.initializeCreditConfirmPage).toHaveBeenCalled();
            expect(mockStores.holidayCreditStore.initializeCancellationSummaryFetch).not.toHaveBeenCalled();
        });
    });

    it('Should pass isLoading prop when isCancellationSummaryIsLoading', () => {
        mockStores.holidayCreditStore.isCancellationSummaryIsLoading = true;
        render(<CancelBooking {...mockProps} />);

        expect(mockCancellationAccordionProps).toHaveBeenCalled();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            subTotalPrice: undefined,
            totalPrice: mockPriceBreakdown.totalRefund,
            fields: mockProps.fields,
            priceBreakdownItems: mockPriceBreakdown.priceBreakdownItems,
            totalPriceLabelField: mockProps.fields?.TotalCost,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitleStepOne,
            currency: mockBooking.paymentInfo.currency,
            isLoading: true,
        });
    });

    it('Should call initializeOTUCCreditConfirmPage when OTUC is enabled', async () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = true;
        render(<CancelBooking {...mockProps} />);

        await waitFor(() => {
            expect(mockStores.holidayCreditStore.initializeCreditConfirmPage).not.toHaveBeenCalled();
            expect(mockStores.holidayCreditStore.initializeCancellationSummaryFetch).toHaveBeenCalled();
        });
    });

    it('Should call initializeCancellationSummaryFetch when isTradePortal is true', async () => {
        mockStores.layoutStore.isTradePortal = true;
        render(<CancelBooking {...mockProps} />);

        await waitFor(() => {
            expect(mockStores.holidayCreditStore.initializeCreditConfirmPage).not.toHaveBeenCalled();
            expect(mockStores.holidayCreditStore.initializeCancellationSummaryFetch).toHaveBeenCalled();
        });
    });

    it('should render PriceBreakdown with subTotalPrice when viewport is mobile', () => {
        mockMoreThenMobileViewport = false;
        render(<CancelBooking {...mockProps} />);

        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            subTotalPrice: mockPriceBreakdown.totalRefund,
            totalPrice: mockPriceBreakdown.totalRefund,
            fields: mockProps.fields,
            priceBreakdownItems: mockPriceBreakdown.priceBreakdownItems,
            totalPriceLabelField: mockProps.fields?.TotalCost,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitleStepOne,
            currency: mockBooking.paymentInfo.currency,
            isLoading: false,
        });

        mockMoreThenMobileViewport = true;
    });

    it('Should render different labels for price breakdown when Holiday summary step is checked ', () => {
        jest.spyOn(utils, 'generateInitialStateFromSteps').mockReturnValue(mockStepOneChecked);
        render(<CancelBooking {...mockProps} />);

        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            subTotalPrice: undefined,
            totalPrice: mockPriceBreakdown.totalRefund,
            fields: mockProps.fields,
            priceBreakdownItems: mockPriceBreakdown.priceBreakdownItems,
            totalPriceLabelField: mockProps.fields?.RefundAmount,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitle,
            currency: mockBooking.paymentInfo.currency,
            isLoading: false,
        });
    });

    it('Should NOT render component when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<CancelBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call clearCreditStore on unmount', () => {
        const { unmount } = render(<CancelBooking {...mockProps} />);

        unmount();

        expect(mockStores.holidayCreditStore.clearCreditStore).toHaveBeenCalled();
    });
});
