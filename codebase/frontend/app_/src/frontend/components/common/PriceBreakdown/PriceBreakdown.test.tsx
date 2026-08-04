import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { SwipeDirection } from 'frontend/components/common/InspireMeRopup/InspireMePopup';
import * as utils from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';

import { mockFeesPerPersons, mockPriceBreakdownFields, mockPriceBreakdownItems } from './__mocks__/priceBreakdown';
import PriceBreakdown, { IPriceBreakdownProps } from './PriceBreakdown';

const createMockProps = (): IPriceBreakdownProps => ({
    fields: mockPriceBreakdownFields,
    priceBreakdownItems: mockPriceBreakdownItems,
    totalPrice: 50,
    holidayCredit: 1000,
    currency: CurrencyCode.GBP,
    isLoading: false,
});

const createStore = () =>
    createMockStores({
        marketStore: {
            formatMoney: jest.fn(a => a),
        },
        layoutStore: {
            isTouristTaxEnabled: true,
        },
    });

let mockStores = createStore();
let mockProps = createMockProps();

const mockPriceBreakdownDetailsProps = jest.fn();
jest.mock('./components/PriceBreakdownDetails/PriceBreakdownDetails', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownDetailsProps(props);

        return <div data-tid='price-breakdown-details' />;
    },
}));

const mockPriceBreakdownStickyBarProps = jest.fn();
jest.mock('./components/PriceBreakdownStickyBar/PriceBreakdownStickyBar', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownStickyBarProps(props);

        return (
            <div data-tid='price-breakdown-sticky-bar'>
                <button data-tid='toggle-button-sticky-bar' onClick={props.toggleMobileDrawer} />
            </div>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']}>{props.field.value}</div>;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return (
            <div data-tid={props.dataTid} onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: props => <div data-tid='sticky-box'>{props.render()}</div>,
}));

const mockHeightAnimatedContainer = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: props => {
        mockHeightAnimatedContainer(props);

        return <div data-tid='height-animated-container'>{props.children}</div>;
    },
}));

jest.mock('./components/TouristTaxSummary/TouristTaxSummary', () => ({
    __esModule: true,
    default: () => <div data-tid='tourist-tax-summary' />,
}));

jest.mock('frontend/components/common/PriceBreakdown/components/PriceBreakdownShimmer/PriceBreakdownShimmer', () => ({
    __esModule: true,
    default: () => <div data-tid='price-breakdown-shimmer' />,
}));

const mockEventData = {
    event: {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    },
    dir: SwipeDirection.Down,
    deltaY: -100,
    absY: 100,
};
jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: ({ children, ...props }) => (
        <div
            data-tid='react-swipeable'
            onMouseUp={() => props.onSwiped(mockEventData)}
            onMouseMove={() => props.onSwiping(mockEventData)}
        >
            {children}
        </div>
    ),
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPaymentField = mockPriceBreakdownFields.RefundAmount;
jest.spyOn(utils, 'getPaymentField').mockReturnValue(mockPaymentField);

