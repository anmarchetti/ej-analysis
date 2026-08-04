import React, { forwardRef } from 'react';
import classNames from 'classnames';

import { IPaymentTypeOptionProps } from './interfaces';

import styles from './PaymentOptionWrapper.module.scss';

const PaymentOptionWrapper = forwardRef<HTMLDivElement, IPaymentTypeOptionProps>(
    ({ clickable, onSelect, dataTid, variant, className, children }, ref) => {
        const combinedClass = classNames({
            [styles.paymentTypeButton]: true,
            [styles.clickable]: clickable,
            [styles.creditCard]: variant === 'creditCard',
            [styles.applePay]: variant === 'applePay',
            [className || '']: !!className,
        });

        return (
            <div data-tid={dataTid} className={styles.paymentType} ref={ref}>
                {clickable ? (
                    // NOSONAR_BEGIN
                    // Accessibility issue: S6848, S1082. The div is clickable but not a button. ARC Toolkit vs Sonar.
                    <div className={combinedClass} onClick={onSelect} data-tid={`clickable-${dataTid}`}>
                        {children}
                    </div>
                ) : (
                    // NOSONAR_END
                    <div className={combinedClass}>{children}</div>
                )}
            </div>
        );
    },
);

export default PaymentOptionWrapper;
