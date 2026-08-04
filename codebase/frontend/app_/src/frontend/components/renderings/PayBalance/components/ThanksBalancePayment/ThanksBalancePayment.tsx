import React, { useMemo } from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { TStores } from 'frontend/store/IStores';
import { IPayDetailsFull, IPayDetailsFullWithApplePay } from 'models/data/payment/IPayDetails';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';
import SvgSuccessFilled from 'frontend/components/icons-new/SuccessFilled';

import { CreditMethodItem } from './CreditMethodItem';
import { IThanksBalancePaymentProps } from './interfaces';
import { PayMethodItem } from './PayMethodItem';

import styles from './ThanksBalancePayment.module.scss';

export const ThanksBalancePayment: React.FC<IThanksBalancePaymentProps> = props => {
    const { booking, paidDetails, getPhrase } = props;

    const currency = booking?.paymentInfo?.currency;

    const lastPayment = useMemo(() => {
        const history = booking?.paymentInfo?.paymentHistory ?? [];

        return history.length ? history[history.length - 1] : undefined;
    }, [booking?.paymentInfo?.paymentHistory]);

    const totalPaid = useMemo(() => {
        const info = booking?.paymentInfo;

        return (info?.totalPrice ?? 0) - (info?.balanceDueAmount ?? 0);
    }, [booking?.paymentInfo]);

    const hasCreditPayment = useMemo(() => (paidDetails?.creditAmount ?? 0) > 0, [paidDetails]);
    const hasCardPayment = useMemo(() => (paidDetails as IPayDetailsFull)?.amount > 0, [paidDetails]);

    const hasApplePayPayment = useMemo(() => {
        const details = paidDetails as Partial<IPayDetailsFullWithApplePay> | undefined;

        if (!details) return false;

        const isApplePay = details.cardType === 'ApplePay' || !!details.token;

        return Boolean(isApplePay && details.amount && details.amount > 0);
    }, [paidDetails]);

    const maskApplePayCardNumber = useMemo(() => {
        const details = paidDetails as Partial<IPayDetailsFullWithApplePay> | undefined;
        const cardNumber = details?.token?.paymentMethod?.displayName ?? '';
        const lastDigits = cardNumber.replace(/\D/g, '');

        // eslint-disable-next-line no-magic-numbers
        return new Array(3).fill('****').concat(lastDigits).join(' ');
    }, [paidDetails]);

    const hasMultiplePayments = hasCardPayment && hasCreditPayment;

    const currentTotalPaid = useMemo(() => {
        if (!paidDetails) return lastPayment ? lastPayment.amount : 0;

        const asFull = paidDetails as IPayDetailsFull;

        return (asFull.amount ?? 0) + (paidDetails.creditAmount ?? 0);
    }, [paidDetails, lastPayment]);

    return (
        <div className={styles.wrapperSolid}>
            <div className={styles.wrapperContainer}>
                <h1 className={styles.title}>{getPhrase(SitecoreDictionary.PaymentTitlesThanksForPayment)}</h1>

                {!!(
                    getPhrase(SitecoreDictionary.PaymentLabelsPayBalanceSuccessTitle) ||
                    getPhrase(SitecoreDictionary.PaymentLabelsPayBalanceSuccessDesc)
                ) && (
                    <ErrorMessage
                        message={getPhrase(SitecoreDictionary.PaymentLabelsPayBalanceSuccessTitle)}
                        description={getPhrase(SitecoreDictionary.PaymentLabelsPayBalanceSuccessDesc)}
                        icon={<SvgSuccessFilled />}
                        IsSuccess
                    />
                )}

                <div>
                    {currentTotalPaid > 0 && (
                        <div className={styles.total}>
                            <div>{getPhrase(SitecoreDictionary.PaymentLabelsAmountPaidToday)}</div>
                            <div>
                                <span data-tid='amount-paid-today' className={styles.bigPrice}>
                                    <FormattedMoney
                                        amount={currentTotalPaid}
                                        className={styles.subtext}
                                        options={{
                                            currency,
                                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                        }}
                                    />
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.list}>
                        {hasCreditPayment && (
                            <CreditMethodItem
                                creditAmount={paidDetails?.creditAmount ?? 0}
                                showSplitAmount={hasMultiplePayments}
                                currency={currency}
                                formatMoney={props.formatMoney}
                                getPhrase={getPhrase}
                            />
                        )}

                        {hasCardPayment && (
                            <PayMethodItem
                                details={paidDetails as IPayDetailsFull}
                                showSplitAmount={hasMultiplePayments}
                                currency={currency}
                                formatMoney={props.formatMoney}
                                getPhrase={getPhrase}
                                hasApplePayPayment={hasApplePayPayment}
                                maskApplePayCardNumber={maskApplePayCardNumber}
                            />
                        )}

                        <div className={classNames(styles.listItem)}>
                            <span>{getPhrase(SitecoreDictionary.PaymentLabelsTotalCost)}</span>
                            <span>
                                {props.formatMoney(booking?.paymentInfo?.totalPrice, {
                                    currency,
                                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                })}
                            </span>
                        </div>

                        <div className={classNames(styles.listItem)}>
                            <span>{getPhrase(SitecoreDictionary.PaymentLabelsPaidToDate)}</span>
                            <span>
                                {props.formatMoney(totalPaid, {
                                    currency,
                                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                })}
                            </span>
                        </div>
                    </div>

                    <div className={styles.total}>
                        <div>{getPhrase(SitecoreDictionary.PaymentLabelsRemainingBalance)}</div>
                        <div>
                            <span data-tid='remaining-balance-price' className={styles.bigPrice}>
                                <FormattedMoney
                                    amount={booking?.paymentInfo?.balanceDueAmount ?? 0}
                                    className={styles.subtext}
                                    options={{ currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }}
                                />
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.buttonWrapper}>
                    <Button onClick={props.onBack} data-tid='back-button'>
                        {getPhrase(SitecoreDictionary.PaymentButtonsBackToBooking)}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    formatMoney: stores.marketStore.formatMoney,
}))(ThanksBalancePayment);
