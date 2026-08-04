import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import PaymentOptionPrice from 'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionPrice/PaymentOptionPrice';
import PaymentMethodCard from 'frontend/components/renderings/Payment/components/PaymentMethodCard';

import styles from './PaymentBaseOption.module.scss';

export interface IPaymentBaseOptionProps {
    checkboxId: string;
    isSelected: boolean;
    title: string;
    children?: React.ReactNode;
    className?: string;
    currency?: CurrencyCode;
    disabled?: boolean;
    onChange?: () => void;
    price?: number;
    priceDescription?: string;
}

const PaymentBaseOption: FC<IPaymentBaseOptionProps> = ({
    onChange,
    isSelected,
    title,
    price,
    priceDescription,
    children,
    checkboxId,
    disabled,
    className,
    currency,
}) => (
    <PaymentMethodCard
        checkboxId={checkboxId}
        title={title}
        isSelected={isSelected}
        onSelect={onChange}
        className={classNames(styles.card, className)}
        notSelectable={disabled}
    >
        <div className={styles.content}>
            {children}
            {!!priceDescription && !!price && (
                <PaymentOptionPrice description={priceDescription} price={price} isTotal currency={currency} />
            )}
        </div>
    </PaymentMethodCard>
);

export default PaymentBaseOption;
