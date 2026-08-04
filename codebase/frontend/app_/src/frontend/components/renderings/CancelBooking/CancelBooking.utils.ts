import { NEGATIVE_INDEX, TWO } from 'code/commonNumbers';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { getTotalPaidAmount } from 'frontend/utils/payment.utls';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { ICancellationSummaryResponse } from 'models/data/MyCreditInfo';
import { CreditType } from 'models/enum/CreditType';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IPriceBreakdownItem } from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';

import { ICancelBookingFields } from './CancelBooking';

import styles from './CancelBooking.module.scss';

enum PriceBreakdownKeys {
    TotalPaid = 'totalPaid',
    FeeRefund = 'feeRefund',
    CreditRefund = 'creditRefund',
    CashRefund = 'cashRefund',
}

export enum RefundStep {
    HolidaySummary = 'HolidaySummary',
    RefundOptions = 'RefundOptions',
    Confirmation = 'Confirmation',
}

export enum RefundPopups {
    DepositBalanceNoOTUC = 'DepositBalanceNoOTUC',
    DepositBalancePartialOTUC = 'DepositBalancePartialOTUC',
    DepositBalanceFullOTUC = 'DepositBalanceFullOTUC',
    DepositBalanceLess60Days = 'DepositBalanceLess60Days',
    DepositNoOTUC = 'DepositNoOTUC',
    DepositPartialOTUC = 'DepositPartialOTUC',
    DepositLess60Days = 'DepositLess60Days',
    DepositFullOTUC = 'DepositFullOTUC',
    Credit = 'Credit',
    Refund = 'Refund',
    DestinationRulesApplied = 'DestinationRulesApplied',
    TradeBookingRefund = 'TradeBookingRefund',
    TradeBookingDepositOnlyPaid = 'TradeBookingDepositOnlyPaid',
    TradeBookingNoPaymentMade = 'TradeBookingNoPaymentMade',
    TradeBookingPaidLessThanTotalCharge = 'TradeBookingPaidLessThanTotalCharge',
    FlightPlusHotelNonRefundable = 'FlightPlusHotelNonRefundable',
    FlightPlusHotelRefundable = 'FlightPlusHotelRefundable',
    FlightPlusHotelPartiallyRefundable = 'FlightPlusHotelPartiallyRefundable',
}

export const DEFAULT_STEPS = [RefundStep.HolidaySummary, RefundStep.RefundOptions, RefundStep.Confirmation];

export type TRefundStepState = Record<
    RefundStep,
    {
        isChecked: boolean;
        isDisabled: boolean;
        isOpened: boolean;
    }
>;

export interface IPriceBreakdownItemWithFlag extends IPriceBreakdownItem {
    showZeroAmount?: boolean;
}

export const generateInitialStateFromSteps = (): TRefundStepState =>
    DEFAULT_STEPS.reduce((steps, currentStep) => {
        const isEntityStep = currentStep === RefundStep.HolidaySummary;

        return { ...steps, [currentStep]: { isOpened: isEntityStep, isDisabled: !isEntityStep, isChecked: false } };
    }, {} as TRefundStepState);

export const filterPriceBreakdownItems = (items: IPriceBreakdownItemWithFlag[]): IPriceBreakdownItem[] =>
    items
        .filter(item => item.amount !== 0 || item.showZeroAmount)
        .map(item => {
            const filteredSubItems = item.subItems?.filter(subItem => subItem.amount !== 0);

            const lastItemIndex = filteredSubItems ? filteredSubItems.length - 1 : -1;

            if (lastItemIndex >= 0 && filteredSubItems) {
                filteredSubItems[lastItemIndex] = {
                    ...filteredSubItems[lastItemIndex],
                    className: styles.chargeFeeRowEnd,
                };
            }

            return {
                ...item,
                subItems: filteredSubItems,
            };
        });

export const getPriceBreakdownOldLogic = (
    fields: ICancelBookingFields,
    selectedRefundType: CreditType | undefined,
    totalPayment: number,
    refund: IBookingRefund,
): { priceBreakdownItems: IPriceBreakdownItem[]; totalRefund: number } => {
    const selectedRefundOptionFields = fields.Children.find(item => {
        const refundType = CreditType[item.fields.RefundUniqueId.value];

        return refundType === selectedRefundType;
    })?.fields;

    const totalRefund = getTotalBookingRefund(selectedRefundType === CreditType.Credit, refund);

    if (!selectedRefundOptionFields) return { priceBreakdownItems: [], totalRefund };

    const refundType = CreditType[selectedRefundOptionFields.RefundUniqueId.value];

    const priceBreakdownItems = [
        {
            breakdownTitle: fields.PaidLabel.value,
            amount: totalPayment,
            className: styles.paidTotal,
            uniqueKey: PriceBreakdownKeys.TotalPaid,
        },
        {
            breakdownTitle: fields.CancellationChargeLabel.value,
            amount: totalRefund - totalPayment,
            className: styles.chargeFee,
            uniqueKey: PriceBreakdownKeys.FeeRefund,
        },
        {
            breakdownTitle: selectedRefundOptionFields.CreditLabel.value,
            amount: refund[refundType]?.credit || 0,
            uniqueKey: PriceBreakdownKeys.CreditRefund,
        },
        {
            breakdownTitle: selectedRefundOptionFields.CashLabel.value,
            amount: refund[refundType]?.cash || 0,
            uniqueKey: PriceBreakdownKeys.CashRefund,
        },
    ];

    return { priceBreakdownItems, totalRefund };
};

