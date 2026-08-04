import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { SummaryInfo } from 'frontend/components/common/HolidaySummary/HolidaySummary.utils';
import { cancellationAccordionFieldsMock } from 'frontend/components/renderings/CancelBooking/__mocks__/mockFields';
import {
    mockStepsStateInit,
    mockStepTwoChecked,
} from 'frontend/components/renderings/CancelBooking/__mocks__/mockState';

import CancellationAccordion, { TCancellationAccordionProps } from './CancellationAccordion';

const mockSetStepsState = jest.fn();
const createProps = (): TCancellationAccordionProps => ({
    booking: mockBooking,
    fields: cancellationAccordionFieldsMock,
    setStepsState: mockSetStepsState,
    stepsState: mockStepsStateInit,
});

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            isOneTimeUseCreditEnabled: false,
            isCancellationSummaryIsLoading: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockExpandItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockExpandItemProps(props);

        return (
            <div data-tid='expand-item' id={props.id} onClick={() => props.onOpen(!props.isOpened)}>
                {children}
            </div>
        );
    },
}));

const mockEntityContainerProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendPaymentAccordion/components/AmendPaymentItemContainer/AmendPaymentItemContainer',
    () => ({
        __esModule: true,
        default: ({ children, ...props }) => {
            mockEntityContainerProps(props);

            return (
                <div data-tid='entity-container' onClick={props.onContinue}>
                    {children}
                </div>
            );
        },
    }),
);

jest.mock('frontend/components/common/TickCheck/TickCheck', () => ({
    __esModule: true,
    default: () => <div data-tid='tick' />,
}));

const mockHolidaySummaryProps = jest.fn();
jest.mock('frontend/components/common/HolidaySummary/HolidaySummary', () => ({
    __esModule: true,
    default: props => {
        mockHolidaySummaryProps(props);

        return <div data-tid='holiday-summary' />;
    },
}));

const mockRefundOptionsProps = jest.fn();
jest.mock('frontend/components/renderings/CancelBooking/components/RefundOptions/RefundOptions', () => ({
    __esModule: true,
    default: props => {
        mockRefundOptionsProps(props);

        return <div data-tid='refund-options' />;
    },
}));

const mockRefundOptionsOTUCProps = jest.fn();
jest.mock('frontend/components/renderings/CancelBooking/components/RefundOptionsOTUC/RefundOptionsOTUC', () => ({
    __esModule: true,
    default: props => {
        mockRefundOptionsOTUCProps(props);

        return <div data-tid='refund-options-otuc' />;
    },
}));

const mockCancellationConfirmationProps = jest.fn();
jest.mock(
    'frontend/components/renderings/CancelBooking/components/CancellationConfirmation/CancellationConfirmation',
    () => ({
        __esModule: true,
        default: props => {
            mockCancellationConfirmationProps(props);

            return <div data-tid='cancellation-confirmation' />;
        },
    }),
);

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    scrollToElement: jest.fn(),
}));