describe('<PriceBreakdown />', () => {
    beforeEach(() => {
        mockStores = createStore();
        mockProps = createMockProps();
    });

    describe('desktop', () => {
        beforeEach(() => {
            jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
        });

        it('should render standard on desktop', () => {
            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-desktop`)).toBeInTheDocument();

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-title`)).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                tag: 'h4',
                field: mockProps.fields.PriceBreakdownTitle,
                'data-tid': `${utils.DATA_TID_PREFIX}-title`,
            });

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-details`)).toBeInTheDocument();
            expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith({
                totalPrice: mockProps.subTotalPrice,
                feeChargePrice: mockProps.feeChargePrice,
                fields: mockPriceBreakdownFields,
                feesPerPersons: mockProps.feesPerPersons,
                previousBalance: mockProps.previousBalance,
                priceBreakdownItems: mockProps.priceBreakdownItems,
                holidayCredit: mockProps.holidayCredit,
                currency: mockProps.currency,
                totalCostOfChangeField: mockPriceBreakdownFields.TotalCostOfChange,
            });

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-summary`)).toBeInTheDocument();
            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-payment-instructions`)).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                tag: 'span',
                field: mockPaymentField,
                'data-tid': `${utils.DATA_TID_PREFIX}-payment-instructions`,
            });
            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-transaction-amount`)).toHaveTextContent(
                `${mockProps.totalPrice}`,
            );
        });

        it('should render PriceBreakDownShimmer', () => {
            mockProps.isLoading = true;
            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-shimmer')).toBeInTheDocument();
            expect(screen.queryByTestId(`${utils.DATA_TID_PREFIX}-desktop`)).not.toBeInTheDocument();
        });

        it('should pass props correctly when optional props are provided', () => {
            mockProps = {
                ...mockProps,
                feeChargePrice: 100,
                feesPerPersons: mockFeesPerPersons,
                isTradePortal: true,
                previousBalance: 300,
                subTotalPrice: 100,
            };
            render(<PriceBreakdown {...mockProps} />);

            expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith({
                totalPrice: mockProps.subTotalPrice,
                feeChargePrice: mockProps.feeChargePrice,
                fields: mockPriceBreakdownFields,
                feesPerPersons: mockProps.feesPerPersons,
                previousBalance: mockProps.previousBalance,
                priceBreakdownItems: mockProps.priceBreakdownItems,
                holidayCredit: mockProps.holidayCredit,
                currency: mockProps.currency,
                totalCostOfChangeField: mockPriceBreakdownFields.TotalCostOfChange,
            });
        });

        it('should render totalPriceLabelField instead PaymentField when it is provided', () => {
            mockProps.totalPriceLabelField = mockSitecoreField('totalPriceLabelField');

            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-payment-instructions`)).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                tag: 'span',
                field: mockProps.totalPriceLabelField,
                'data-tid': `${utils.DATA_TID_PREFIX}-payment-instructions`,
            });

            expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith({
                totalPrice: mockProps.subTotalPrice,
                feeChargePrice: mockProps.feeChargePrice,
                fields: mockPriceBreakdownFields,
                feesPerPersons: mockProps.feesPerPersons,
                previousBalance: mockProps.previousBalance,
                priceBreakdownItems: mockProps.priceBreakdownItems,
                holidayCredit: mockProps.holidayCredit,
                currency: mockProps.currency,
                totalCostOfChangeField: mockProps.totalPriceLabelField,
            });
        });

        it('should render priceBreakdownTitle prop instead PriceBreakdownTitle field when it is provided', () => {
            mockProps.priceBreakdownTitle = mockSitecoreField('priceBreakdownTitleField');

            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-title`)).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                tag: 'h4',
                field: mockProps.priceBreakdownTitle,
                'data-tid': `${utils.DATA_TID_PREFIX}-title`,
            });
        });
    });

    describe('mobile', () => {
        beforeEach(() => {
            jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
        });

        it('should render sticky bar on mobile', () => {
            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-sticky-bar`)).toBeInTheDocument();
            expect(mockPriceBreakdownStickyBarProps).toHaveBeenCalledWith({
                title: mockProps.fields.PriceBreakdownTitle,
                paymentField: mockProps.fields.RefundAmount,
                transactionAmount: mockProps.totalPrice,
                isMobileDrawerOpened: false,
                toggleMobileDrawer: expect.any(Function),
                paidToUsTextNode: null,
            });
        });

        it('should render PriceBreakDownShimmer', () => {
            mockProps.isLoading = true;
            render(<PriceBreakdown {...mockProps} />);

            expect(screen.getByTestId('price-breakdown-shimmer')).toBeInTheDocument();
            expect(screen.queryByTestId(`${utils.DATA_TID_PREFIX}-sticky-bar`)).not.toBeInTheDocument();
        });

        it('should open swipeable drawer when it is opened by click', async () => {
            render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId(`toggle-button-sticky-bar`);
            await userEvent.click(toggleButton);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-drawer`)).toBeInTheDocument();

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-swipe`)).toBeInTheDocument();

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-title`)).toBeInTheDocument();
            expect(mockTextProps).toHaveBeenCalledWith({
                tag: 'h4',
                field: mockProps.fields.PriceBreakdownTitle,
                'data-tid': `${utils.DATA_TID_PREFIX}-title`,
                className: 'title',
            });

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-details`)).toBeInTheDocument();
            expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith({
                totalPrice: mockProps.subTotalPrice,
                feeChargePrice: mockProps.feeChargePrice,
                fields: mockPriceBreakdownFields,
                feesPerPersons: mockProps.feesPerPersons,
                previousBalance: mockProps.previousBalance,
                priceBreakdownItems: mockProps.priceBreakdownItems,
                holidayCredit: mockProps.holidayCredit,
                currency: mockProps.currency,
                totalCostOfChangeField: mockPriceBreakdownFields.TotalCostOfChange,
                touristTaxSummaryNode: null,
            });
        });

        it('should render sticky footer correctly when no price change', () => {
            mockProps.totalPrice = 0;
            mockProps.totalPriceLabelField = mockProps.fields.PayNow;
            render(<PriceBreakdown {...mockProps} />);

            expect(screen.queryByText(mockProps.fields.RefundAmount.value)).not.toBeInTheDocument();
        });

        it('should close swipeable drawer when it is on the second click', async () => {
            render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId('toggle-button-sticky-bar');

            await userEvent.click(toggleButton);

            expect(mockHeightAnimatedContainer).toHaveBeenNthCalledWith(2, {
                isOpened: true,
                children: expect.anything(),
            });

            await userEvent.click(toggleButton);

            expect(mockHeightAnimatedContainer).toHaveBeenNthCalledWith(3, {
                isOpened: false,
                children: expect.anything(),
            });
        });

        it('should NOT close drawer when swipe is less then MIN_SWIPE_DISTANCE', async () => {
            mockEventData.deltaY = -20;
            render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
            await userEvent.click(toggleButton);

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-drawer`)).toBeInTheDocument();
            const swipeableElement = screen.getByTestId('react-swipeable');

            fireEvent.mouseMove(swipeableElement);
            fireEvent.mouseUp(swipeableElement);

            await waitFor(() => {
                expect(screen.queryByTestId(`${utils.DATA_TID_PREFIX}-drawer`)).toBeInTheDocument();
            });
        });

        it('should close drawer when swipe is more then MIN_SWIPE_DISTANCE', async () => {
            mockEventData.deltaY = -100;
            render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
            await userEvent.click(toggleButton);

            expect(mockHeightAnimatedContainer).toHaveBeenNthCalledWith(2, {
                isOpened: true,
                children: expect.anything(),
            });

            expect(screen.getByTestId(`${utils.DATA_TID_PREFIX}-drawer`)).toBeInTheDocument();
            const swipeableElement = screen.getByTestId('react-swipeable');

            fireEvent.mouseMove(swipeableElement);
            fireEvent.mouseUp(swipeableElement);

            expect(mockHeightAnimatedContainer).toHaveBeenNthCalledWith(4, {
                isOpened: false,
                children: expect.anything(),
            });
        });

        it('should close drawer when it was click on background', async () => {
            render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
            await userEvent.click(toggleButton);

            const background = screen.getByTestId(`${utils.DATA_TID_PREFIX}-background`);
            await userEvent.click(background);

            expect(mockHeightAnimatedContainer).toHaveBeenNthCalledWith(3, {
                isOpened: false,
                children: expect.anything(),
            });
        });

        it('should remove event listener when viewport changes', async () => {
            jest.mocked(useMoreThenMobileViewport).mockReturnValueOnce(false).mockReturnValueOnce(true);
            const addEventListenerSpy = jest
                .spyOn(document.body, 'addEventListener')
                .mockImplementation(() => jest.fn());
            const removeEventListenerSpy = jest
                .spyOn(document.body, 'removeEventListener')
                .mockImplementation(() => jest.fn());

            const { rerender } = render(<PriceBreakdown {...mockProps} />);

            const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
            await userEvent.click(toggleButton);

            expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
            rerender(<PriceBreakdown {...mockProps} />);

            expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
        });
    });

    describe('tourist tax', () => {
        const touristTaxData = {
            hasTouristTax: true,
            newTaxesAndFees: [],
            newTouristTaxConverted: 10,
            prevTouristTax: 5,
        };
        const touristTaxFields = {
            paidToUsLabel: 'Paid to us',
            prevTaxLabel: 'Previous tax',
            newTaxLabel: 'New tax',
            newTaxPopupTitle: 'Tooltip title',
            newTaxPopupContent: 'Tooltip content',
        };

        describe('desktop', () => {
            beforeEach(() => {
                jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
            });

            it('should render taxBreakdownContainer with TouristTaxSummary when hasTouristTax is true', () => {
                mockProps = { ...mockProps, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                expect(screen.getByTestId('tourist-tax-summary')).toBeInTheDocument();
            });

            it('should NOT render taxBreakdownContainer when hasTouristTax is false', () => {
                mockProps = {
                    ...mockProps,
                    touristTaxData: { ...touristTaxData, hasTouristTax: false },
                    touristTaxFields,
                };
                render(<PriceBreakdown {...mockProps} />);

                expect(screen.queryByTestId('tourist-tax-summary')).not.toBeInTheDocument();
            });

            it('should NOT render taxBreakdownContainer when isTouristTaxEnabled is false', () => {
                mockStores = createMockStores({
                    marketStore: { formatMoney: jest.fn(a => a) },
                    layoutStore: { isTouristTaxEnabled: false },
                });
                mockProps = { ...mockProps, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                expect(screen.queryByTestId('tourist-tax-summary')).not.toBeInTheDocument();
            });

            it('should render paidToUsLabel when hasTouristTax is true and totalPrice is positive', () => {
                mockProps = { ...mockProps, totalPrice: 50, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                expect(screen.getByText(touristTaxFields.paidToUsLabel)).toBeInTheDocument();
            });

            it('should NOT render paidToUsLabel when totalPrice is negative (refund)', () => {
                mockProps = { ...mockProps, totalPrice: -50, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                expect(screen.queryByText(touristTaxFields.paidToUsLabel)).not.toBeInTheDocument();
            });
        });

        describe('mobile', () => {
            beforeEach(() => {
                jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
            });

            it('should pass touristTaxSummaryNode to PriceBreakdownDetails when hasTouristTax is true', async () => {
                mockProps = { ...mockProps, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
                await userEvent.click(toggleButton);

                expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith(
                    expect.objectContaining({ touristTaxSummaryNode: expect.anything() }),
                );
            });

            it('should pass paidToUsTextNode to PriceBreakdownStickyBar when hasTouristTax is true and totalPrice is positive', () => {
                mockProps = { ...mockProps, totalPrice: 50, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                expect(mockPriceBreakdownStickyBarProps).toHaveBeenCalledWith(
                    expect.objectContaining({ paidToUsTextNode: expect.anything() }),
                );
            });

            it('should pass touristTaxSummaryNode as null to PriceBreakdownDetails when isTouristTaxEnabled is false', async () => {
                mockStores = createMockStores({
                    marketStore: { formatMoney: jest.fn(a => a) },
                    layoutStore: { isTouristTaxEnabled: false },
                });
                mockProps = { ...mockProps, touristTaxData, touristTaxFields };
                render(<PriceBreakdown {...mockProps} />);

                const toggleButton = screen.getByTestId('toggle-button-sticky-bar');
                await userEvent.click(toggleButton);

                expect(mockPriceBreakdownDetailsProps).toHaveBeenCalledWith(
                    expect.objectContaining({ touristTaxSummaryNode: null }),
                );
            });
        });
    });
});
