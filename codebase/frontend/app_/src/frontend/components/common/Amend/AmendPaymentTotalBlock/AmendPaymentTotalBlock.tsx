import React, { FunctionComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { SignDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { isDefined } from 'frontend/utils/object.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { PaymentType } from 'models/enum/PaymentType';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SVGLockFilled from 'frontend/components/icons-new/LockFilled';
import { IPaymentDetailsProps } from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/interfaces';
import { ApplePayButton } from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayButton';
import { gaClickToAmendPaymentPage } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';

import styles from './AmendPaymentTotalBlock.module.scss';

interface IAmendPaymentTotalBlockProps extends IPaymentDetailsProps {
    children?: ReactNode;
    confirmLabel?: string;
    hasError?: boolean;
    isFullCreditPayment?: boolean;
    onPayWithApplePay?: any;
    shouldPayNow?: boolean;
    validateFormAndScrollToError?: () => boolean;
}

export const AmendPaymentTotalBlock: FunctionComponent<IAmendPaymentTotalBlockProps> = ({
    hasError,
    price,
    subtitle,
    title,
    confirmLabel,
    updatedBalanceAmount,
    children,
    isFullCreditPayment,
    validateFormAndScrollToError,
    onPayWithApplePay,
    shouldPayNow,
}) => {
    const { pushTrackingEvent } = usePaymentTracking();
    const {
        isPaymentAllowed,
        onPay,
        canPay,
        formatMoney,
        currency,
        balanceDueDate,
        paymentOption,
        usedCredit,
        selectedPaymentType,
        isRefund,
        totalPrice,
    } = useStore((stores: TStores) => ({
        isPaymentAllowed: stores.payStore.isPaymentAllowed,
        onPay: stores.amendPaymentStore.onPay,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.amendPaymentStore.currency,
        canPay: isHolidayStore(stores) ? stores.amendPaymentStore.canPay : true,
        balanceDueDate: isHolidayStore(stores) ? stores.amendPaymentStore.addToBalanceDueDate : undefined,
        paymentOption: isHolidayStore(stores) ? stores.amendPaymentStore.paymentOption : undefined,
        usedCredit: stores.payStore.usedCredit,
        selectedPaymentType: isTradeStore(stores) ? PaymentType.Card : stores.paymentTypeStore.selectedPaymentType,
        isRefund: isHolidayStore(stores) ? stores.amendPaymentStore.isRefund : undefined,
        totalPrice: stores.amendPaymentStore.totalPrice,
    }));

    const formattedTotalPrice = formatMoney(price ?? 0, {
        currency,
        signDisplay: SignDisplay.AUTO,
    });

    const balanceAmount = formatMoney(updatedBalanceAmount ?? 0, {
        currency,
        signDisplay: SignDisplay.AUTO,
    });

    const shouldRenderPrice = isDefined(price);

    const showApplePayButton =
        selectedPaymentType === PaymentType.ApplePay &&
        !isFullCreditPayment &&
        !isRefund &&
        totalPrice !== 0 &&
        shouldPayNow;

    const showConfirmAndPayButton =
        (!hasError &&
            (selectedPaymentType === PaymentType.Card || isFullCreditPayment || isRefund || totalPrice === 0)) ||
        !shouldPayNow;

    const formattedSubtitle = Tokenizer.replaceTokens(subtitle?.value, {
        [Tokens.BalanceAmount]: `<strong data-cs-mask="true">${balanceAmount}</strong>`,
        [Tokens.Date]: `<strong data-cs-mask="true">${formatDateL10n(balanceDueDate, DATE_FORMATS.L)}</strong>`,
    });

    const handlePay = (): void => {
        pushTrackingEvent(gaClickToAmendPaymentPage(canPay, paymentOption, usedCredit));
        onPay(undefined, false, pushTrackingEvent);
    };

    return (
        <div data-tid='amend-payment-total'>
            <div className={styles.total}>
                <div className={classNames(styles.totalContent, !subtitle && styles.noSubtitle)}>
                    {!!title && (
                        <span data-tid='amend-payment-total-title' className={styles.title}>
                            {title} {shouldRenderPrice && formattedTotalPrice}
                        </span>
                    )}
                    {!!formattedSubtitle && !!title && (
                        <RichTextWithLinks
                            field={{ value: formattedSubtitle }}
                            className={styles.subtitle}
                            dataId='amend-payment-total-subtitle'
                        />
                    )}
                </div>
                {showConfirmAndPayButton && (
                    <Button
                        dataTid='amend-payment-confirm-button'
                        className={styles.confirmButton}
                        isFullWidth
                        onClick={handlePay}
                        hasDisabledStyles={!canPay}
                        disabled={!isPaymentAllowed}
                        isLarge
                    >
                        <SVGLockFilled />
                        {confirmLabel}
                    </Button>
                )}

                {showApplePayButton && (
                    <ApplePayButton
                        amountToPay={price!}
                        formValidation={validateFormAndScrollToError}
                        onPaymentAuthorised={onPayWithApplePay}
                        className={styles.customApplePayButtonClass}
                        hasDisabledOverlay={!canPay}
                    />
                )}
            </div>
            {children}
        </div>
    );
};
export default observer(AmendPaymentTotalBlock);