describe('<CancellationAccordion />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render 1 AmendPaymentItemContainer if no booking ', () => {
        mockProps.booking = undefined;

        render(<CancellationAccordion {...mockProps} />);

        expect(screen.getAllByTestId('entity-container').length).toBe(1);
    });

    it('Should render accordion component', () => {
        render(<CancellationAccordion {...mockProps} />);

        expect(screen.getByTestId('cancellation-accordion')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-summary')).toBeInTheDocument();
        expect(screen.getByTestId('refund-options')).toBeInTheDocument();
        expect(screen.getByTestId('cancellation-confirmation')).toBeInTheDocument();
        expect(screen.getAllByTestId('expand-item').length).toBe(3);
        expect(screen.getAllByTestId('entity-container').length).toBe(3);

        expect(mockExpandItemProps).toHaveBeenNthCalledWith(1, {
            title: mockProps.fields.StepOneTitle.value,
            icon: expect.anything(),
            onOpen: expect.any(Function),
            isOpened: true,
            isDisabled: false,
            isChecked: false,
            className: 'expandableItem',
            titleClassName: 'expandableItemTitle',
            id: 'HolidaySummary',
            isLoading: mockStores.holidayCreditStore.isCancellationSummaryIsLoading,
        });

        expect(mockExpandItemProps).toHaveBeenNthCalledWith(2, {
            title: mockProps.fields.StepTwoTitle.value,
            icon: expect.anything(),
            onOpen: expect.any(Function),
            isOpened: false,
            isDisabled: true,
            isChecked: false,
            className: 'expandableItem',
            titleClassName: 'expandableItemTitle',
            id: 'RefundOptions',
            isLoading: mockStores.holidayCreditStore.isCancellationSummaryIsLoading,
        });

        expect(mockExpandItemProps).toHaveBeenNthCalledWith(3, {
            title: mockProps.fields.StepThreeTitle.value,
            icon: expect.anything(),
            onOpen: expect.any(Function),
            isOpened: false,
            isDisabled: true,
            isChecked: false,
            className: 'expandableItem',
            titleClassName: 'expandableItemTitle',
            isLoading: mockStores.holidayCreditStore.isCancellationSummaryIsLoading,
        });

        expect(mockEntityContainerProps).toHaveBeenNthCalledWith(1, {
            onContinue: expect.any(Function),
            hideCta: false,
            className: 'itemContainer',
        });

        expect(mockEntityContainerProps).toHaveBeenNthCalledWith(2, {
            onContinue: expect.any(Function),
            hideCta: false,
            className: 'itemContainer',
        });

        expect(mockEntityContainerProps).toHaveBeenNthCalledWith(3, {
            onContinue: expect.any(Function),
            hideCta: true,
            className: 'itemContainer',
        });

        expect(screen.getByTestId('holiday-summary')).toBeInTheDocument();
        expect(mockHolidaySummaryProps).toHaveBeenCalledWith({
            booking: mockProps.booking,
            summaryInfoOrder: [
                SummaryInfo.Flight,
                SummaryInfo.AccommodationAndBoard,
                SummaryInfo.LuggageAndTransfer,
                SummaryInfo.PassengerDetails,
                SummaryInfo.FreeKids,
                SummaryInfo.AirportParking,
            ],
            showStayDuration: true,
            luggageInfoFields: mockProps.fields,
        });

        expect(screen.getByTestId('refund-options')).toBeInTheDocument();
        expect(mockRefundOptionsProps).toHaveBeenCalledWith({
            refundData: mockProps.booking!.refund,
            refundOptions: mockProps.fields.Children,
            currency: mockProps.booking!.paymentInfo.currency,
        });

        expect(screen.getByTestId('cancellation-confirmation')).toBeInTheDocument();
        expect(mockCancellationConfirmationProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('should apply bottomless className to last expand item when it is opened', async () => {
        mockProps.stepsState = mockStepTwoChecked;
        render(<CancellationAccordion {...mockProps} />);

        const confirmationItem = screen.getAllByTestId('expand-item')[2];

        await userEvent.click(confirmationItem);

        expect(mockExpandItemProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                title: mockProps.fields.StepThreeTitle.value,
                isOpened: true,
                className: 'bottomless expandableItem',
            }),
        );
    });

    it('Should toggle open state by click on the expand item', async () => {
        mockProps.stepsState = mockStepTwoChecked;
        render(<CancellationAccordion {...mockProps} />);

        const expandedItem = screen.getAllByTestId('expand-item')[0];

        await userEvent.click(expandedItem);

        const newState = mockSetStepsState.mock.calls[0][0](mockStepTwoChecked);

        expect(newState).toEqual({
            ...mockStepTwoChecked,
            HolidaySummary: {
                isOpened: true,
                isDisabled: false,
                isChecked: true,
            },
        });
    });

    it('Should render refunds option for OTUC when OTUC is enabled in sitecore', () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = true;
        render(<CancellationAccordion {...mockProps} />);

        expect(screen.queryByTestId('refund-options')).not.toBeInTheDocument();
        expect(screen.getByTestId('refund-options-otuc')).toBeInTheDocument();
        expect(mockRefundOptionsOTUCProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('Should render refunds option for OTUC when it is Trade Portal', () => {
        mockStores.holidayCreditStore.isOneTimeUseCreditEnabled = false;
        mockStores.layoutStore.isTradePortal = true;
        render(<CancellationAccordion {...mockProps} />);

        expect(screen.queryByTestId('refund-options')).not.toBeInTheDocument();
        expect(screen.getByTestId('refund-options-otuc')).toBeInTheDocument();
        expect(mockRefundOptionsOTUCProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    describe('Handling onContinue click on EntityContainer', () => {
        it('Should make checked and collapsed current expanded step by click on it and open next step', async () => {
            render(<CancellationAccordion {...mockProps} />);

            const [continueButtonFirstStep] = screen.getAllByTestId('entity-container');

            await userEvent.click(continueButtonFirstStep);

            const newState = mockSetStepsState.mock.calls[0][0](mockStepsStateInit);

            expect(newState).toEqual({
                ...mockStepsStateInit,
                HolidaySummary: {
                    isOpened: false,
                    isDisabled: false,
                    isChecked: true,
                },
                RefundOptions: {
                    isOpened: true,
                    isDisabled: false,
                    isChecked: false,
                },
            });
        });

        it('Should call scrollToElement when clicking continue button on mobile viewport', async () => {
            mockUseMobileViewport = true;
            render(<CancellationAccordion {...mockProps} />);

            const [continueButtonFirstStep] = screen.getAllByTestId('entity-container');

            await userEvent.click(continueButtonFirstStep);

            expect(scrollToElement).toHaveBeenCalled();
        });

        it('Should NOT call scrollToElement when clicking continue button on desktop viewport', async () => {
            mockUseMobileViewport = false;
            render(<CancellationAccordion {...mockProps} />);

            const [continueButtonFirstStep] = screen.getAllByTestId('entity-container');

            await userEvent.click(continueButtonFirstStep);

            expect(scrollToElement).not.toHaveBeenCalled();
        });

        it('Should NOT call scrollToElement on mobile when clicking continue on last step', async () => {
            mockUseMobileViewport = true;
            render(<CancellationAccordion {...mockProps} />);

            const [continueButtonFirstStep, continueButtonSecondStep, continueButtonThirdStep] =
                screen.getAllByTestId('entity-container');

            await userEvent.click(continueButtonFirstStep);
            await userEvent.click(continueButtonSecondStep);
            await userEvent.click(continueButtonThirdStep);

            expect(scrollToElement).toHaveBeenCalledTimes(2);
        });
    });

    describe('Step 2 title logic based on cancellationSummary refunds', () => {
        it('should use StepTwoNoRefundTitle when cancellationSummary has no refunds and StepTwoNoRefundTitle has a value', () => {
            mockStores.holidayCreditStore.cancellationSummary = { ...mockCancellationSummary, refunds: [] };

            render(<CancellationAccordion {...mockProps} />);

            expect(mockExpandItemProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ title: mockProps.fields.StepTwoNoRefundTitle.value }),
            );
        });

        it('should fall back to StepTwoTitle when cancellationSummary has no refunds but StepTwoNoRefundTitle is empty', () => {
            mockStores.holidayCreditStore.cancellationSummary = { ...mockCancellationSummary, refunds: [] };
            mockProps.fields = {
                ...mockProps.fields,
                StepTwoNoRefundTitle: { value: '' },
            };

            render(<CancellationAccordion {...mockProps} />);

            expect(mockExpandItemProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ title: mockProps.fields.StepTwoTitle.value }),
            );
        });

        it('should use StepTwoTitle when cancellationSummary has refunds', () => {
            mockStores.holidayCreditStore.cancellationSummary = mockCancellationSummary;

            render(<CancellationAccordion {...mockProps} />);

            expect(mockExpandItemProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ title: mockProps.fields.StepTwoTitle.value }),
            );
        });

        it('should use StepTwoTitle when cancellationSummary is undefined', () => {
            mockStores.holidayCreditStore.cancellationSummary = undefined;

            render(<CancellationAccordion {...mockProps} />);

            expect(mockExpandItemProps).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ title: mockProps.fields.StepTwoTitle.value }),
            );
        });
    });
});
