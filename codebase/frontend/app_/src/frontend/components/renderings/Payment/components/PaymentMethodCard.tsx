import React from 'react';
import classNames from 'classnames';

import RadioButton from 'frontend/components/common/RadioButton';

export interface IPaymentMethodCardProps {
    checkboxId: string;
    children: React.ReactNode;
    isSelected: boolean;
    title: string;
    className?: string;
    isFullScreen?: boolean;
    notSelectable?: boolean;
    onSelect?: () => void;
}

export const PaymentMethodCard: React.FC<IPaymentMethodCardProps> = ({
    checkboxId,
    isSelected,
    title,
    className,
    isFullScreen,
    notSelectable,
    onSelect,
    children,
}) => {
    const handleChange = (): void => {
        if (!isSelected) {
            onSelect?.();
        }
    };

    return (
        <div
            className={classNames('payment-card', className, {
                selected: isSelected,
                'payment-card--fullscreen': isFullScreen,
                'payment-card--not-selectable': notSelectable,
            })}
            data-tid={checkboxId}
            onClick={handleChange}
        >
            <div className='payment-card-head'>
                {notSelectable ? (
                    <div className='radio__label'>{title}</div>
                ) : (
                    <RadioButton name='payment-method' label={title} checked={isSelected} id={checkboxId} readOnly />
                )}
            </div>
            <div className='payment-card-body'>{children}</div>
        </div>
    );
};

export default PaymentMethodCard;
