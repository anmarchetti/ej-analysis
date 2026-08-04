import { ReactNode } from 'react';

export interface IPaymentTypeOptionProps {
    clickable: boolean;
    onSelect: () => void;
    variant: 'creditCard' | 'applePay';
    children?: ReactNode;
    className?: string;
    dataTid?: string;
}