export const usePriceBreakdown = (
    stepsState: TRefundStepState,
    fields: ICancelBookingFields | undefined,
    isOneTimeUseCreditEnabled: boolean,
): { priceBreakdownItems: IPriceBreakdownItem[]; totalRefund: number } => {
    const {
        booking,
        selectedRefundType,
        selectedRefundOTUC,
        getPhrase,
        formatMoney,
        cancellationSummary,
        isTradePortal,
    } = useStore((stores: TStores) => ({
        booking: stores.holidayCreditStore.booking,
        selectedRefundType: isHolidayStore(stores) ? stores.holidayCreditStore.selectedRefundType : undefined,
        selectedRefundOTUC: stores.holidayCreditStore.selectedRefundOTUC,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        cancellationSummary: stores.holidayCreditStore.cancellationSummary,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    if (!fields || !booking) {
        return { priceBreakdownItems: [], totalRefund: 0 };
    }

    const {
        refund,
        paymentInfo: { depositPrice, currency },
        guests,
    } = booking;
    const isHolidaySummaryStep = !stepsState[RefundStep.HolidaySummary].isChecked;
    const originalBookingValue = cancellationSummary?.originalBookingValue ?? 0;
    const totalPayment = isTradePortal ? originalBookingValue : +getTotalPaidAmount(booking.paymentInfo).toFixed(TWO);
    const amendmentFeeAmount = cancellationSummary?.amendmentFeeAmount ?? 0;
    let result: IPriceBreakdownItemWithFlag[] = [];

    if (isHolidaySummaryStep) {
        // In case of trade portal, if original booking value is less than deposit price or 0,
        // it means that customer paid less or equal deposit and they are not eligible for refund,
        // so we show them how much they paid without showing 0 amount for deposit and cancellation charge
        if (isTradePortal && totalPayment <= depositPrice) {
            result.push({
                breakdownTitle: fields?.AmountPaidExcludeDeposit?.value,
                amount: totalPayment,
                showZeroAmount: true,
            });

            return { priceBreakdownItems: filterPriceBreakdownItems(result), totalRefund: totalPayment };
        }

        const paidAmountExcludeDepositAndFee = +(totalPayment - depositPrice - amendmentFeeAmount).toFixed(TWO);

        if (paidAmountExcludeDepositAndFee > 0) {
            result.push({
                breakdownTitle: fields?.AmountPaidExcludeDeposit?.value,
                amount: paidAmountExcludeDepositAndFee,
            });
        }

        if (depositPrice) {
            const guestsNumber = guests.filter(guest => guest.type !== GuestType.Infant).length;
            const depositPP = depositPrice / guestsNumber;
            const pricePP = formatMoney(depositPP, {
                currency,
                maximumFractionDigits: 0,
            });
            const ppLabel = Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
                Tokens.Price,
                pricePP,
            );
            const depositLabel = Tokenizer.replaceToken(fields?.Deposit?.value, Tokens.Price, ppLabel);

            result.push({
                breakdownTitle: depositLabel,
                amount: depositPrice,
            });
        }

        result.push({
            breakdownTitle: fields?.ChangeFeeLabel?.value,
            amount: amendmentFeeAmount,
        });

        return { priceBreakdownItems: filterPriceBreakdownItems(result), totalRefund: totalPayment };
    }

    let totalRefund: number = 0;
    result = [];

    if (isOneTimeUseCreditEnabled || isTradePortal) {
        const amendmentFeeAmountNegative = amendmentFeeAmount * NEGATIVE_INDEX;

        if (!selectedRefundOTUC) {
            const cancellationCharge = +(totalPayment - amendmentFeeAmount).toFixed(TWO);

            result = [
                {
                    breakdownTitle: fields.PaidLabel.value,
                    amount: totalPayment,
                    className: styles.paidTotal,
                    uniqueKey: PriceBreakdownKeys.TotalPaid,
                    showZeroAmount: isTradePortal,
                },
                {
                    breakdownTitle: fields.CancellationChargeTotalLabel.value,
                    amount: totalPayment * NEGATIVE_INDEX,
                    className: styles.chargeFee,
                    uniqueKey: PriceBreakdownKeys.FeeRefund,
                    subItems: [
                        { amount: cancellationCharge * NEGATIVE_INDEX, title: fields.CancellationChargeLabel.value },
                        {
                            amount: amendmentFeeAmountNegative,
                            title: fields.ChangeFeeLabel.value,
                        },
                    ],
                },
            ];

            return { priceBreakdownItems: filterPriceBreakdownItems(result), totalRefund };
        }

        const selectedRefundOptionFields = fields.Children.find(
            item => item.fields.RefundUniqueId.value === selectedRefundOTUC.refundOption,
        )?.fields;

        if (!selectedRefundOptionFields) return { priceBreakdownItems: [], totalRefund };

        const { credit, oneTimeUseCredit, originalPayment, total } = selectedRefundOTUC;
        const cancellationChargeTotal = +(total - totalPayment).toFixed(TWO);
        const cancellationCharge = +(cancellationChargeTotal + amendmentFeeAmount).toFixed(TWO);

        totalRefund = total;
        result = [
            {
                breakdownTitle: fields.PaidLabel.value,
                amount: totalPayment,
                className: styles.paidTotal,
                uniqueKey: PriceBreakdownKeys.TotalPaid,
            },
            {
                breakdownTitle: fields.CancellationChargeTotalLabel.value,
                amount: cancellationChargeTotal,
                uniqueKey: PriceBreakdownKeys.FeeRefund,
                subItems: [
                    { amount: cancellationCharge, title: fields.CancellationChargeLabel.value },
                    {
                        amount: amendmentFeeAmountNegative,
                        title: fields.ChangeFeeLabel.value,
                        className: styles.chargeFeeRowEnd,
                    },
                ],
            },
            {
                breakdownTitle: selectedRefundOptionFields.CreditLabel.value,
                amount: credit + oneTimeUseCredit,
                uniqueKey: PriceBreakdownKeys.CreditRefund,
            },
            {
                breakdownTitle: selectedRefundOptionFields.CashLabel.value,
                amount: originalPayment || 0,
                uniqueKey: PriceBreakdownKeys.CashRefund,
            },
        ];

        return {
            priceBreakdownItems: filterPriceBreakdownItems(result),
            totalRefund,
        };
    }

    const priceBreakdownOld = getPriceBreakdownOldLogic(fields, selectedRefundType, totalPayment, refund);

    return {
        priceBreakdownItems: filterPriceBreakdownItems(priceBreakdownOld.priceBreakdownItems),
        totalRefund: priceBreakdownOld.totalRefund,
    };
};
export const getRefundPopupContentTrade = (
    cancellationSummary: ICancellationSummaryResponse,
    depositPrice: number,
): RefundPopups => {
    const { originalBookingValue = 0, amendmentFeeAmount, cancellationFee = 0 } = cancellationSummary;

    if (originalBookingValue === 0) {
        return RefundPopups.TradeBookingNoPaymentMade;
    }

    const paidAmountExcludeFee = originalBookingValue - amendmentFeeAmount;

    if (paidAmountExcludeFee <= depositPrice) {
        return RefundPopups.TradeBookingDepositOnlyPaid;
    }

    if (paidAmountExcludeFee <= cancellationFee) {
        return RefundPopups.TradeBookingPaidLessThanTotalCharge;
    }

    return RefundPopups.TradeBookingRefund;
};

export const getRefundPopupContent = (
    cancellationSummary: ICancellationSummaryResponse,
    paymentInfo: IPaymentInfo,
    maxDaysToDeparture: number,
    isDestinationRulesApplied?: boolean,
    isFlightAndHotelPackage?: boolean,
): RefundPopups => {
    const totalPayment = getTotalPaidAmount(paymentInfo);
    const { oneTimeUseCreditTotalPaid } = cancellationSummary;
    const isDepositAndFeeOnlyPaid = totalPayment === paymentInfo.depositPrice + cancellationSummary.amendmentFeeAmount;

    if (isDestinationRulesApplied) {
        return RefundPopups.DestinationRulesApplied;
    }

    if (isFlightAndHotelPackage) {
        return getRefundContentFlightAndHotel(cancellationSummary);
    }

    if (cancellationSummary.daysBeforeDeparture < maxDaysToDeparture) {
        return isDepositAndFeeOnlyPaid ? RefundPopups.DepositLess60Days : RefundPopups.DepositBalanceLess60Days;
    }

    if (isDepositAndFeeOnlyPaid) {
        if (oneTimeUseCreditTotalPaid === 0) {
            return RefundPopups.DepositNoOTUC;
        }

        if (oneTimeUseCreditTotalPaid === totalPayment - cancellationSummary.amendmentFeeAmount) {
            return RefundPopups.DepositFullOTUC;
        }

        return RefundPopups.DepositPartialOTUC;
    }

    if (oneTimeUseCreditTotalPaid === 0) {
        return RefundPopups.DepositBalanceNoOTUC;
    }

    if (oneTimeUseCreditTotalPaid >= paymentInfo.depositPrice) {
        return RefundPopups.DepositBalanceFullOTUC;
    }

    return RefundPopups.DepositBalancePartialOTUC;
};

const getRefundContentFlightAndHotel = (cancellationSummary: ICancellationSummaryResponse): RefundPopups => {
    if (cancellationSummary.refunds.length === 0) {
        return RefundPopups.FlightPlusHotelNonRefundable;
    }

    return cancellationSummary.amendmentFeeAmount > 0
        ? RefundPopups.FlightPlusHotelPartiallyRefundable
        : RefundPopups.FlightPlusHotelRefundable;
};
