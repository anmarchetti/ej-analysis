import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockCancellationSummary } from 'frontend/__mocks__/cancellationSummary';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { CreditType } from 'models/enum/CreditType';
import { RefundOption } from 'models/enum/RefundOptions';

import { cancelBookingFieldsMock, refundOptionsFieldsMock, refundOptionsOTUCFieldsMock } from './__mocks__/mockFields';
import { mockStepOneChecked, mockStepsStateInit } from './__mocks__/mockState';
import {
    filterPriceBreakdownItems,
    generateInitialStateFromSteps,
    getRefundPopupContent,
    getRefundPopupContentTrade,
    RefundPopups,
    RefundStep,
    usePriceBreakdown,
} from './CancelBooking.utils';

const createStores = () =>
    createMockStores({
        holidayCreditStore: {
            booking: mockBooking,
            cancellationSummary: mockCancellationSummary,
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

let mockGetTotalPaidAmount = 100;
jest.mock('frontend/utils/payment.utls', () => ({
    __esModule: true,
    getTotalPaidAmount: jest.fn(() => mockGetTotalPaidAmount),
}));

describe('CancelBooking.utils', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    describe('generateInitialStateFromSteps', () => {
        it('Should generate initial state fot accordion steps', () => {
            const result = generateInitialStateFromSteps();

            expect(result).toStrictEqual({
                [RefundStep.HolidaySummary]: { isOpened: true, isDisabled: false, isChecked: false },
                [RefundStep.RefundOptions]: { isOpened: false, isDisabled: true, isChecked: false },
                [RefundStep.Confirmation]: { isOpened: false, isDisabled: true, isChecked: false },
            });
        });
    });

    describe('filterPriceBreakdownItems', () => {
        it('Should filter out items with 0 amount', () => {
            const items = [
                { amount: 100, breakdownTitle: 'Item 1' },
                { amount: 0, breakdownTitle: 'Item 2' },
                {
                    amount: -50,
                    breakdownTitle: 'Item 3',
                    subItems: [
                        {
                            amount: 0,
                            title: 'Subitem 1',
                        },
                        { amount: -50, title: 'Subitem 2' },
                    ],
                },
            ];
            const result = filterPriceBreakdownItems(items);
            expect(result).toStrictEqual([
                { amount: 100, breakdownTitle: 'Item 1', subItems: undefined },
                {
                    amount: -50,
                    breakdownTitle: 'Item 3',
                    subItems: [{ amount: -50, title: 'Subitem 2', className: 'chargeFeeRowEnd' }],
                },
            ]);
        });
    });

    describe('usePriceBreakdown', () => {
        beforeEach(() => {
            refundOptionsOTUCFieldsMock.Children[0].fields.RefundUniqueId.value = 'Credit';
        });

        it('Should return empty array and 0 when no fields provided', () => {
            const result = usePriceBreakdown(mockStepsStateInit, undefined, false);

            expect(result).toStrictEqual({ priceBreakdownItems: [], totalRefund: 0 });
        });

        it('Should return empty array and 0 when no booking provided', () => {
            mockStores.holidayCreditStore.booking = undefined;
            const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

            expect(result).toStrictEqual({ priceBreakdownItems: [], totalRefund: 0 });
        });

        describe('HolidaySummary step checked', () => {
            it('Should return price breakdown with only deposit item when only deposit was paid', () => {
                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(1);
                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: 'Deposit Globals.PriceLabels.PerPerson £150',
                    amount: 300,
                    subItems: undefined,
                });
                expect(result.totalRefund).toBe(mockGetTotalPaidAmount);
            });

            it('Should return price breakdown without deposit item when deposit was NOT paid', () => {
                mockStores.holidayCreditStore.booking.paymentInfo.depositPrice = 0;
                mockStores.holidayCreditStore.booking.paymentInfo.totalPrice = 100;
                mockStores.holidayCreditStore.booking.paymentInfo.paymentHistory = [{ amount: 20 }, { amount: 5 }];

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(1);
                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.AmountPaidExcludeDeposit.value,
                    amount: 100,
                    subItems: undefined,
                });
                expect(result.totalRefund).toBe(mockGetTotalPaidAmount);
            });

            it('Should return price breakdown with deposit and paid amount items', () => {
                mockStores.holidayCreditStore.booking.paymentInfo.depositPrice = 50;
                mockStores.holidayCreditStore.booking.paymentInfo.totalPrice = 200;
                mockStores.holidayCreditStore.booking.paymentInfo.paymentHistory = [{ amount: 50 }, { amount: 70 }];

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(2);
                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.AmountPaidExcludeDeposit.value,
                    amount: 50,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems[1]).toStrictEqual({
                    breakdownTitle: 'Deposit Globals.PriceLabels.PerPerson £25',
                    amount: 50,
                    subItems: undefined,
                });
                expect(result.totalRefund).toBe(mockGetTotalPaidAmount);
            });

            it('Should return price breakdown with deposit, paid amount and fees items', () => {
                mockStores.holidayCreditStore.booking.paymentInfo.depositPrice = 50;
                mockStores.holidayCreditStore.booking.paymentInfo.totalPrice = 200;
                mockStores.holidayCreditStore.booking.paymentInfo.paymentHistory = [{ amount: 50 }, { amount: 70 }];
                mockStores.holidayCreditStore.cancellationSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 20,
                };

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(3);
                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.AmountPaidExcludeDeposit.value,
                    amount: 30,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems[1]).toStrictEqual({
                    breakdownTitle: 'Deposit Globals.PriceLabels.PerPerson £25',
                    amount: 50,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems[2]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.ChangeFeeLabel.value,
                    amount: 20,
                    subItems: undefined,
                });
                expect(result.totalRefund).toBe(mockGetTotalPaidAmount);
            });

            it('should return amendment fee as 0 and filter it out when cancellation summary amendmentFeeAmount is undefined', () => {
                mockStores.holidayCreditStore.booking.paymentInfo.depositPrice = 50;
                mockStores.holidayCreditStore.booking.paymentInfo.totalPrice = 200;
                mockStores.holidayCreditStore.booking.paymentInfo.paymentHistory = [{ amount: 50 }, { amount: 70 }];
                mockStores.holidayCreditStore.cancellationSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: undefined,
                };

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(2);
            });

            it('should return right total price for price breakdown items for Trade Portal', () => {
                mockStores.layoutStore.isTradePortal = true;
                mockStores.holidayCreditStore.booking.paymentInfo = {
                    paymentHistory: [{ amount: 50 }, { amount: 50 }],
                    depositPrice: 50,
                };
                mockStores.holidayCreditStore.cancellationSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 50,
                    originalBookingValue: 300,
                };

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.AmountPaidExcludeDeposit.value,
                    amount: 200,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems[1]).toStrictEqual({
                    breakdownTitle: 'Deposit Globals.PriceLabels.PerPerson £25',
                    amount: 50,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems[2]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.ChangeFeeLabel.value,
                    amount: 50,
                    subItems: undefined,
                });
                expect(result.priceBreakdownItems.length).toBe(3);
            });

            it('should render only total paid amount for Trade Portal when original booking value is less than deposit price', () => {
                mockStores.layoutStore.isTradePortal = true;
                mockStores.holidayCreditStore.booking.paymentInfo.depositPrice = 120;
                mockCancellationSummary.originalBookingValue = 100;

                const result = usePriceBreakdown(mockStepsStateInit, cancelBookingFieldsMock, false);

                expect(result.priceBreakdownItems.length).toBe(1);
                expect(result.priceBreakdownItems[0]).toStrictEqual({
                    breakdownTitle: cancelBookingFieldsMock.AmountPaidExcludeDeposit.value,
                    amount: 100,
                    subItems: undefined,
                    showZeroAmount: true,
                });
            });
        });

        describe('OTUC is disabled', () => {
            it('Should generate price breakdown based on selected refund type: credit', () => {
                const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, false);

                const expectedRefundFields = refundOptionsFieldsMock.find(item => {
                    const refundType = CreditType[item.fields.RefundUniqueId.value];

                    return refundType === CreditType.Credit;
                })?.fields;

                expect(result).toStrictEqual({
                    priceBreakdownItems: [
                        {
                            breakdownTitle: cancelBookingFieldsMock.PaidLabel.value,
                            amount: 100,
                            className: 'paidTotal',
                            uniqueKey: 'totalPaid',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: cancelBookingFieldsMock.CancellationChargeLabel.value,
                            amount: 20,
                            className: 'chargeFee',
                            uniqueKey: 'feeRefund',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: expectedRefundFields?.CreditLabel.value,
                            amount: mockBooking.refund.credit.credit,
                            uniqueKey: 'creditRefund',
                            subItems: undefined,
                        },
                    ],
                    totalRefund: mockBooking.refund.credit.credit,
                });
            });

            it('Should generate price breakdown based on selected refund type: refund', () => {
                mockStores.holidayCreditStore.selectedRefundType = CreditType.Refund;
                const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, false);

                const expectedRefundFields = refundOptionsFieldsMock.find(item => {
                    const refundType = CreditType[item.fields.RefundUniqueId.value];

                    return refundType === CreditType.Refund;
                })?.fields;

                expect(result).toStrictEqual({
                    priceBreakdownItems: [
                        {
                            breakdownTitle: cancelBookingFieldsMock.PaidLabel.value,
                            amount: 100,
                            className: 'paidTotal',
                            uniqueKey: 'totalPaid',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: cancelBookingFieldsMock.CancellationChargeLabel.value,
                            amount: 20,
                            className: 'chargeFee',
                            uniqueKey: 'feeRefund',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: expectedRefundFields?.CreditLabel.value,
                            amount: mockBooking.refund.refund.credit,
                            uniqueKey: 'creditRefund',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: expectedRefundFields?.CashLabel.value,
                            amount: mockBooking.refund.refund.cash,
                            uniqueKey: 'cashRefund',
                            subItems: undefined,
                        },
                    ],
                    totalRefund: mockBooking.refund.refund.credit! + mockBooking.refund.refund.cash!,
                });
            });

            it('Should return empty array when no fields provided for selected refund option', () => {
                mockStores.holidayCreditStore.selectedRefundType = CreditType.Refund;
                const fieldsMock = {
                    ...cancelBookingFieldsMock,
                    Children: [refundOptionsFieldsMock[0]],
                };

                const result = usePriceBreakdown(mockStepOneChecked, fieldsMock, false);

                expect(result).toStrictEqual({ priceBreakdownItems: [], totalRefund: 120 });
            });
        });

        describe('One Time Use Credit', () => {
            it('Should return price breakdown with total and fee when no selected refund', () => {
                mockStores.holidayCreditStore.selectedRefundOTUC = undefined;
                const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, true);

                expect(result).toStrictEqual({
                    priceBreakdownItems: [
                        {
                            amount: 100,
                            breakdownTitle: cancelBookingFieldsMock.PaidLabel.value,
                            className: 'paidTotal',
                            uniqueKey: 'totalPaid',
                            subItems: undefined,
                            showZeroAmount: false,
                        },
                        {
                            amount: -100,
                            breakdownTitle: cancelBookingFieldsMock.CancellationChargeTotalLabel.value,
                            className: 'chargeFee',
                            uniqueKey: 'feeRefund',
                            subItems: [
                                {
                                    amount: -100,
                                    title: cancelBookingFieldsMock.CancellationChargeLabel.value,
                                    className: 'chargeFeeRowEnd',
                                },
                            ],
                        },
                    ],
                    totalRefund: 0,
                });
            });

            it('Should return an empty price breakdown when no sitecore content set up for refund', () => {
                mockStores.holidayCreditStore.selectedRefundOTUC = mockCancellationSummary.refunds[1];
                const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, true);

                expect(result).toStrictEqual({
                    priceBreakdownItems: [],
                    totalRefund: 0,
                });
            });

            it('Should return price breakdown for selected refund', () => {
                mockStores.holidayCreditStore.selectedRefundOTUC = mockCancellationSummary.refunds[0];
                mockStores.holidayCreditStore.cancellationSummary.amendmentFeeAmount = 50;
                mockGetTotalPaidAmount = 320;
                const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, true);

                const selectedRefundOTUC = mockStores.holidayCreditStore.selectedRefundOTUC;
                const expectedRefundFields = refundOptionsFieldsMock.find(
                    item => item.fields.RefundUniqueId.value === selectedRefundOTUC.refundOption,
                )?.fields;

                expect(result).toStrictEqual({
                    priceBreakdownItems: [
                        {
                            breakdownTitle: cancelBookingFieldsMock.PaidLabel.value,
                            amount: mockGetTotalPaidAmount,
                            className: 'paidTotal',
                            uniqueKey: 'totalPaid',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: cancelBookingFieldsMock.CancellationChargeTotalLabel.value,
                            amount: -170,
                            uniqueKey: 'feeRefund',
                            subItems: [
                                {
                                    amount: -120,
                                    title: cancelBookingFieldsMock.CancellationChargeLabel.value,
                                },
                                {
                                    amount: -50,
                                    title: cancelBookingFieldsMock.ChangeFeeLabel.value,
                                    className: 'chargeFeeRowEnd',
                                },
                            ],
                        },
                        {
                            breakdownTitle: expectedRefundFields?.CreditLabel.value,
                            amount: selectedRefundOTUC.credit + selectedRefundOTUC.oneTimeUseCredit,
                            uniqueKey: 'creditRefund',
                            subItems: undefined,
                        },
                        {
                            breakdownTitle: expectedRefundFields?.CashLabel.value,
                            amount: selectedRefundOTUC.originalPayment,
                            uniqueKey: 'cashRefund',
                            subItems: undefined,
                        },
                    ],
                    totalRefund: selectedRefundOTUC.total,
                });
            });
        });

        it('Should return price breakdown for selected refund for Trade portal', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.holidayCreditStore.cancellationSummary = {
                currency: 'GBP',
                daysBeforeDeparture: 60,
                oneTimeUseCreditTotalPaid: 0,
                refundBreakdownValidationHash: 777,
                originalBookingValue: 500,
                refunds: [
                    {
                        credit: 0,
                        oneTimeUseCredit: 0,
                        refundOption: RefundOption.Credit,
                        total: 400,
                        originalPayment: 400,
                    },
                ],
                isDestinationRulesApplied: false,
                amendmentFeeAmount: 50,
            };
            mockStores.holidayCreditStore.selectedRefundOTUC =
                mockStores.holidayCreditStore.cancellationSummary.refunds[0];
            mockStores.holidayCreditStore.booking.paymentInfo = {
                paymentHistory: [{ amount: 50 }, { amount: 50 }],
                totalPrice: 500,
                depositPrice: 50,
            };
            const result = usePriceBreakdown(mockStepOneChecked, cancelBookingFieldsMock, true);

            const selectedRefundOTUC = mockStores.holidayCreditStore.selectedRefundOTUC;
            const expectedRefundFields = refundOptionsFieldsMock.find(
                item => item.fields.RefundUniqueId.value === selectedRefundOTUC.refundOption,
            )?.fields;

            expect(result).toStrictEqual({
                priceBreakdownItems: [
                    {
                        breakdownTitle: cancelBookingFieldsMock.PaidLabel.value,
                        amount: 500,
                        className: 'paidTotal',
                        uniqueKey: 'totalPaid',
                        subItems: undefined,
                    },
                    {
                        breakdownTitle: cancelBookingFieldsMock.CancellationChargeTotalLabel.value,
                        amount: -100,
                        uniqueKey: 'feeRefund',
                        subItems: [
                            {
                                amount: -50,
                                title: cancelBookingFieldsMock.CancellationChargeLabel.value,
                            },
                            {
                                amount: -50,
                                title: cancelBookingFieldsMock.ChangeFeeLabel.value,
                                className: 'chargeFeeRowEnd',
                            },
                        ],
                    },
                    {
                        breakdownTitle: expectedRefundFields?.CashLabel.value,
                        amount: selectedRefundOTUC.originalPayment,
                        uniqueKey: 'cashRefund',
                        subItems: undefined,
                    },
                ],
                totalRefund: selectedRefundOTUC.total,
            });
        });
    });

    describe('getRefundPopupContentTrade', () => {
        it('Should return TradeBookingNoPaymentMade content type when isTradePortal is true and no payment made', () => {
            mockCancellationSummary.originalBookingValue = 0;
            const result = getRefundPopupContentTrade(mockCancellationSummary, mockBooking.paymentInfo.depositPrice);

            expect(result).toStrictEqual(RefundPopups.TradeBookingNoPaymentMade);
        });

        it('Should return TradeBookingDepositOnlyPaid content type when isTradePortal is true and only deposit paid', () => {
            mockCancellationSummary.originalBookingValue = 120;

            const result = getRefundPopupContentTrade(mockCancellationSummary, 200);

            expect(result).toStrictEqual(RefundPopups.TradeBookingDepositOnlyPaid);
        });

        it('Should return TradePortalRefund content type when isTradePortal is true', () => {
            mockCancellationSummary.originalBookingValue = 500;
            const result = getRefundPopupContentTrade(mockCancellationSummary, mockBooking.paymentInfo.depositPrice);

            expect(result).toStrictEqual(RefundPopups.TradeBookingRefund);
        });

        it('Should return TradeBookingPaidLessThanTotalCharge content type when isTradePortal is true and original booking value is less than total cancellation charge and deposit is NOT paid', () => {
            mockCancellationSummary.originalBookingValue = 150;
            mockCancellationSummary.cancellationFee = 100;
            mockCancellationSummary.amendmentFeeAmount = 50;

            const result = getRefundPopupContentTrade(mockCancellationSummary, 0);

            expect(result).toStrictEqual(RefundPopups.TradeBookingPaidLessThanTotalCharge);
        });
    });

    describe('getRefundPopupContent', () => {
        const maxDaysBeforeDeparture = 60;

        it('Should return DestinationRulesApplied content type when destinations rules applied for no fee refund', () => {
            mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 300;
            const mockSummary = {
                ...mockCancellationSummary,
                daysBeforeDeparture: 40,
            };
            const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture, true);

            expect(result).toStrictEqual(RefundPopups.DestinationRulesApplied);
        });

        describe('bookings less then 60 days before departure', () => {
            it('Should return DepositLess60Days content type for bookings with only paid deposit', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 50;
                const mockSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 50,
                    daysBeforeDeparture: 40,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositLess60Days);
            });

            it('Should return DepositBalanceLess60Days content type for bookings less then 60 days before departure and with deposit and balance paid', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 300;
                const mockSummary = {
                    ...mockCancellationSummary,
                    daysBeforeDeparture: 40,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositBalanceLess60Days);
            });
        });

        describe('bookings equal or more then 60 days before departure', () => {
            it('Should return DepositNoOTUC content type when deposit paid with NO OTUC', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 50;
                const mockSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 50,
                    oneTimeUseCreditTotalPaid: 0,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositNoOTUC);
            });

            it('Should return DepositFullOTUC content type when deposit paid with FULL OTUC', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 50;
                const mockSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 50,
                    oneTimeUseCreditTotalPaid: mockBooking.paymentInfo.depositPrice,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositFullOTUC);
            });

            it('Should return DepositPartialOTUC content type when deposit paid with PARTIAL OTUC', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 50;
                const mockSummary = {
                    ...mockCancellationSummary,
                    oneTimeUseCreditTotalPaid: 100,
                    amendmentFeeAmount: 50,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositPartialOTUC);
            });

            it('Should return DepositBalanceNoOTUC content type when deposit and balance paid with NO OTUC', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 300;
                const mockSummary = {
                    ...mockCancellationSummary,
                    oneTimeUseCreditTotalPaid: 0,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositBalanceNoOTUC);
            });

            it('Should return DepositBalanceFullOTUC content type when deposit was paid with FULL OTUC and balance was paid', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 300;
                const mockSummary = {
                    ...mockCancellationSummary,
                    oneTimeUseCreditTotalPaid: mockBooking.paymentInfo.depositPrice + 100,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositBalanceFullOTUC);
            });

            it('Should return DepositBalancePartialOTUC content type when deposit was paid with PARTIAL OTUC and balance was paid', () => {
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 300;
                const mockSummary = {
                    ...mockCancellationSummary,
                    oneTimeUseCreditTotalPaid: mockBooking.paymentInfo.depositPrice / 2,
                };
                const result = getRefundPopupContent(mockSummary, mockBooking.paymentInfo, maxDaysBeforeDeparture);

                expect(result).toStrictEqual(RefundPopups.DepositBalancePartialOTUC);
            });
        });

        describe('isFlightAndHotelPackage / getRefundContentFlightAndHotel', () => {
            it('Should return FlightPlusHotelNonRefundable when isFlightAndHotelPackage is true and refunds is empty', () => {
                const mockSummary = {
                    ...mockCancellationSummary,
                    refunds: [],
                    amendmentFeeAmount: 0,
                };
                const result = getRefundPopupContent(
                    mockSummary,
                    mockBooking.paymentInfo,
                    maxDaysBeforeDeparture,
                    false,
                    true,
                );

                expect(result).toStrictEqual(RefundPopups.FlightPlusHotelNonRefundable);
            });

            it('Should return FlightPlusHotelRefundable when isFlightAndHotelPackage is true, refunds exist and no amendment fee', () => {
                const mockSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 0,
                };
                const result = getRefundPopupContent(
                    mockSummary,
                    mockBooking.paymentInfo,
                    maxDaysBeforeDeparture,
                    false,
                    true,
                );

                expect(result).toStrictEqual(RefundPopups.FlightPlusHotelRefundable);
            });

            it('Should return FlightPlusHotelPartiallyRefundable when isFlightAndHotelPackage is true, refunds exist and amendment fee is set', () => {
                const mockSummary = {
                    ...mockCancellationSummary,
                    amendmentFeeAmount: 50,
                };
                const result = getRefundPopupContent(
                    mockSummary,
                    mockBooking.paymentInfo,
                    maxDaysBeforeDeparture,
                    false,
                    true,
                );

                expect(result).toStrictEqual(RefundPopups.FlightPlusHotelPartiallyRefundable);
            });

            it('Should NOT use FlightPlusHotelPackage logic when isFlightAndHotelPackage is false', () => {
                const mockSummary = {
                    ...mockCancellationSummary,
                    refunds: [],
                    amendmentFeeAmount: 0,
                    daysBeforeDeparture: 40,
                };
                mockGetTotalPaidAmount = mockBooking.paymentInfo.depositPrice + 50;
                const result = getRefundPopupContent(
                    mockSummary,
                    mockBooking.paymentInfo,
                    maxDaysBeforeDeparture,
                    false,
                    false,
                );

                expect(result).not.toStrictEqual(RefundPopups.FlightPlusHotelNonRefundable);
            });
        });
    });
});
